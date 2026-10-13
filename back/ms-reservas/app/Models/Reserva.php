<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reserva extends Model {
    protected $table = 'reservas';
    public $timestamps = false;

    protected $fillable = [
        'espacio_id',
        'cliente_id',
        'tipo',
        'entidad_organizadora',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'anticipo',
        'estado'
    ];

    public function validarDiaPermitido() {
        $diaSemana = (int)date('N', strtotime($this->fecha));

        if ($this->tipo === 'ESCUELA_FORMACION') {
            return $diaSemana >= 1 && $diaSemana <= 6;
        }

        if (in_array($this->tipo, ['CAMPEONATO', 'PARTICULAR'])) {
            return $diaSemana === 6 || $diaSemana === 7;
        }

        return true;
    }
}