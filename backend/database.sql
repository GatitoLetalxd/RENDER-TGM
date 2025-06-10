CREATE DATABASE IF NOT EXISTS render_tgm;
USE render_tgm;

CREATE TABLE IF NOT EXISTS Usuario (
  id_usuario INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contraseña VARCHAR(255) NOT NULL,
  rol ENUM('superadmin','admin', 'usuario') DEFAULT 'usuario',
  foto_perfil VARCHAR(255),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reset_token VARCHAR(255) NULL, 
  reset_token_expires DATETIME NULL
);

CREATE TABLE IF NOT EXISTS Amigos (
    id_amistad INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    amigo_id INT,
    estado ENUM('pendiente', 'aceptado', 'rechazado') DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (amigo_id) REFERENCES Usuario(id_usuario),
    UNIQUE KEY unique_friendship (usuario_id, amigo_id)
);
CREATE TABLE IF NOT EXISTS SolicitudAdmin (
    id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    razon TEXT NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP NULL,
    admin_id INT NULL,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (admin_id) REFERENCES Usuario(id_usuario)
);
-- Crear la nueva tabla Imagen con la estructura actualizada
DROP TABLE Imagen;
CREATE TABLE IF NOT EXISTS Imagen (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(255) NOT NULL,
    fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activo', 'eliminado') NOT NULL DEFAULT 'activo',
    id_resultado INT NULL,
    procesada BOOLEAN DEFAULT FALSE,
    ruta_archivo_procesada VARCHAR(255),
    fecha_procesamiento DATETIME,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_resultado) REFERENCES Resultado(id_resultado) ON DELETE SET NULL
);

CREATE TABLE SesionUsuario (
    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    fecha_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(45),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS Resultado (
    id_resultado INT AUTO_INCREMENT PRIMARY KEY,
    ruta_resultado VARCHAR(255) NOT NULL,
    fecha_proceso DATETIME NOT NULL,
    porcentaje_precision DECIMAL(5,2), -- porcentaje, por ejemplo: 97.50
    parametros_usados TEXT -- JSON con los parámetros utilizados
);
CREATE TABLE IF NOT EXISTS ParametrosCNN (
    id_parametro INT AUTO_INCREMENT PRIMARY KEY,
    modelo_usado VARCHAR(100) NOT NULL,
    epocas INT NOT NULL,
    tamaño_lote INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS LogProceso (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_parametro INT,
    mensaje TEXT,
    nivel ENUM('info', 'warning', 'error') NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_parametro) REFERENCES ParametrosCNN(id_parametro)
);

UPDATE Usuario SET rol = 'superadmin' WHERE correo = 'rmontufarm@unamad.edu.pe';
INSERT INTO Usuario (nombre, correo, contraseña) VALUES ('Teco Garcia', 'tec@ejemplo.com', 'teco123');
select*from Usuario;
select * from Imagen;
select * from Amigos;
select * from LogProceso;
select * from Resultado;
  