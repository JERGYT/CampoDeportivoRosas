<?php
class BloqueoHorario {
    private $conn;
    private $table = "bloqueos_horario";

    public $id;
    public $espacioId;
    public $reservaId;
    public $fecha;
    public $horaInicio;
    public $horaFin;
    public $tipo;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function chocaCon($espacioId, $fecha, $horaInicio, $horaFin) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table . " 
                  WHERE espacio_id = :espacio_id 
                    AND fecha = :fecha 
                    AND NOT (hora_fin <= :hora_inicio OR hora_inicio >= :hora_fin)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":espacio_id", $espacioId);
        $stmt->bindParam(":fecha", $fecha);
        $stmt->bindParam(":hora_inicio", $horaInicio);
        $stmt->bindParam(":hora_fin", $horaFin);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row['total'] > 0;
    }

    public function crear() {
        $query = "INSERT INTO " . $this->table . " (espacio_id, reserva_id, fecha, hora_inicio, hora_fin, tipo) 
                  VALUES (:espacio_id, :reserva_id, :fecha, :hora_inicio, :hora_fin, :tipo)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":espacio_id", $this->espacioId);
        $stmt->bindParam(":reserva_id", $this->reservaId);
        $stmt->bindParam(":fecha", $this->fecha);
        $stmt->bindParam(":hora_inicio", $this->horaInicio);
        $stmt->bindParam(":hora_fin", $this->horaFin);
        $stmt->bindParam(":tipo", $this->tipo);
        return $stmt->execute();
    }

    public function obtenerPorRango($espacioId, $desde, $hasta) {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE espacio_id = :espacio_id AND fecha BETWEEN :desde AND :hasta 
                  ORDER BY fecha ASC, hora_inicio ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":espacio_id", $espacioId);
        $stmt->bindParam(":desde", $desde);
        $stmt->bindParam(":hasta", $hasta);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}