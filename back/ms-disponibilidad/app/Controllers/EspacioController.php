<?php
namespace App\Controllers;

use App\Models\Espacio;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class EspacioController {
    public function listar(Request $request, Response $response): Response {
        $espacios = Espacio::where('estado', 'ACTIVO')->get();
        $response->getBody()->write(json_encode([
            "status" => "success",
            "espacios" => $espacios
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}