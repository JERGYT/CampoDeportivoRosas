-- =============================================================================
-- BASE DE DATOS: db_reservas
-- Microservicio: ms-reservas (Clientes, Reservas, Pagos, Daños y Cancelaciones)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `db_reservas` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_reservas`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `pagos`;
DROP TABLE IF EXISTS `reservas`;
DROP TABLE IF EXISTS `clientes`;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- Tabla: clientes
-- -----------------------------------------------------------------------------
CREATE TABLE `clientes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `telefono` VARCHAR(30) NOT NULL,
  `correo` VARCHAR(120) DEFAULT NULL,
  `tipo` VARCHAR(50) NOT NULL DEFAULT 'PARTICULAR' COMMENT 'PARTICULAR, ESCUELA_FORMACION, CAMPEONATO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tabla: reservas (Sprints 1, 2, 3 y 4)
-- -----------------------------------------------------------------------------
CREATE TABLE `reservas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `espacio_id` INT NOT NULL COMMENT 'ID foráneo lógico a db_disponibilidad.espacios',
  `cliente_id` INT NOT NULL,
  `tipo` VARCHAR(50) NOT NULL COMMENT 'PARTICULAR, ESCUELA_FORMACION, CAMPEONATO',
  `entidad_organizadora` VARCHAR(150) DEFAULT NULL,
  `fecha` DATE NOT NULL,
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NOT NULL,
  `anticipo` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'HU-08 / HU-09',
  `danos` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'HU-12: Valor acumulado de daños',
  `metodo_pago` VARCHAR(50) DEFAULT NULL COMMENT 'HU-13: EFECTIVO, TRANSFERENCIA, TARJETA',
  `estado` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMADA' COMMENT 'CONFIRMADA, ENTREGADA, RECIBIDA, COMPLETADA, CANCELADA',
  -- Columnas Sprint 4 (HU-14, HU-15, HU-17)
  `motivo_cancelacion` VARCHAR(255) DEFAULT NULL,
  `monto_devolucion` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `metodo_devolucion` VARCHAR(50) DEFAULT NULL COMMENT 'EFECTIVO, TRANSFERENCIA, NO_APLICA',
  `fecha_cancelacion` DATETIME DEFAULT NULL,
  INDEX `idx_cliente` (`cliente_id`),
  INDEX `idx_fecha_reserva` (`fecha`),
  INDEX `idx_estado` (`estado`),
  CONSTRAINT `fk_reserva_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tabla: pagos (Auditoría contable y caja)
-- -----------------------------------------------------------------------------
CREATE TABLE `pagos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reserva_id` INT NOT NULL,
  `tipo` VARCHAR(50) NOT NULL COMMENT 'ANTICIPO, PAGO_FINAL, DEVOLUCION',
  `monto` DECIMAL(10,2) NOT NULL,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `medio_pago` VARCHAR(50) NOT NULL COMMENT 'EFECTIVO, TRANSFERENCIA, TARJETA',
  CONSTRAINT `fk_pago_reserva` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DATOS INICIALES SEMILLA (SEED DATA)
-- =============================================================================
INSERT INTO `clientes` (`id`, `nombre`, `telefono`, `correo`, `tipo`) VALUES
(1, 'Escuela de Fútbol Semillero Boyacá', '3104445566', 'semillero@boyaca.com', 'ESCUELA_FORMACION'),
(2, 'Torneo Senior Master Duitama', '3128889900', 'torneos@master.com', 'CAMPEONATO'),
(3, 'Carlos Pérez (Particular)', '3157771122', 'carlos.perez@ejemplo.com', 'PARTICULAR'),
(4, 'Amigos FC (Particular)', '3209990011', 'amigosfc@ejemplo.com', 'PARTICULAR');

-- Reservas de prueba para validar el sistema
INSERT INTO `reservas` (`id`, `espacio_id`, `cliente_id`, `tipo`, `entidad_organizadora`, `fecha`, `hora_inicio`, `hora_fin`, `anticipo`, `danos`, `metodo_pago`, `estado`) VALUES
(1, 1, 1, 'ESCUELA_FORMACION', 'Escuela Semillero', '2026-11-10', '16:00:00', '18:00:00', 50000.00, 0.00, NULL, 'CONFIRMADA'),
(2, 1, 2, 'CAMPEONATO', 'Torneo Senior Master', '2026-11-14', '08:00:00', '10:00:00', 0.00, 0.00, NULL, 'CONFIRMADA'),
(3, 1, 3, 'PARTICULAR', 'Amigos Fútbol', '2026-11-14', '14:00:00', '16:00:00', 50000.00, 0.00, NULL, 'CONFIRMADA');

-- Bloqueo correspondiente en db_disponibilidad para que concuerde la reserva inicial #1
INSERT INTO `db_disponibilidad`.`bloqueos_horario` (`espacio_id`, `reserva_id`, `fecha`, `hora_inicio`, `hora_fin`, `tipo`) VALUES
(1, 1, '2026-11-10', '16:00:00', '18:00:00', 'RESERVA');