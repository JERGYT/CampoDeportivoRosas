<?php
use App\Controllers\ClienteController;
use App\Controllers\ReservaController;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return function(App $app) {
    $app->group('/view', function (RouteCollectorProxy $group) {
        $group->get('/clientes', [ClienteController::class, 'listar']);
        $group->post('/createcliente', [ClienteController::class, 'crear']);
        $group->post('/validarrecurrencia', [ReservaController::class, 'validarRecurrencia']);
        $group->post('/confirmarreserva', [ReservaController::class, 'confirmarReserva']);
    });
};