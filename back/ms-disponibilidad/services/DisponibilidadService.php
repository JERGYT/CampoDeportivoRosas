<?php
require_once __DIR__ . '/../models/BloqueoHorario.php';

class DisponibilidadService {
    private $db;
    private $bloqueoModel;

    public function __construct($db) {
        $this->db = $db;
        $this->bloqueoModel = new BloqueoHorario($db);
    }

    public function consultarDisponibilidad($espacioId, $fecha, $horaInicio, $horaFin) {
        // Valida horario del centro
        $diasSemana = [1 => 'LUNES', 2 => 'MARTES', 3 => 'MIERCOLES', 4 => 'JUEVES', 5 => 'VIERNES', 6 => 'SABADO', 7 => 'DOMINGO'];
        $diaIndex = date('N', strtotime($fecha));
        $diaNombre = $diasSemana[$diaIndex];

        $stmt = $this->db->prepare("SELECT * FROM horarios_atencion WHERE espacio_id = :id AND dia = :dia");
        $stmt->execute([':id' => $espacioId, ':dia' => $diaNombre]);
        $horario = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$horario) return false;
        if ($horaInicio < $horario['hora_apertura'] || $horaFin > $horario['hora_cierre']) {
            return false;
        }

        // Verifica si ya está ocupado
        return !$this->bloqueoModel->chocaCon($espacioId, $fecha, $horaInicio, $horaFin);
    }

    public function consultarCronograma($espacioId, $desde, $hasta) {
        return $this->bloqueoModel->obtenerPorRango($espacioId, $desde, $hasta);
    }

    public function bloquear($espacioId, $reservaId, $fecha, $horaInicio, $horaFin, $tipo = 'RESERVA') {
        $this->bloqueoModel->espacioId = $espacioId;
        $this->bloqueoModel->reservaId = $reservaId;
        $this->bloqueoModel->fecha = $fecha;
        $this->bloqueoModel->horaInicio = $horaInicio;
        $this->bloqueoModel->horaFin = $horaFin;
        $this->bloqueoModel->tipo = $tipo;
        return $this->bloqueoModel->crear();
    }
}