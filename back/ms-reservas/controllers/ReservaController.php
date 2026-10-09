<?php
require_once __DIR__ . '/../models/Reserva.php';
require_once __DIR__ . '/../services/DisponibilidadClient.php';

class ReservaController {
    private $db;
    private $client;

    public function __construct($db) {
        $this->db = $db;
        $this->client = new DisponibilidadClient();
    }

    // Valida fechas de cronograma recurrente antes de reservar (Paso 1 y 2 de las vistas)
    public function validarRecurrencia() {
        $data = json_decode(file_get_contents("php://input"), true);
        $espacioId = $data['espacio_id'];
        $tipo = $data['tipo'];
        $fechas = $data['sesiones']; // Array de [{fecha, hora_inicio, hora_fin}]

        $resultados = [];
        $hayCruce = false;

        foreach ($fechas as $item) {
            $reservaTest = new Reserva($this->db);
            $reservaTest->fecha = $item['fecha'];
            $reservaTest->tipo = $tipo;

            if (!$reservaTest->validarDiaPermitido()) {
                $hayCruce = true;
                $resultados[] = [
                    "fecha" => $item['fecha'],
                    "hora_inicio" => $item['hora_inicio'],
                    "hora_fin" => $item['hora_fin'],
                    "estado" => "NO_PERMITIDO",
                    "mensaje" => "Día no habilitado para " . $tipo
                ];
                continue;
            }

            $disponible = $this->client->verificarDisponibilidad(
                $espacioId, $item['fecha'], $item['hora_inicio'], $item['hora_fin']
            );

            if (!$disponible) {
                $hayCruce = true;
                $resultados[] = [
                    "fecha" => $item['fecha'],
                    "hora_inicio" => $item['hora_inicio'],
                    "hora_fin" => $item['hora_fin'],
                    "estado" => "CRUCE_HORARIO",
                    "mensaje" => "Horario ocupado"
                ];
            } else {
                $resultados[] = [
                    "fecha" => $item['fecha'],
                    "hora_inicio" => $item['hora_inicio'],
                    "hora_fin" => $item['hora_fin'],
                    "estado" => "DISPONIBLE"
                ];
            }
        }

        echo json_encode([
            "hay_cruces" => $hayCruce,
            "sesiones" => $resultados
        ]);
    }

    // Confirmación final (Paso 3 de la pantalla): Crea reserva y bloquea
    public function confirmarReserva() {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);

        if (!$data) {
            http_response_code(400);
            echo json_encode(["status" => "error", "mensaje" => "JSON inválido o cuerpo vacío"]);
            exit;
        }

        $reserva = new Reserva($this->db);
        $reserva->espacioId = $data['espacio_id'] ?? null;
        $reserva->clienteId = $data['cliente_id'] ?? null;
        $reserva->tipo = $data['tipo'] ?? '';
        $reserva->entidadOrganizadora = $data['entidad_organizadora'] ?? '';
        $reserva->fecha = $data['fecha'] ?? '';
        $reserva->horaInicio = $data['hora_inicio'] ?? '';
        $reserva->horaFin = $data['hora_fin'] ?? '';
        $reserva->anticipo = $data['anticipo'] ?? 0;

        // Validación de regla de negocio (Día de la semana)
        if (!$reserva->validarDiaPermitido()) {
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "mensaje" => "Día no permitido: Escuela de Formación no puede reservar domingos"
            ]);
            exit;
        }

        // Validación con microservicio de disponibilidad
        $disponible = $this->client->verificarDisponibilidad(
            $reserva->espacioId, $reserva->fecha, $reserva->horaInicio, $reserva->horaFin
        );

        if (!$disponible) {
            http_response_code(409);
            echo json_encode(["status" => "error", "mensaje" => "El horario seleccionado no está disponible"]);
            exit;
        }

        if ($reserva->crear()) {
            $bloqueado = $this->client->bloquearHorario(
                $reserva->espacioId, $reserva->id, $reserva->fecha, $reserva->horaInicio, $reserva->horaFin, $reserva->tipo
            );

            http_response_code(201);
            echo json_encode([
                "status" => "success",
                "mensaje" => "Reserva confirmada con éxito",
                "reserva_id" => $reserva->id,
                "bloqueo_sincronizado" => $bloqueado
            ]);
            exit;
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => "No se pudo registrar la reserva"]);
            exit;
        }
    }
}