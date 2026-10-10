<?php
namespace App\Repositories;

class DisponibilidadClient {
    private $baseUrl = "http://localhost/CampoDeportivoRosas/back/ms-disponibilidad/public/index.php/view";

    public function verificarDisponibilidad($espacioId, $fecha, $horaInicio, $horaFin) {
        $url = $this->baseUrl . "/consultar?espacio_id={$espacioId}&fecha={$fecha}&hora_inicio={$horaInicio}&hora_fin={$horaFin}";
        $response = @file_get_contents($url);
        if ($response === false) return false;
        $data = json_decode($response, true);
        return isset($data['disponible']) && $data['disponible'] === true;
    }

    public function bloquearHorario($espacioId, $reservaId, $fecha, $horaInicio, $horaFin, $tipo) {
        $url = $this->baseUrl . "/bloquear";
        $payload = json_encode([
            "espacio_id" => $espacioId,
            "reserva_id" => $reservaId,
            "fecha" => $fecha,
            "hora_inicio" => $horaInicio,
            "hora_fin" => $horaFin,
            "tipo" => $tipo
        ]);

        $opts = [
            'http' => [
                'method'  => 'POST',
                'header'  => "Content-Type: application/json\r\n",
                'content' => $payload,
                'ignore_errors' => true
            ]
        ];
        $context = stream_context_create($opts);
        $result = @file_get_contents($url, false, $context);
        $resData = json_decode($result, true);
        return isset($resData['status']) && $resData['status'] === 'success';
    }
}