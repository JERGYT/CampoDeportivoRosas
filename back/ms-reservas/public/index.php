<?php
use Slim\Factory\AppFactory;
use App\Middleware\Cors;
use App\Config\Database;

require __DIR__ . '/../vendor/autoload.php';

new Database();

$app = AppFactory::create();
$app->setBasePath('/CampoDeportivoRosas/back/ms-reservas/public/index.php');

$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
$app->add(new Cors());
$app->addErrorMiddleware(true, true, true);

$routes = require __DIR__ . '/../app/Endpoints/endpoints.php';
$routes($app);

$app->run();