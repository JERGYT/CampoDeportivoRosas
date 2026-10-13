<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HorarioAtencion extends Model {
    protected $table = 'horarios_atencion';
    public $timestamps = false;

    protected $fillable = [
        'espacio_id',
        'dia',
        'hora_apertura',
        'hora_cierre'
    ];
}