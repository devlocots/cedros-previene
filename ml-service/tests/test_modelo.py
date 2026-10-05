import numpy as np
import pandas as pd
import pytest

from app import modelo as m


@pytest.fixture(scope="module")
def predictor(tmp_path_factory):
    """Entrena con un dataset sintético con el mismo formato que Pima (no reemplaza al real)."""
    d = tmp_path_factory.mktemp("datos")
    rng = np.random.default_rng(0)
    n = 400
    glucosa = rng.normal(120, 30, n).clip(50, 199)
    imc = rng.normal(32, 7, n).clip(18, 60)
    edad = rng.integers(21, 80, n)
    z = -9 + 0.035 * glucosa + 0.09 * imc + 0.03 * edad
    y = (rng.random(n) < 1 / (1 + np.exp(-z))).astype(int)
    df = pd.DataFrame({
        "Pregnancies": rng.integers(0, 10, n), "Glucose": glucosa.round(),
        "BloodPressure": rng.normal(72, 12, n).round(), "SkinThickness": rng.integers(0, 50, n),
        "Insulin": rng.integers(0, 300, n), "BMI": imc.round(1),
        "DiabetesPedigreeFunction": rng.uniform(0.08, 2.0, n).round(3), "Age": edad, "Outcome": y,
    })
    ruta = d / "diabetes.csv"
    df.to_csv(ruta, index=False)
    m.ART_DIR = d / "artefactos"
    m.MODEL_PATH = m.ART_DIR / "modelo_rf.joblib"
    m.METRICS_PATH = m.ART_DIR / "metricas.json"
    metricas = m.entrenar(ruta)
    assert 0 <= metricas["roc_auc"] <= 1
    import joblib
    paq = joblib.load(m.MODEL_PATH)
    return m.Predictor(paq["modelo"], paq["medianas"], paq["version"], metricas)


def test_ceros_se_convierten_en_faltantes(tmp_path):
    ruta = tmp_path / "d.csv"
    pd.DataFrame([[1, 0, 70, 0, 0, 30.0, 0.5, 40, 1]], columns=m.COLUMNAS_KAGGLE).to_csv(ruta, index=False)
    df = m.cargar_dataset(ruta)
    assert pd.isna(df.loc[0, "glucosa"]) and pd.isna(df.loc[0, "insulina"])
    assert df.loc[0, "presion"] == 70


def test_csv_sin_encabezado(tmp_path):
    ruta = tmp_path / "d.csv"
    ruta.write_text("6,148,72,35,0,33.6,0.627,50,1\n1,85,66,29,0,26.6,0.351,31,0\n")
    df = m.cargar_dataset(ruta)
    assert list(df.columns) == m.FEATURES + ["diabetes"] and len(df) == 2


def test_prediccion_completa(predictor):
    r = predictor.predecir({"embarazos": 2, "glucosa": 150, "presion": 80, "pliegue": 30,
                            "insulina": 120, "imc": 33, "pedigree": 0.5, "edad": 50})
    assert 0 <= r["probabilidad"] <= 1
    assert r["imputados"] == []
    assert len(r["factores"]) == 8 and r["factores"][0]["orden"] == 1


def test_imputacion_por_mediana(predictor):
    r = predictor.predecir({"embarazos": 0, "glucosa": None, "presion": None, "pliegue": None,
                            "insulina": None, "imc": 25, "pedigree": 0.2, "edad": 30})
    assert set(r["imputados"]) == {"glucosa", "presion", "pliegue", "insulina"}
    for f in r["factores"]:
        if f["imputado"]:
            assert f["contribucion"] == 0
            assert f["valor"] == predictor.medianas[f["variable"]]


def test_riesgo_mayor_con_glucosa_alta(predictor):
    base = {"embarazos": 1, "presion": 70, "pliegue": 25, "insulina": 100, "imc": 30,
            "pedigree": 0.4, "edad": 45}
    bajo = predictor.predecir({**base, "glucosa": 85})["probabilidad"]
    alto = predictor.predecir({**base, "glucosa": 190})["probabilidad"]
    assert alto > bajo


def test_falta_variable_obligatoria(predictor):
    with pytest.raises(ValueError):
        predictor.predecir({"embarazos": 1, "imc": None, "pedigree": 0.4, "edad": 45})
