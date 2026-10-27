<?php
namespace App\Repositories;

use App\Models\Reserva;

class ReservaRepository {
    public function crear(array $datos) {
        $datos['estado'] = 'CONFIRMADA';
        return Reserva::create($datos);
    }

    public function listar(array $filtros = []) {
        $query = Reserva::with('cliente');

        if (!empty($filtros['espacio_id'])) {
            $query->where('espacio_id', $filtros['espacio_id']);
        }
        if (!empty($filtros['fecha'])) {
            $query->where('fecha', $filtros['fecha']);
        }
        if (!empty($filtros['estado'])) {
            $query->where('estado', $filtros['estado']);
        }

        return $query->orderBy('id', 'desc')->get();
    }
}
