CREATE DATABASE IF NOT EXISTS db_reservas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_reservas;

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    correo VARCHAR(120) NULL,
    tipo ENUM('ESCUELA_FORMACION', 'CAMPEONATO', 'PARTICULAR', 'OCASIONAL') NOT NULL
);

CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    espacio_id INT NOT NULL,
    cliente_id INT NOT NULL,
    tipo ENUM('ESCUELA_FORMACION', 'CAMPEONATO', 'PARTICULAR', 'OCASIONAL') NOT NULL,
    entidad_organizadora VARCHAR(150) NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    anticipo DECIMAL(10,2) DEFAULT 0.00,
    estado ENUM('PENDIENTE', 'CONFIRMADA', 'CANCELADA') DEFAULT 'CONFIRMADA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

INSERT IGNORE INTO clientes (id, nombre, telefono, correo, tipo) VALUES
(1, 'Escuela de Fútbol Semillero', '3005550182', 'laura@semillero.example', 'ESCUELA_FORMACION'),
(2, 'Torneo Relámpago Boyacá', '3119876543', 'torneo@deportes.example', 'CAMPEONATO'),
(3, 'Carlos Pérez', '3201234567', 'carlos.perez@example.com', 'PARTICULAR');