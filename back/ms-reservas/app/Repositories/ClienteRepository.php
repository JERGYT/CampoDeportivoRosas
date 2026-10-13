<?php
namespace App\Repositories;

use App\Models\Cliente;

class ClienteRepository {
    public function crear(array $datos) {
        return Cliente::create($datos);
    }

    public function obtenerPorId($id) {
        return Cliente::find($id);
    }

    public function listar() {
        return Cliente::orderBy('id', 'desc')->get();
    }
}