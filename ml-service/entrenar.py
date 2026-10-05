"""Entrena el modelo manualmente:  python entrenar.py"""
import json
from app.modelo import entrenar

if __name__ == "__main__":
    metricas = entrenar()
    print(json.dumps(metricas, indent=2, ensure_ascii=False))
    print("Modelo guardado en artefactos/modelo_rf.joblib")
