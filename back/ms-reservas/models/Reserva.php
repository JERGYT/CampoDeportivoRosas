<?php
class Reserva {
    private $conn;
    private $table = "reservas";

    public $id;
    public $espacioId;
    public $clienteId;
    public $tipo;
    public $entidadOrganizadora;
    public $fecha;
    public $horaInicio;
    public $horaFin;
    public $anticipo;
    public $estado;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function validarDiaPermitido() {
        $diaSemana = (int)date('N', strtotime($this->fecha)); // 1 (Lun) a 7 (Dom)

        // Reglas de negocio de la interfaz
        if ($this->tipo === 'ESCUELA_FORMACION') {
            return $diaSemana >= 1 && $diaSemana <= 6; // Lunes a Sábado[cite: 2]
        }

        if (in_array($this->tipo, ['CAMPEONATO', 'PARTICULAR'])) {
            return $diaSemana === 6 || $diaSemana === 7; // Sábado o Domingo[cite: 2]
        }

        return true; // Clientes ocasionales u otros
    }

    public function crear() {
        $query = "INSERT INTO " . $this->table . " 
                  (espacio_id, cliente_id, tipo, entidad_organizadora, fecha, hora_inicio, hora_fin, anticipo, estado) 
                  VALUES (:espacio_id, :cliente_id, :tipo, :entidad, :fecha, :hora_inicio, :hora_fin, :anticipo, 'CONFIRMADA')";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":espacio_id", $this->espacioId);
        $stmt->bindParam(":cliente_id", $this->clienteId);
        $stmt->bindParam(":tipo", $this->tipo);
        $stmt->bindParam(":entidad", $this->entidadOrganizadora);
        $stmt->bindParam(":fecha", $this->fecha);
        $stmt->bindParam(":hora_inicio", $this->horaInicio);
        $stmt->bindParam(":hora_fin", $this->horaFin);
        $stmt->bindParam(":anticipo", $this->anticipo);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }
}