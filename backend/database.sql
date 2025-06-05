-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS render_tgm;
USE render_tgm;
-- Tabla: Usuario
CREATE TABLE IF NOT EXISTS Usuario (
  id_usuario INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contraseña VARCHAR(255) NOT NULL,
  rol ENUM('usuario', 'admin', 'superadmin') DEFAULT 'usuario',
  foto_perfil VARCHAR(255),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reset_token VARCHAR(255),
  reset_token_expires DATETIME
);

CREATE TABLE IF NOT EXISTS Imagenes (
  id_imagen INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT,
  nombre_archivo VARCHAR(255) NOT NULL,
  fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES Usuario(id_usuario)
); 

-- Tabla: SesionUsuario
CREATE TABLE SesionUsuario (
    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    fecha_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(45),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

-- Tabla: Resultado
CREATE TABLE Resultado (
    id_resultado INT AUTO_INCREMENT PRIMARY KEY,
    ruta_resultado VARCHAR(255) NOT NULL,
    fecha_proceso DATETIME NOT NULL,
    porcentaje_precision DECIMAL(5,2) -- porcentaje, por ejemplo: 97.50
);

-- Tabla: Imagen
CREATE TABLE Imagen (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    id_resultado INT,
    fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'procesado', 'error') NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_resultado) REFERENCES Resultado(id_resultado)
);

-- Tabla: Amigos
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