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

    public function entregar(Request $request, Response $response): Response {
        $data = json_decode((string)$request->getBody(), true);
        $id = $data['reserva_id'] ?? null;
        $reserva = $this->reservaRepository->obtenerPorId($id);

        if (!$reserva) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "Reserva no encontrada"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        if ($reserva->estado !== 'CONFIRMADA') {
            $response->getBody()->write(json_encode([
                "status" => "error", 
                "mensaje" => "No se puede entregar: La reserva debe estar en estado CONFIRMADA (estado actual: {$reserva->estado})."
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $this->reservaRepository->actualizar($id, ['estado' => 'ENTREGADA']);

        $response->getBody()->write(json_encode([
            "status" => "success",
            "mensaje" => "Espacio e implementos entregados conforme al checklist. Reserva en uso.",
            "estado" => "ENTREGADA"
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function recibir(Request $request, Response $response): Response {
        $data = json_decode((string)$request->getBody(), true);
        $id = $data['reserva_id'] ?? null;
        $reserva = $this->reservaRepository->obtenerPorId($id);

        if (!$reserva) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "Reserva no encontrada"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        if (!in_array($reserva->estado, ['ENTREGADA', 'CONFIRMADA'])) {
            $response->getBody()->write(json_encode([
                "status" => "error", 
                "mensaje" => "La reserva no está en estado de entrega para ser recibida."
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $this->reservaRepository->actualizar($id, ['estado' => 'RECIBIDA']);

        $response->getBody()->write(json_encode([
            "status" => "success",
            "mensaje" => "Espacio e implementos recibidos correctamente.",
            "estado" => "RECIBIDA"
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function registrarDanos(Request $request, Response $response): Response {
        $data = json_decode((string)$request->getBody(), true);
        $id = $data['reserva_id'] ?? null;
        $danos = floatval($data['danos'] ?? 0);

        $reserva = $this->reservaRepository->obtenerPorId($id);
        if (!$reserva) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "Reserva no encontrada"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $this->reservaRepository->actualizar($id, ['danos' => $danos]);

        $response->getBody()->write(json_encode([
            "status" => "success",
            "mensaje" => "Valor de daños registrado: $" . number_format($danos, 0, ',', '.') . " COP.",
            "danos" => $danos
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function liquidar(Request $request, Response $response): Response {
        $data = json_decode((string)$request->getBody(), true);
        $id = $data['reserva_id'] ?? null;
        $metodoPago = $data['metodo_pago'] ?? 'EFECTIVO';

        $reserva = $this->reservaRepository->obtenerPorId($id);
        if (!$reserva) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "Reserva no encontrada"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $alquiler = 120000.00;
        $danos = floatval($reserva->danos ?? 0);
        $anticipo = floatval($reserva->anticipo ?? 0);
        $totalPagar = max(0, ($alquiler + $danos) - $anticipo);

        $this->reservaRepository->actualizar($id, [
            'estado' => 'COMPLETADA',
            'metodo_pago' => $metodoPago
        ]);

        $response->getBody()->write(json_encode([
            "status" => "success",
            "mensaje" => "Liquidación completada. Pago final de $" . number_format($totalPagar, 0, ',', '.') . " recibido mediante {$metodoPago}.",
            "alquiler" => $alquiler,
            "danos" => $danos,
            "anticipo" => $anticipo,
            "total_pagado" => $totalPagar,
            "metodo_pago" => $metodoPago,
            "estado" => "COMPLETADA"
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function iniciarCancelacion(Request $request, Response $response): Response {
        $data = json_decode((string)$request->getBody(), true);
        $id = $data['reserva_id'] ?? null;

        $reserva = $this->reservaRepository->obtenerPorId($id);
        if (!$reserva) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "Reserva no encontrada."]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        if ($reserva->estado === 'CANCELADA') {
            $response->getBody()->write(json_encode([
                "status" => "error",
                "mensaje" => "La reserva ya se encuentra en estado CANCELADA."
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        if ($reserva->estado === 'COMPLETADA') {
            $response->getBody()->write(json_encode([
                "status" => "error",
                "mensaje" => "No se puede cancelar una reserva que ya fue liquidada y COMPLETADA."
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $alquiler = 120000.00;
        $anticipo = floatval($reserva->anticipo ?? 0);
        $saldoPendiente = max(0, $alquiler - $anticipo);

        $montoDevolucionSugerido = $anticipo;

        $response->getBody()->write(json_encode([
            "status" => "success",
            "reserva" => [
                "id" => $reserva->id,
                "codigo" => "R-" . str_pad($reserva->id, 4, '0', STR_PAD_LEFT),
                "estado" => $reserva->estado,
                "cliente" => $reserva->cliente ? $reserva->cliente->nombre : "Cliente #" . $reserva->cliente_id,
                "telefono" => $reserva->cliente ? $reserva->cliente->telefono : "No registrado",
                "tipo_cliente" => $reserva->tipo,
                "espacio_id" => $reserva->espacio_id,
                "fecha" => $reserva->fecha,
                "hora_inicio" => substr($reserva->hora_inicio, 0, 5),
                "hora_fin" => substr($reserva->hora_fin, 0, 5),
                "alquiler" => $alquiler,
                "anticipo" => $anticipo,
                "saldo_pendiente" => $saldoPendiente,
                "monto_devolucion_sugerido" => $montoDevolucionSugerido
            ]
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function confirmarCancelacion(Request $request, Response $response): Response {
        $data = json_decode((string)$request->getBody(), true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "JSON inválido."]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $id = $data['reserva_id'] ?? null;
        $motivo = trim($data['motivo'] ?? 'Cancelación solicitada por el usuario');
        $montoDevolucion = floatval($data['monto_devolucion'] ?? 0);
        $metodoDevolucion = strtoupper(trim($data['metodo_devolucion'] ?? 'EFECTIVO'));

        $reserva = $this->reservaRepository->obtenerPorId($id);
        if (!$reserva) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "Reserva no encontrada."]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        if (in_array($reserva->estado, ['CANCELADA', 'COMPLETADA'])) {
            $response->getBody()->write(json_encode([
                "status" => "error",
                "mensaje" => "No se puede cancelar una reserva que ya está en estado {$reserva->estado}."
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $fechaCancelacion = date('Y-m-d H:i:s');
        $this->reservaRepository->actualizar($id, [
            'estado' => 'CANCELADA',
            'motivo_cancelacion' => $motivo,
            'monto_devolucion' => $montoDevolucion,
            'metodo_devolucion' => $montoDevolucion > 0 ? $metodoDevolucion : 'NO_APLICA',
            'fecha_cancelacion' => $fechaCancelacion
        ]);

        try {
            \Illuminate\Database\Capsule\Manager::table('db_disponibilidad.bloqueos_horario')
                ->where('reserva_id', $id)
                ->delete();
        } catch (\Exception $ex) {
            @file_get_contents('http://localhost/CampoDeportivoRosas/back/ms-disponibilidad/public/index.php/view/liberar', false, stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "Content-Type: application/json\r\n",
                    'content' => json_encode(['reserva_id' => $id])
                ]
            ]));
        }

        $response->getBody()->write(json_encode([
            "status" => "success",
            "mensaje" => "Reserva cancelada correctamente. El horario fue liberado y la auditoría registrada.",
            "auditoria" => [
                "reserva_id" => $id,
                "codigo" => "R-" . str_pad($id, 4, '0', STR_PAD_LEFT),
                "estado_anterior" => $reserva->estado,
                "nuevo_estado" => "CANCELADA",
                "motivo" => $motivo,
                "monto_devolucion" => $montoDevolucion,
                "metodo_devolucion" => $montoDevolucion > 0 ? $metodoDevolucion : 'NO_APLICA',
                "fecha_cancelacion" => $fechaCancelacion,
                "horario_liberado" => true
            ]
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}