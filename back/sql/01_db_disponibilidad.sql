CREATE DATABASE IF NOT EXISTS `db_disponibilidad` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_disponibilidad`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `bloqueos_horario`;
DROP TABLE IF EXISTS `horarios_atencion`;
DROP TABLE IF EXISTS `zonas_barbecue`;
DROP TABLE IF EXISTS `salones_comunales`;
DROP TABLE IF EXISTS `canchas_tejo`;
DROP TABLE IF EXISTS `canchas_futbol`;
DROP TABLE IF EXISTS `espacios`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `espacios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `capacidad` INT NOT NULL DEFAULT 10,
  `estado` VARCHAR(50) NOT NULL DEFAULT 'DISPONIBLE',
  `tipo` VARCHAR(50) NOT NULL COMMENT 'CANCHA_FUTBOL, CANCHA_TEJO, SALON_COMUNAL, ZONA_BARBECUE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `canchas_futbol` (
  `espacio_id` INT PRIMARY KEY,
  `jugadores_por_equipo` INT NOT NULL DEFAULT 8,
  `dimensiones` VARCHAR(100) NOT NULL DEFAULT '50x30m',
  CONSTRAINT `fk_cf_espacio` FOREIGN KEY (`espacio_id`) REFERENCES `espacios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `canchas_tejo` (
  `espacio_id` INT PRIMARY KEY,
  `numero_carriles` INT NOT NULL DEFAULT 2,
  CONSTRAINT `fk_ct_espacio` FOREIGN KEY (`espacio_id`) REFERENCES `espacios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `salones_comunales` (
  `espacio_id` INT PRIMARY KEY,
  `tiene_sonido` TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT `fk_sc_espacio` FOREIGN KEY (`espacio_id`) REFERENCES `espacios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `zonas_barbecue` (
  `espacio_id` INT PRIMARY KEY,
  `numero_asadores` INT NOT NULL DEFAULT 2,
  `tiene_mesas` TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT `fk_zb_espacio` FOREIGN KEY (`espacio_id`) REFERENCES `espacios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `horarios_atencion` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `espacio_id` INT NOT NULL,
  `dia` VARCHAR(20) NOT NULL COMMENT 'Lunes, Martes, ..., Domingo',
  `hora_apertura` TIME NOT NULL,
  `hora_cierre` TIME NOT NULL,
  CONSTRAINT `fk_ha_espacio` FOREIGN KEY (`espacio_id`) REFERENCES `espacios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bloqueos_horario` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `espacio_id` INT NOT NULL,
  `reserva_id` INT DEFAULT NULL COMMENT 'ID asociado en ms-reservas o NULL si es mantenimiento',
  `fecha` DATE NOT NULL,
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NOT NULL,
  `tipo` VARCHAR(50) NOT NULL DEFAULT 'RESERVA' COMMENT 'RESERVA, MANTENIMIENTO, EVENTO_INTERNO',
  INDEX `idx_espacio_fecha` (`espacio_id`, `fecha`),
  INDEX `idx_reserva` (`reserva_id`),
  CONSTRAINT `fk_bh_espacio` FOREIGN KEY (`espacio_id`) REFERENCES `espacios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `espacios` (`id`, `nombre`, `capacidad`, `estado`, `tipo`) VALUES
(1, 'Cancha Sintética Fútbol 8', 16, 'DISPONIBLE', 'CANCHA_FUTBOL'),
(2, 'Cancha de Tejo Tradicional', 10, 'DISPONIBLE', 'CANCHA_TEJO'),
(3, 'Salón Comunal para Eventos', 60, 'DISPONIBLE', 'SALON_COMUNAL'),
(4, 'Zona Barbecue (BBQ)', 25, 'DISPONIBLE', 'ZONA_BARBECUE');

INSERT INTO `canchas_futbol` (`espacio_id`, `jugadores_por_equipo`, `dimensiones`) VALUES
(1, 8, '55x35 metros sintética pro');

INSERT INTO `canchas_tejo` (`espacio_id`, `numero_carriles`) VALUES
(2, 3);

INSERT INTO `salones_comunales` (`espacio_id`, `tiene_sonido`) VALUES
(3, 1);

INSERT INTO `zonas_barbecue` (`espacio_id`, `numero_asadores`, `tiene_mesas`) VALUES
(4, 3, 1);

-- Horarios de lunes a domingo de 06:00 a 22:00 para la Cancha de Fútbol
INSERT INTO `horarios_atencion` (`espacio_id`, `dia`, `hora_apertura`, `hora_cierre`) VALUES
(1, 'Lunes',     '06:00:00', '22:00:00'),
(1, 'Martes',    '06:00:00', '22:00:00'),
(1, 'Miércoles', '06:00:00', '22:00:00'),
(1, 'Jueves',    '06:00:00', '22:00:00'),
(1, 'Viernes',   '06:00:00', '22:00:00'),
(1, 'Sábado',    '06:00:00', '22:00:00'),
(1, 'Domingo',   '06:00:00', '22:00:00'),
(2, 'Sábado',    '08:00:00', '20:00:00'),
(2, 'Domingo',   '08:00:00', '20:00:00'),
(3, 'Sábado',    '09:00:00', '23:00:00'),
(3, 'Domingo',   '09:00:00', '23:00:00'),
(4, 'Sábado',    '10:00:00', '20:00:00'),
(4, 'Domingo',   '10:00:00', '20:00:00');