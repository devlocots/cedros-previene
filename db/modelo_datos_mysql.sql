-- =====================================================================
-- Cedros Previene - Modelo de datos (MySQL 8.0 / MariaDB 10.6+)
-- Software web para la estimación del riesgo de diabetes mellitus tipo 2
-- Urbanización Los Cedros de Villa, Chorrillos, 2026
-- Sprint 1 - versión 1.1 (migrado de PostgreSQL a MySQL)
-- RNF06 / Ley 29733: no se almacenan nombres, DNI ni datos de contacto
-- de los participantes; solo un código anónimo.
-- Uso local: XAMPP (phpMyAdmin) o MySQL Workbench. Nube: Aiven MySQL.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS cedros_previene
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cedros_previene;

CREATE TABLE rol (
    id_rol        TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(30)  NOT NULL UNIQUE,      -- Tamizaje, Médico, Jefatura, Admin
    descripcion   VARCHAR(150)
) ENGINE=InnoDB;

CREATE TABLE usuario (
    id_usuario     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_rol         TINYINT UNSIGNED NOT NULL,
    nombres        VARCHAR(100) NOT NULL,
    correo         VARCHAR(120) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,             -- bcrypt
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso  DATETIME     NULL,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
) ENGINE=InnoDB;

CREATE TABLE participante (
    id_participante     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo_anonimo      VARCHAR(12)  NOT NULL UNIQUE,  -- P-000123
    sexo                CHAR(1)      NOT NULL,
    canal               VARCHAR(25)  NOT NULL,
    consentimiento      BOOLEAN      NOT NULL,
    id_usuario_registro INT UNSIGNED NULL,             -- NULL en autoevaluación
    fecha_registro      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_part_sexo    CHECK (sexo IN ('F','M')),
    CONSTRAINT chk_part_canal   CHECK (canal IN ('Autoevaluación web','Tamizaje asistido')),
    CONSTRAINT chk_part_consent CHECK (consentimiento = TRUE),
    CONSTRAINT fk_part_usuario  FOREIGN KEY (id_usuario_registro) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE lote_evaluacion (
    id_lote          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario       INT UNSIGNED NOT NULL,
    nombre_archivo   VARCHAR(150) NOT NULL,
    total_registros  INT UNSIGNED NOT NULL,
    estado           VARCHAR(12)  NOT NULL DEFAULT 'Pendiente',
    fecha_carga      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_lote_total  CHECK (total_registros > 0),
    CONSTRAINT chk_lote_estado CHECK (estado IN ('Pendiente','Procesado','Error')),
    CONSTRAINT fk_lote_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;

-- Las 8 variables del modelo (Pima Indians Diabetes Dataset) + datos de captura.
-- Rangos fisiológicos según HU02. Insulina, pliegue, glucosa y presión son opcionales:
-- si faltan, el preprocesamiento (HU03) los imputa por la mediana.
CREATE TABLE registro_clinico (
    id_registro          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_participante      INT UNSIGNED NOT NULL,
    id_lote              INT UNSIGNED NULL,
    embarazos            TINYINT UNSIGNED NOT NULL DEFAULT 0,
    glucosa              DECIMAL(5,1) NULL,     -- mg/dL
    presion_diastolica   DECIMAL(5,1) NULL,     -- mmHg
    pliegue_cutaneo      DECIMAL(5,1) NULL,     -- mm
    insulina             DECIMAL(6,1) NULL,     -- µU/mL
    peso_kg              DECIMAL(5,1) NULL,
    talla_cm             DECIMAL(5,1) NULL,
    imc                  DECIMAL(4,1) NOT NULL, -- kg/m²
    antecedente_familiar VARCHAR(12)  NULL,
    pedigree_diabetes    DECIMAL(4,3) NOT NULL,
    edad                 TINYINT UNSIGNED NOT NULL,
    campos_imputados     VARCHAR(120) NULL,     -- ej. 'insulina,pliegue_cutaneo'
    fecha_registro       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reg_embarazos CHECK (embarazos BETWEEN 0 AND 20),
    CONSTRAINT chk_reg_glucosa   CHECK (glucosa IS NULL OR glucosa BETWEEN 40 AND 400),
    CONSTRAINT chk_reg_presion   CHECK (presion_diastolica IS NULL OR presion_diastolica BETWEEN 30 AND 140),
    CONSTRAINT chk_reg_pliegue   CHECK (pliegue_cutaneo IS NULL OR pliegue_cutaneo BETWEEN 5 AND 100),
    CONSTRAINT chk_reg_insulina  CHECK (insulina IS NULL OR insulina BETWEEN 10 AND 900),
    CONSTRAINT chk_reg_peso      CHECK (peso_kg IS NULL OR peso_kg BETWEEN 30 AND 250),
    CONSTRAINT chk_reg_talla     CHECK (talla_cm IS NULL OR talla_cm BETWEEN 120 AND 220),
    CONSTRAINT chk_reg_imc       CHECK (imc BETWEEN 12 AND 70),
    CONSTRAINT chk_reg_familia   CHECK (antecedente_familiar IS NULL OR antecedente_familiar IN ('Ninguno','Lejano','Uno','Dos o más')),
    CONSTRAINT chk_reg_pedigree  CHECK (pedigree_diabetes BETWEEN 0.05 AND 2.5),
    CONSTRAINT chk_reg_edad      CHECK (edad BETWEEN 18 AND 100),
    CONSTRAINT fk_reg_part FOREIGN KEY (id_participante) REFERENCES participante(id_participante),
    CONSTRAINT fk_reg_lote FOREIGN KEY (id_lote) REFERENCES lote_evaluacion(id_lote)
) ENGINE=InnoDB;

CREATE TABLE modelo_ml (
    id_modelo           TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    version             VARCHAR(20)  NOT NULL UNIQUE,   -- rf-v1.0
    algoritmo           VARCHAR(40)  NOT NULL DEFAULT 'Random Forest',
    ruta_archivo        VARCHAR(200) NOT NULL,          -- modelo_rf.joblib
    fecha_entrenamiento DATE         NOT NULL,
    sensibilidad        DECIMAL(5,4) NULL,
    roc_auc             DECIMAL(5,4) NULL,
    brier_score         DECIMAL(5,4) NULL,
    umbral_moderado     DECIMAL(4,3) NOT NULL DEFAULT 0.150,
    umbral_alto         DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    activo              BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_modelo_umbrales CHECK (umbral_moderado < umbral_alto)
) ENGINE=InnoDB;

CREATE TABLE evaluacion_riesgo (
    id_evaluacion        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_registro          INT UNSIGNED NOT NULL UNIQUE,
    id_modelo            TINYINT UNSIGNED NOT NULL,
    id_usuario           INT UNSIGNED NULL,             -- NULL en autoevaluación
    probabilidad         DECIMAL(5,4) NOT NULL,
    nivel_riesgo         VARCHAR(10)  NOT NULL,
    tiempo_respuesta_ms  INT UNSIGNED NOT NULL,
    fecha_hora           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_eval_prob  CHECK (probabilidad BETWEEN 0 AND 1),
    CONSTRAINT chk_eval_nivel CHECK (nivel_riesgo IN ('Bajo','Moderado','Alto')),
    CONSTRAINT fk_eval_reg    FOREIGN KEY (id_registro) REFERENCES registro_clinico(id_registro),
    CONSTRAINT fk_eval_modelo FOREIGN KEY (id_modelo)   REFERENCES modelo_ml(id_modelo),
    CONSTRAINT fk_eval_user   FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario),
    INDEX idx_eval_fecha (fecha_hora),
    INDEX idx_eval_nivel (nivel_riesgo)
) ENGINE=InnoDB;

CREATE TABLE factor_influyente (
    id_factor      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_evaluacion  INT UNSIGNED NOT NULL,
    variable       VARCHAR(30)  NOT NULL,
    valor          DECIMAL(7,2) NULL,
    contribucion   DECIMAL(6,4) NOT NULL,   -- valor SHAP
    orden          TINYINT UNSIGNED NOT NULL,
    CONSTRAINT fk_factor_eval FOREIGN KEY (id_evaluacion) REFERENCES evaluacion_riesgo(id_evaluacion)
) ENGINE=InnoDB;

-- Cuestionario Likert de calidad del software (Variable X, ISO/IEC 25010).
CREATE TABLE encuesta_calidad (
    id_respuesta   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_evaluacion  INT UNSIGNED NOT NULL,
    dimension      VARCHAR(30)  NOT NULL,
    indicador      VARCHAR(40)  NOT NULL,
    puntaje        TINYINT UNSIGNED NOT NULL,
    fecha_hora     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_enc_dim CHECK (dimension IN ('Adecuación funcional','Eficiencia de desempeño','Capacidad de interacción','Seguridad')),
    CONSTRAINT chk_enc_pts CHECK (puntaje BETWEEN 1 AND 5),
    CONSTRAINT fk_enc_eval FOREIGN KEY (id_evaluacion) REFERENCES evaluacion_riesgo(id_evaluacion)
) ENGINE=InnoDB;

CREATE TABLE bitacora_acceso (
    id_bitacora  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario   INT UNSIGNED NOT NULL,
    accion       VARCHAR(20)  NOT NULL,   -- LOGIN, LOGOUT, EVALUAR, DESCARGAR_REPORTE
    ip           VARCHAR(45)  NULL,
    fecha_hora   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bit_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;

-- HU07: la evaluación es inalterable una vez registrada.
DELIMITER $$
CREATE TRIGGER trg_evaluacion_no_update
BEFORE UPDATE ON evaluacion_riesgo FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Las evaluaciones registradas no se pueden modificar';
END$$
CREATE TRIGGER trg_evaluacion_no_delete
BEFORE DELETE ON evaluacion_riesgo FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Las evaluaciones registradas no se pueden eliminar';
END$$
DELIMITER ;

CREATE INDEX idx_registro_participante ON registro_clinico(id_participante);

-- Datos iniciales
INSERT INTO rol (nombre, descripcion) VALUES
  ('Tamizaje', 'Registra participantes y ejecuta evaluaciones'),
  ('Médico',   'Consulta resultados, factores influyentes y reportes'),
  ('Jefatura', 'Consulta el tablero de indicadores'),
  ('Admin',    'Gestiona usuarios y versiones del modelo');
