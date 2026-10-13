<?php
namespace App\Controllers;

use App\Repositories\ClienteRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ClienteController {
    private $repository;

    public function __construct() {
        $this->repository = new ClienteRepository();
    }

    public function listar(Request $request, Response $response): Response {
        $clientes = $this->repository->listar();
        $response->getBody()->write(json_encode(["status" => "success", "clientes" => $clientes]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function crear(Request $request, Response $response): Response {
        $data = json_decode((string)$request->getBody(), true);

        if (!isset($data['nombre'], $data['telefono'], $data['tipo'])) {
            $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "Nombre, teléfono y tipo son obligatorios"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $cliente = $this->repository->crear([
            'nombre'   => $data['nombre'],
            'telefono' => $data['telefono'],
            'tipo'     => $data['tipo'],
            'correo'   => $data['correo'] ?? null
        ]);

        if ($cliente) {
            $response->getBody()->write(json_encode([
                "status" => "success",
                "mensaje" => "Cliente registrado con éxito",
                "cliente_id" => $cliente->id
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        }

        $response->getBody()->write(json_encode(["status" => "error", "mensaje" => "No se pudo registrar"]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
    }
}