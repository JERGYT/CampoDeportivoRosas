<?php
namespace App\Repositories;

use App\Models\Reserva;

class ReservaRepository {
    public function crear(array $datos) {
        $datos['estado'] = 'CONFIRMADA';
        return Reserva::create($datos);
    }
}