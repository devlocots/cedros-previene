# Cedros Previene · Sprint 1

Software web para la estimación del riesgo de diabetes mellitus tipo 2 en adultos de la
Urbanización Los Cedros de Villa, Chorrillos, 2026.

| Carpeta | Tecnología | Puerto |
|---|---|---|
| `db/` | Script MySQL 8 / MariaDB (XAMPP) | 3306 |
| `backend/` | NestJS + TypeScript (API REST, login JWT) | 3000 |
| `frontend/` | Angular (test público y panel del personal) | 4200 |
| `ml-service/` | Python + FastAPI (Random Forest) · **opcional en el Sprint 1** | 8000 |

Si el servicio de ML no está encendido, el backend usa un **modelo provisional** (regresión
logística con coeficientes fijos) para que todo el flujo funcione. En el resultado aparece
como `provisional-v0`. Cuando se encienda el servicio de ML, se usa el Random Forest.

---

## 1. Requisitos (instalar una sola vez)

- **Node.js 22 LTS** (o 20.19+): https://nodejs.org → comprobar con `node -v`
- **XAMPP** (MySQL/MariaDB): https://www.apachefriends.org
- **Visual Studio Code**
- *(Opcional, para el ML)* **Python 3.11 o 3.12** con "Add Python to PATH"

## 2. Base de datos (XAMPP)

1. Abra el panel de XAMPP y presione **Start** en **MySQL**.
2. Entre a http://localhost/phpmyadmin (necesita también **Apache** encendido).
3. Pestaña **Importar** → elija `db/modelo_datos_mysql.sql` → **Importar**.
   Se crea la base `cedros_previene` con 10 tablas, los triggers y los 4 roles.

> Con MySQL Workbench: *File → Open SQL Script* → abra el mismo archivo → ejecutar (⚡).

## 3. Backend (NestJS)

Abra una terminal en VS Code (*Terminal → New Terminal*):

```bash
cd backend
copy .env.example .env      # en Mac/Linux: cp .env.example .env
npm install
npm run start:dev
```

Debe aparecer: `API lista en http://localhost:3000/api`.
Al arrancar por primera vez crea los **usuarios de prueba** (contraseña `Cedros2026!`):

| Correo | Rol |
|---|---|
| tamizaje1@cedrosprevine.pe | Tamizaje |
| medico1@cedrosprevine.pe | Médico |
| jefatura@cedrosprevine.pe | Jefatura |
| admin@cedrosprevine.pe | Admin |

Comprobar:
- http://localhost:3000/api/health → estado de la API, la base de datos y el ML
- http://localhost:3000/api/docs → documentación Swagger de la API

Si su MySQL tiene contraseña, póngala en `DB_PASSWORD` dentro de `backend/.env`.

## 4. Frontend (Angular)

En **otra** terminal:

```bash
cd frontend
npm install
npm start
```

Abra http://localhost:4200

- `/` → test público paso a paso (sin cuenta)
- `/login` → acceso del personal → panel con **Nueva evaluación** e **Historial**

## 5. Servicio de ML (opcional en el Sprint 1)

1. Copie su archivo **`diabetes.csv`** (Pima Indians Diabetes Dataset, 768 filas) en `ml-service/data/`.
2. En otra terminal:

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate          # PowerShell. En Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
python entrenar.py              # entrena y muestra sensibilidad, ROC-AUC y Brier score
uvicorn app.main:app --port 8000
```

3. Reinicie el backend (`Ctrl + C` y `npm run start:dev`) para que registre el modelo `rf-v1.0`
   en la tabla `modelo_ml`. Desde ese momento las evaluaciones usan el Random Forest.

Documentación del servicio: http://localhost:8000/docs

## 6. Pruebas

```bash
cd backend && npm test          # validación de rangos (HU02), IMC y niveles de riesgo
cd ml-service && pytest         # imputación por mediana (HU03) y predicción (HU04)
```

## 7. Guion para la revisión del Sprint 1

1. **Modelo de datos:** mostrar en phpMyAdmin la base `cedros_previene` y sus 10 tablas
   (pestaña *Diseñador* para el diagrama).
2. **Test público:** en http://localhost:4200 hacer el test completo como residente.
   Probar un error de validación (por ejemplo, edad 15) y ver el mensaje con el rango válido.
3. **Resultado:** probabilidad, nivel de riesgo, factores y recomendaciones.
4. **Login:** entrar con una contraseña incorrecta (mensaje de error) y luego con la correcta.
5. **Nueva evaluación:** "Cargar ejemplo" → "Calcular riesgo". Dejar insulina vacía y mostrar
   que se completó con la mediana (HU03).
6. **Historial:** ver las evaluaciones guardadas y filtrar por nivel.
7. **Base de datos:** en phpMyAdmin, mostrar las filas nuevas en `participante`,
   `registro_clinico`, `evaluacion_riesgo`, `factor_influyente` y `bitacora_acceso`.
   Intentar editar una evaluación: el trigger lo impide (HU07).
8. **API:** abrir http://localhost:3000/api/docs.

## 8. Problemas frecuentes

| Problema | Solución |
|---|---|
| `ECONNREFUSED 3306` o "No se pudo preparar la base de datos" | Encienda MySQL en XAMPP e importe el script. |
| `Access denied for user 'root'` | Ponga la contraseña de MySQL en `DB_PASSWORD` del `.env`. |
| "No se pudo conectar con el servidor" en la web | El backend no está encendido (`npm run start:dev`). |
| No puedo iniciar sesión | Revise que el backend haya mostrado "Usuarios de prueba creados" la primera vez. |
| PowerShell no deja activar `.venv` | Ejecute `Set-ExecutionPolicy -Scope Process Bypass` y vuelva a intentar. |
| `npm install` muestra errores de dependencias | Ejecute `npm install --legacy-peer-deps`. |

## 9. Publicación en internet (siguiente sprint)

- **Base de datos:** Aiven MySQL (plan gratuito) → importar el script → poner sus datos en el `.env` del backend con `DB_SSL=true`.
- **Backend y ML:** Render (Web Service). Backend: `npm install && npm run build`, inicio `npm run start:prod`.
  ML: `pip install -r requirements.txt`, inicio `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Frontend:** Vercel. Cambie la URL del backend en `frontend/src/environments/environment.ts`
  y agregue la URL de Vercel en `FRONTEND_URL` del backend.
