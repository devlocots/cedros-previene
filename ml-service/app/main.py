"""
Servicio de ML de Cedros Previene (FastAPI).

Ejecutar:  uvicorn app.main:app --reload --port 8000
Docs:      http://localhost:8000/docs
"""
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from .modelo import DatasetNoEncontrado, cargar_o_entrenar

_predictor = None
_error_carga: Optional[str] = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Al iniciar, carga el modelo (o lo entrena si todavía no existe)."""
    global _predictor, _error_carga
    try:
        _predictor = cargar_o_entrenar()
    except DatasetNoEncontrado as e:
        _error_carga = str(e)
    yield


app = FastAPI(title="Cedros Previene · Servicio de ML", version="1.0", lifespan=lifespan)


def verificar_clave(x_api_key: Optional[str] = Header(default=None)):
    clave = os.getenv("ML_API_KEY")
    if clave and x_api_key != clave:
        raise HTTPException(status_code=401, detail="Clave del servicio de ML incorrecta")


def predictor():
    if _predictor is None:
        raise HTTPException(status_code=503, detail=_error_carga or "El modelo no está cargado")
    return _predictor


class DatosEntrada(BaseModel):
    embarazos: int = Field(ge=0, le=20)
    glucosa: Optional[float] = Field(default=None, ge=40, le=400)
    presion: Optional[float] = Field(default=None, ge=30, le=140)
    pliegue: Optional[float] = Field(default=None, ge=5, le=100)
    insulina: Optional[float] = Field(default=None, ge=10, le=900)
    imc: float = Field(ge=12, le=70)
    pedigree: float = Field(ge=0.05, le=2.5)
    edad: int = Field(ge=18, le=100)


@app.get("/health")
def health():
    if _predictor is None:
        return {"estado": "sin_modelo", "detalle": _error_carga}
    return {"estado": "ok", "version": _predictor.version, "metricas": _predictor.metricas}


@app.post("/predict", dependencies=[Depends(verificar_clave)])
def predict(datos: DatosEntrada, p=Depends(predictor)):
    return p.predecir(datos.model_dump())
