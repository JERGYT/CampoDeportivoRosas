<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BloqueoHorario extends Model {
    protected $table = 'bloqueos_horario';
    public $timestamps = false;

    protected $fillable = [
        'espacio_id',
        'reserva_id',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'tipo'
    ];
}