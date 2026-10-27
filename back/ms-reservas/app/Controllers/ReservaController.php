<?php
namespace App\Controllers;

use App\Models\Reserva;
use App\Repositories\ClienteRepository;
use App\Repositories\ReservaRepository;
use App\Repositories\DisponibilidadClient;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ReservaController {
    private $reservaRepository;
    private $clienteRepository;
    private $disponibilidadClient;

    public function __construct() {
        $this->reservaRepository = new ReservaRepository();
        $this->clienteRepository = new ClienteRepository();
        $this->disponibilidadClient = new DisponibilidadClient();
    }

    public function validarRecurrencia(Request $request, Response $response): Response {
        $data = json_decode((string)$request->getBody(), true);
        $espacioId = $data['espacio_id'] ?? null;
        $tipo = $data['tipo'] ?? null;
        $fechas = $data['sesiones'] ?? [];

        $resultados = [];
        $hayCruce = false;

        foreach ($fechas as $item) {
            $reservaTest = new Reserva([
                'fecha' => $item['fecha'],
                'tipo'  => $tipo
            ]);

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

            $disponible = $this->disponibilidadClient->verificarDisponibilidad(
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

        $response->getBody()->write(json_encode([
            "hay_cruces" => $hayCruce,
            "sesiones" => $resultados
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function confirmarReserva(Request $request, Response $response): Response {
        $data = json_decode((string)$request->getBody(), true);

        if (!$data) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "JSON inválido"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $clienteId = $data['cliente_id'] ?? null;
        $cliente = $this->clienteRepository->obtenerPorId($clienteId);
        if (!$cliente) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "El cliente especificado no existe"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        // HU-08 y HU-09: Normalizar y validar anticipo
        $anticipo = isset($data['anticipo']) && is_numeric($data['anticipo']) ? floatval($data['anticipo']) : 0.0;
        if ($anticipo < 0) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "El anticipo no puede ser negativo"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        $data['anticipo'] = $anticipo;

        $reserva = new Reserva($data);

        if (!$reserva->validarDiaPermitido()) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "Día no permitido para este tipo de reserva"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $disponible = $this->disponibilidadClient->verificarDisponibilidad(
            $reserva->espacio_id, $reserva->fecha, $reserva->hora_inicio, $reserva->hora_fin
        );

        if (!$disponible) {
            $response->getBody()->write(json_encode([
                "status" => "error", 
                "mensaje" => "La franja de {$reserva->hora_inicio} a {$reserva->hora_fin} no está disponible."
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(409);
        }

        $reservaGuardada = $this->reservaRepository->crear($data);
        if ($reservaGuardada) {
            $bloqueado = $this->disponibilidadClient->bloquearHorario(
                $reservaGuardada->espacio_id, $reservaGuardada->id, $reservaGuardada->fecha, $reservaGuardada->hora_inicio, $reservaGuardada->hora_fin, $reservaGuardada->tipo
            );

            $alquilerTotal = 120000.00;
            $saldoPendiente = max(0, $alquilerTotal - $anticipo);
            $conAnticipo = $anticipo > 0;

            if ($conAnticipo) {
                $mensajeConstancia = "Reserva asegurada con anticipo de $" . number_format($anticipo, 0, ',', '.') . " COP. Saldo pendiente: $" . number_format($saldoPendiente, 0, ',', '.') . " COP.";
            } else {
                $mensajeConstancia = "Reserva confirmada sin anticipo. Constancia: Saldo pendiente total de $" . number_format($saldoPendiente, 0, ',', '.') . " COP a pagar antes del uso.";
            }

            $response->getBody()->write(json_encode([
                "status" => "success",
                "mensaje" => $mensajeConstancia,
                "reserva_id" => $reservaGuardada->id,
                "codigo" => "R-" . str_pad($reservaGuardada->id, 4, "0", STR_PAD_LEFT),
                "alquiler" => $alquilerTotal,
                "anticipo" => $anticipo,
                "saldo_pendiente" => $saldoPendiente,
                "tiene_anticipo" => $conAnticipo,
                "bloqueo_sincronizado" => $bloqueado
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        }

        $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "No se pudo registrar la reserva"]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
    }

    public function listar(Request $request, Response $response): Response {
        $params = $request->getQueryParams();
        $reservas = $this->reservaRepository->listar($params);
        $response->getBody()->write(json_encode([
            "status" => "success",
            "reservas" => $reservas
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}