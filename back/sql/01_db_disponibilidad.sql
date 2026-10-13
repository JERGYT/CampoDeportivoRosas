CREATE DATABASE IF NOT EXISTS db_disponibilidad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_disponibilidad;

CREATE TABLE IF NOT EXISTS espacios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('FUTBOL', 'TEJO', 'SALON_COMUNAL', 'BARBECUE') NOT NULL,
    capacidad INT NOT NULL,
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    jugadores_por_equipo INT NULL,
    dimensiones VARCHAR(50) NULL,
    numero_carriles INT NULL,
    tiene_sonido TINYINT(1) NULL,
    numero_asadores INT NULL,
    tiene_mesas TINYINT(1) NULL
);

CREATE TABLE IF NOT EXISTS horarios_atencion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    espacio_id INT NOT NULL,
    dia ENUM('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO') NOT NULL,
    hora_apertura TIME NOT NULL,
    hora_cierre TIME NOT NULL,
    FOREIGN KEY (espacio_id) REFERENCES espacios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bloqueos_horario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    espacio_id INT NOT NULL,
    reserva_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    tipo VARCHAR(50) DEFAULT 'RESERVA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (espacio_id) REFERENCES espacios(id) ON DELETE CASCADE
);

INSERT IGNORE INTO espacios (id, nombre, tipo, capacidad, jugadores_por_equipo, dimensiones)
VALUES (1, 'Cancha Sintética Fútbol 8', 'FUTBOL', 16, 8, '40x20m');

INSERT IGNORE INTO espacios (id, nombre, tipo, capacidad, numero_carriles)
VALUES (2, 'Pistas de Tejo Tradicional', 'TEJO', 20, 4);

INSERT IGNORE INTO espacios (id, nombre, tipo, capacidad, tiene_sonido)
VALUES (3, 'Salón de Eventos Principal', 'SALON_COMUNAL', 80, 1);

INSERT IGNORE INTO espacios (id, nombre, tipo, capacidad, numero_asadores, tiene_mesas)
VALUES (4, 'Zona BBQ Los Rosas', 'BARBECUE', 30, 2, 1);

INSERT INTO horarios_atencion (espacio_id, dia, hora_apertura, hora_cierre)
SELECT e.id, d.dia, '06:00:00', '22:00:00'
FROM espacios e
CROSS JOIN (
    SELECT 'LUNES' AS dia UNION SELECT 'MARTES' UNION SELECT 'MIERCOLES' 
    UNION SELECT 'JUEVES' UNION SELECT 'VIERNES' UNION SELECT 'SABADO' UNION SELECT 'DOMINGO'
) d
WHERE NOT EXISTS (
    SELECT 1 FROM horarios_atencion ha 
    WHERE ha.espacio_id = e.id AND ha.dia = d.dia
);