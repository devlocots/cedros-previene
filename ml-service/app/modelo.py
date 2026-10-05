"""
Lógica del modelo de riesgo de diabetes mellitus tipo 2.

- Entrena un Random Forest calibrado con el Pima Indians Diabetes Dataset.
- Imputa por mediana los valores que faltan (HU03).
- Devuelve la probabilidad y la contribución aproximada de cada variable.

No depende de FastAPI, así se puede probar con pytest de forma aislada.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, brier_score_loss, precision_score,
                             recall_score, roc_auc_score)
from sklearn.model_selection import train_test_split

BASE = Path(__file__).resolve().parent.parent
DATA_PATH = BASE / "data" / "diabetes.csv"
ART_DIR = BASE / "artefactos"
MODEL_PATH = ART_DIR / "modelo_rf.joblib"
METRICS_PATH = ART_DIR / "metricas.json"

VERSION = "rf-v1.0"
SEMILLA = 42

# Orden de las 8 variables del Pima Indians Diabetes Dataset
FEATURES = ["embarazos", "glucosa", "presion", "pliegue", "insulina", "imc", "pedigree", "edad"]
COLUMNAS_KAGGLE = ["Pregnancies", "Glucose", "BloodPressure", "SkinThickness", "Insulin",
                   "BMI", "DiabetesPedigreeFunction", "Age", "Outcome"]
# En el dataset, un 0 en estas variables significa "dato no registrado"
CERO_ES_FALTANTE = ["glucosa", "presion", "pliegue", "insulina", "imc"]
# Variables que el usuario puede dejar vacías (se imputan por mediana)
OPCIONALES = ["glucosa", "presion", "pliegue", "insulina"]

NOMBRES = {
    "embarazos": "Embarazos", "glucosa": "Glucosa", "presion": "Presión diastólica",
    "pliegue": "Pliegue cutáneo", "insulina": "Insulina", "imc": "IMC",
    "pedigree": "Antecedente familiar", "edad": "Edad",
}


class DatasetNoEncontrado(RuntimeError):
    pass


def cargar_dataset(ruta: Path = DATA_PATH) -> pd.DataFrame:
    """Lee el CSV con o sin encabezados y devuelve columnas en español + 'diabetes'."""
    if not ruta.exists():
        raise DatasetNoEncontrado(
            f"No se encontró el dataset en {ruta}. Copie el archivo diabetes.csv "
            "(Pima Indians Diabetes Dataset, 768 filas) en la carpeta ml-service/data/."
        )
    df = pd.read_csv(ruta)
    if list(df.columns[:9]) != COLUMNAS_KAGGLE:
        # Formato sin encabezado (versión UCI)
        df = pd.read_csv(ruta, header=None)
        if df.shape[1] < 9:
            raise ValueError("El CSV debe tener 9 columnas: 8 variables + Outcome.")
        df = df.iloc[:, :9]
        df.columns = COLUMNAS_KAGGLE
    df = df[COLUMNAS_KAGGLE].copy()
    df.columns = FEATURES + ["diabetes"]
    for col in CERO_ES_FALTANTE:
        df.loc[df[col] == 0, col] = np.nan
    return df


def _crear_estimador():
    """Random Forest con balanceo SMOTE si imbalanced-learn está instalado."""
    rf = RandomForestClassifier(
        n_estimators=300, min_samples_leaf=2, max_features="sqrt",
        random_state=SEMILLA, n_jobs=-1,
    )
    try:
        from imblearn.over_sampling import SMOTE
        from imblearn.pipeline import Pipeline as ImbPipeline
        return ImbPipeline([("smote", SMOTE(random_state=SEMILLA)), ("rf", rf)]), "SMOTE"
    except ImportError:
        rf.set_params(class_weight="balanced_subsample")
        return rf, "class_weight"


def entrenar(ruta: Path = DATA_PATH) -> dict:
    """Entrena, evalúa con 30 % de prueba y guarda el modelo y sus métricas."""
    df = cargar_dataset(ruta)
    X, y = df[FEATURES], df["diabetes"].astype(int)
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.30, stratify=y, random_state=SEMILLA)

    medianas = {k: float(v) for k, v in X_tr.median().items()}
    X_tr = X_tr.fillna(medianas)
    X_te = X_te.fillna(medianas)

    base, balanceo = _crear_estimador()
    modelo = CalibratedClassifierCV(base, method="sigmoid", cv=5)
    try:
        modelo.fit(X_tr, y_tr)
    except Exception:  # si SMOTE falla, se entrena con pesos balanceados
        base = RandomForestClassifier(n_estimators=300, min_samples_leaf=2,
                                      class_weight="balanced_subsample",
                                      random_state=SEMILLA, n_jobs=-1)
        balanceo = "class_weight"
        modelo = CalibratedClassifierCV(base, method="sigmoid", cv=5)
        modelo.fit(X_tr, y_tr)

    prob = modelo.predict_proba(X_te)[:, 1]
    pred = (prob >= 0.5).astype(int)
    metricas = {
        "version": VERSION,
        "algoritmo": "Random Forest calibrado (sigmoid, cv=5)",
        "balanceo": balanceo,
        "registros_entrenamiento": int(len(X_tr)),
        "registros_prueba": int(len(X_te)),
        "positivos_prueba": int(y_te.sum()),
        "sensibilidad": round(float(recall_score(y_te, pred)), 4),
        "precision": round(float(precision_score(y_te, pred, zero_division=0)), 4),
        "exactitud": round(float(accuracy_score(y_te, pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_te, prob)), 4),
        "brier_score": round(float(brier_score_loss(y_te, prob)), 4),
        "fecha_entrenamiento": time.strftime("%Y-%m-%d"),
        "sklearn": sklearn.__version__,
    }
    ART_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"modelo": modelo, "medianas": medianas, "features": FEATURES,
                 "version": VERSION, "sklearn": sklearn.__version__}, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metricas, indent=2, ensure_ascii=False), encoding="utf-8")
    return metricas


@dataclass
class Predictor:
    modelo: object
    medianas: dict
    version: str
    metricas: dict

    def predecir(self, datos: dict) -> dict:
        inicio = time.perf_counter()
        fila, imputados = {}, []
        for f in FEATURES:
            v = datos.get(f)
            if v is None:
                if f not in OPCIONALES:
                    raise ValueError(f"Falta la variable obligatoria: {f}")
                v = self.medianas[f]
                imputados.append(f)
            fila[f] = float(v)

        # Fila original + una fila por variable con su valor reemplazado por la mediana.
        # La diferencia de probabilidad es la contribución aproximada de esa variable.
        filas = [fila] + [{**fila, f: self.medianas[f]} for f in FEATURES]
        X = pd.DataFrame(filas, columns=FEATURES)
        probs = self.modelo.predict_proba(X)[:, 1]
        p = float(probs[0])

        factores = []
        for i, f in enumerate(FEATURES, start=1):
            contribucion = 0.0 if f in imputados else p - float(probs[i])
            factores.append({"variable": f, "nombre": NOMBRES[f], "valor": fila[f],
                             "contribucion": round(contribucion, 4), "imputado": f in imputados})
        factores.sort(key=lambda d: abs(d["contribucion"]), reverse=True)
        for orden, fac in enumerate(factores, start=1):
            fac["orden"] = orden

        return {
            "probabilidad": round(p, 4),
            "imputados": imputados,
            "factores": factores,
            "version": self.version,
            "tiempo_ms": round((time.perf_counter() - inicio) * 1000, 1),
        }


def cargar_o_entrenar() -> Predictor:
    """Carga el modelo guardado; si no existe o es de otra versión de scikit-learn, lo entrena."""
    paquete = None
    if MODEL_PATH.exists():
        try:
            paquete = joblib.load(MODEL_PATH)
            if paquete.get("sklearn") != sklearn.__version__:
                paquete = None
        except Exception:
            paquete = None
    if paquete is None:
        entrenar()
        paquete = joblib.load(MODEL_PATH)
    metricas = json.loads(METRICS_PATH.read_text(encoding="utf-8")) if METRICS_PATH.exists() else {}
    return Predictor(paquete["modelo"], paquete["medianas"], paquete["version"], metricas)
