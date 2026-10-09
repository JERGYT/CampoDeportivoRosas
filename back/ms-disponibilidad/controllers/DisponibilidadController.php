<?php
require_once __DIR__ . '/../services/DisponibilidadService.php';

class DisponibilidadController {
    private $service;

    public function __construct($db) {
        $this->service = new DisponibilidadService($db);
    }

    // HU-01 y HU-05: Consulta disponibilidad puntual
    public function consultar() {
        $espacioId = $_GET['espacio_id'] ?? null;
        $fecha = $_GET['fecha'] ?? null;
        $horaInicio = $_GET['hora_inicio'] ?? null;
        $horaFin = $_GET['hora_fin'] ?? null;

        if (!$espacioId || !$fecha || !$horaInicio || !$horaFin) {
            http_response_code(400);
            echo json_encode(["status" => "error", "mensaje" => "Faltan parámetros de consulta"]);
            return;
        }

        $disponible = $this->service->consultarDisponibilidad($espacioId, $fecha, $horaInicio, $horaFin);
        echo json_encode([
            "espacio_id" => (int)$espacioId,
            "fecha" => $fecha,
            "hora_inicio" => $horaInicio,
            "hora_fin" => $horaFin,
            "disponible" => $disponible
        ]);
    }

    // HU-02: Consulta cronograma completo en rango
    public function cronograma() {
        $espacioId = $_GET['espacio_id'] ?? null;
        $desde = $_GET['desde'] ?? null;
        $hasta = $_GET['hasta'] ?? null;

        if (!$espacioId || !$desde || !$hasta) {
            http_response_code(400);
            echo json_encode(["status" => "error", "mensaje" => "Parámetros espacio_id, desde y hasta requeridos"]);
            return;
        }

        $bloqueos = $this->service->consultarCronograma($espacioId, $desde, $hasta);
        echo json_encode(["espacio_id" => (int)$espacioId, "cronograma" => $bloqueos]);
    }

    // Usado por ms-reservas para bloquear
    public function bloquear() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['espacio_id'], $data['reserva_id'], $data['fecha'], $data['hora_inicio'], $data['hora_fin'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "mensaje" => "Datos incompletos para bloquear"]);
            return;
        }

        $disponible = $this->service->consultarDisponibilidad($data['espacio_id'], $data['fecha'], $data['hora_inicio'], $data['hora_fin']);
        if (!$disponible) {
            http_response_code(409);
            echo json_encode(["status" => "error", "mensaje" => "Horario no disponible para bloqueo"]);
            return;
        }

        $ok = $this->service->bloquear($data['espacio_id'], $data['reserva_id'], $data['fecha'], $data['hora_inicio'], $data['hora_fin'], $data['tipo'] ?? 'RESERVA');
        echo json_encode(["status" => $ok ? "success" : "error"]);
    }
}