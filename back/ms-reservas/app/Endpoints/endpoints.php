<?php
use App\Controllers\ClienteController;
use App\Controllers\ReservaController;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use App\Controllers\AuthController;
use App\Controllers\ReportesController;

return function(App $app) {
    $app->group('/view', function (RouteCollectorProxy $group) {

        $group->get('/clientes', [ClienteController::class, 'listar']);
        $group->post('/createcliente', [ClienteController::class, 'crear']);

        $group->get('/reservas', [ReservaController::class, 'listar']);
        $group->post('/validarrecurrencia', [ReservaController::class, 'validarRecurrencia']);
        $group->post('/confirmarreserva', [ReservaController::class, 'confirmarReserva']);

        $group->post('/entregar', [ReservaController::class, 'entregar']);
        $group->post('/recibir', [ReservaController::class, 'recibir']);
        $group->post('/registrardanos', [ReservaController::class, 'registrarDanos']);
        $group->post('/liquidar', [ReservaController::class, 'liquidar']);

        $group->post('/iniciarcancelacion', [ReservaController::class, 'iniciarCancelacion']);
        $group->post('/confirmarcancelacion', [ReservaController::class, 'confirmarCancelacion']);

        $group->post('/login', [AuthController::class, 'login']);
        $group->get('/reportes', [ReportesController::class, 'generar']);
    });

    $app->post('/view/liberar', function ($request, $response) {
        $data = json_decode((string)$request->getBody(), true) ?? [];
        $reservaId = (int)($data['reserva_id'] ?? 0);

        if ($reservaId <= 0) {
            $response->getBody()->write(json_encode(['status' => 'error', 'mensaje' => 'reserva_id inválido']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $eliminados = 0;
        try {
            $eliminados = \Illuminate\Database\Capsule\Manager::table('db_disponibilidad.bloqueos_horario')
                ->where('reserva_id', $reservaId)
                ->delete();
        } catch (\Exception $e) {}

        $response->getBody()->write(json_encode([
            'status' => 'success',
            'mensaje' => 'Horario liberado exitosamente',
            'reserva_id' => $reservaId,
            'bloqueos_eliminados' => $eliminados
        ]));

        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    });
};