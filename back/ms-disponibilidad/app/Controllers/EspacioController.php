<?php
namespace App\Controllers;

use App\Models\Espacio;
use Illuminate\Database\Capsule\Manager as Capsule;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class EspacioController {
    public function listar(Request $request, Response $response): Response {
        try {
            $espacios = Capsule::table('espacios')
                ->leftJoin('canchas_futbol', 'espacios.id', '=', 'canchas_futbol.espacio_id')
                ->leftJoin('canchas_tejo', 'espacios.id', '=', 'canchas_tejo.espacio_id')
                ->leftJoin('salones_comunales', 'espacios.id', '=', 'salones_comunales.espacio_id')
                ->leftJoin('zonas_barbecue', 'espacios.id', '=', 'zonas_barbecue.espacio_id')
                ->whereIn('espacios.estado', ['ACTIVO', 'DISPONIBLE'])
                ->select(
                    'espacios.*',
                    'canchas_futbol.jugadores_por_equipo',
                    'canchas_futbol.dimensiones',
                    'canchas_tejo.numero_carriles',
                    'salones_comunales.tiene_sonido',
                    'zonas_barbecue.numero_asadores',
                    'zonas_barbecue.tiene_mesas'
                )
                ->get();
        } catch (\Exception $e) {
            $espacios = Espacio::whereIn('estado', ['ACTIVO', 'DISPONIBLE'])->get();
        }

        $response->getBody()->write(json_encode([
            "status" => "success",
            "espacios" => $espacios
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}