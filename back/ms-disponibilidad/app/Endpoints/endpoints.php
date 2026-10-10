<?php
use App\Controllers\DisponibilidadController;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return function(App $app) {
    $app->group('/view', function (RouteCollectorProxy $group) {
        $group->get('/consultar', [DisponibilidadController::class, 'consultar']);
        $group->get('/cronograma', [DisponibilidadController::class, 'cronograma']);
        $group->post('/bloquear', [DisponibilidadController::class, 'bloquear']);
    });
};