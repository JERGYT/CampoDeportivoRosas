<?php
namespace App\Repositories;

use App\Models\BloqueoHorario;
use App\Models\HorarioAtencion;

class DisponibilidadRepository {
    public function consultarDisponibilidad($espacioId, $fecha, $horaInicio, $horaFin) {
        $diasSemana = [1 => 'LUNES', 2 => 'MARTES', 3 => 'MIERCOLES', 4 => 'JUEVES', 5 => 'VIERNES', 6 => 'SABADO', 7 => 'DOMINGO'];
        $diaIndex = date('N', strtotime($fecha));
        $diaNombre = $diasSemana[$diaIndex];

        $horario = HorarioAtencion::where('espacio_id', $espacioId)
            ->where('dia', $diaNombre)
            ->first();

        if (!$horario) return false;
        if ($horaInicio < $horario->hora_apertura || $horaFin > $horario->hora_cierre) {
            return false;
        }

        $choca = BloqueoHorario::where('espacio_id', $espacioId)
            ->where('fecha', $fecha)
            ->where(function($query) use ($horaInicio, $horaFin) {
                $query->whereRaw('NOT (hora_fin <= ? OR hora_inicio >= ?)', [$horaInicio, $horaFin]);
            })
            ->exists();

        return !$choca;
    }

    public function consultarCronograma($espacioId, $desde, $hasta) {
        return BloqueoHorario::where('espacio_id', $espacioId)
            ->whereBetween('fecha', [$desde, $hasta])
            ->orderBy('fecha', 'asc')
            ->orderBy('hora_inicio', 'asc')
            ->get();
    }

    public function bloquear($espacioId, $reservaId, $fecha, $horaInicio, $horaFin, $tipo = 'RESERVA') {
        return BloqueoHorario::create([
            'espacio_id'  => $espacioId,
            'reserva_id'  => $reservaId,
            'fecha'       => $fecha,
            'hora_inicio' => $horaInicio,
            'hora_fin'    => $horaFin,
            'tipo'        => $tipo
        ]);
    }
}