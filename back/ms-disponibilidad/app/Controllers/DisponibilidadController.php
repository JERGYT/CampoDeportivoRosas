<?php
namespace App\Controllers;

use App\Repositories\DisponibilidadRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class DisponibilidadController {
    private $repository;

    public function __construct() {
        $this->repository = new DisponibilidadRepository();
    }

    public function consultar(Request $request, Response $response): Response {
        $params = $request->getQueryParams();
        $espacioId = $params['espacio_id'] ?? null;
        $fecha = $params['fecha'] ?? null;
        $horaInicio = $params['hora_inicio'] ?? null;
        $horaFin = $params['hora_fin'] ?? null;

        if (!$espacioId || !$fecha || !$horaInicio || !$horaFin) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "Faltan parámetros de consulta"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $disponible = $this->repository->consultarDisponibilidad($espacioId, $fecha, $horaInicio, $horaFin);
        $payload = json_encode([
            "espacio_id" => (int)$espacioId,
            "fecha" => $fecha,
            "hora_inicio" => $horaInicio,
            "hora_fin" => $horaFin,
            "disponible" => $disponible
        ]);

        $response->getBody()->write($payload);
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function cronograma(Request $request, Response $response): Response {
        $params = $request->getQueryParams();
        $espacioId = $params['espacio_id'] ?? null;
        $desde = $params['desde'] ?? null;
        $hasta = $params['hasta'] ?? null;

        if (!$espacioId || !$desde || !$hasta) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "Parámetros requeridos"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $bloqueos = $this->repository->consultarCronograma($espacioId, $desde, $hasta);
        $response->getBody()->write(json_encode(["espacio_id" => (int)$espacioId, "cronograma" => $bloqueos]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function bloquear(Request $request, Response $response): Response {
        $data = json_decode((string)$request->getBody(), true);

        if (!isset($data['espacio_id'], $data['reserva_id'], $data['fecha'], $data['hora_inicio'], $data['hora_fin'])) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "Datos incompletos para bloquear"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $disponible = $this->repository->consultarDisponibilidad($data['espacio_id'], $data['fecha'], $data['hora_inicio'], $data['hora_fin']);
        if (!$disponible) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "Horario no disponible"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(409);
        }

        $bloqueo = $this->repository->bloquear($data['espacio_id'], $data['reserva_id'], $data['fecha'], $data['hora_inicio'], $data['hora_fin'], $data['tipo'] ?? 'RESERVA');
        $response->getBody()->write(json_encode(["status" => $bloqueo ? "success" : "error"]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($bloqueo ? 200 : 500);
    }
}