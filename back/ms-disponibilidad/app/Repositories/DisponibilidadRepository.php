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
    public function sugerirAlternativas($espacioId, $fecha, $horaInicio, $horaFin, $tipo = null) {
        $sugerencias = [];
        $duracionSeg = strtotime($horaFin) - strtotime($horaInicio);
        if ($duracionSeg <= 0) $duracionSeg = 7200;

        $franjas = [
            ['08:00:00', date('H:i:s', strtotime('08:00:00') + $duracionSeg)],
            ['10:00:00', date('H:i:s', strtotime('10:00:00') + $duracionSeg)],
            ['14:00:00', date('H:i:s', strtotime('14:00:00') + $duracionSeg)],
            ['16:00:00', date('H:i:s', strtotime('16:00:00') + $duracionSeg)],
            ['18:00:00', date('H:i:s', strtotime('18:00:00') + $duracionSeg)],
            ['20:00:00', date('H:i:s', strtotime('20:00:00') + $duracionSeg)],
        ];

        foreach ($franjas as $f) {
            if ($f[0] === $horaInicio && $f[1] === $horaFin) continue;
            if ($this->consultarDisponibilidad($espacioId, $fecha, $f[0], $f[1])) {
                $sugerencias[] = [
                    'fecha' => $fecha,
                    'hora_inicio' => $f[0],
                    'hora_fin' => $f[1],
                    'descripcion' => "Mismo día ({$fecha}) de " . substr($f[0], 0, 5) . " a " . substr($f[1], 0, 5),
                ];
                if (count($sugerencias) >= 2) break;
            }
        }

        $diasNombres = [1 => 'Lun', 2 => 'Mar', 3 => 'Mié', 4 => 'Jue', 5 => 'Vie', 6 => 'Sáb', 7 => 'Dom'];
        for ($i = 1; $i <= 7 && count($sugerencias) < 3; $i++) {
            $proxFecha = date('Y-m-d', strtotime("$fecha +$i day"));
            $diaSem = (int)date('N', strtotime($proxFecha));

            if ($tipo === 'ESCUELA_FORMACION' && $diaSem === 7) continue;
            if (in_array($tipo, ['CAMPEONATO', 'PARTICULAR']) && !in_array($diaSem, [6, 7])) continue;

            if ($this->consultarDisponibilidad($espacioId, $proxFecha, $horaInicio, $horaFin)) {
                $sugerencias[] = [
                    'fecha' => $proxFecha,
                    'hora_inicio' => $horaInicio,
                    'hora_fin' => $horaFin,
                    'descripcion' => "{$diasNombres[$diaSem]} {$proxFecha} de " . substr($horaInicio, 0, 5) . " a " . substr($horaFin, 0, 5),
                ];
            }
        }

        return $sugerencias;
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