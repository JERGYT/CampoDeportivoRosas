<?php
namespace App\Repositories;

use App\Models\Reserva;
use Illuminate\Database\Capsule\Manager as Capsule;

class ReservaRepository {
    public function __construct() {
        try {
            Capsule::statement("ALTER TABLE reservas MODIFY COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'CONFIRMADA'");

            Capsule::table('reservas')
                ->whereNull('estado')
                ->orWhere('estado', '')
                ->update(['estado' => 'CONFIRMADA']);

            if (!Capsule::schema()->hasColumn('reservas', 'danos')) {
                Capsule::schema()->table('reservas', function ($table) {
                    $table->decimal('danos', 10, 2)->default(0.00);
                });
            }
            if (!Capsule::schema()->hasColumn('reservas', 'metodo_pago')) {
                Capsule::schema()->table('reservas', function ($table) {
                    $table->string('metodo_pago', 50)->nullable();
                });
            }
        } catch (\Exception $e) {}
    }

    public function crear(array $datos) {
        $datos['estado'] = !empty($datos['estado']) ? $datos['estado'] : 'CONFIRMADA';
        return Reserva::create($datos);
    }

    public function listar(array $filtros = []) {
        return Reserva::with('cliente')
            ->orderBy('id', 'desc')
            ->get();
    }

    public function obtenerPorId($id) {
        return Reserva::with('cliente')->find($id);
    }

    public function actualizar($id, array $datos) {
        Capsule::table('reservas')->where('id', $id)->update($datos);
        return $this->obtenerPorId($id);
    }
}