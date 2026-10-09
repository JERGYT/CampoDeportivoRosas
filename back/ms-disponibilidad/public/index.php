<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../controllers/DisponibilidadController.php';

$database = new Database();
$db = $database->getConnection();
$controller = new DisponibilidadController($db);

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && strpos($uri, 'consultar') !== false) {
    $controller->consultar();
} elseif ($method === 'GET' && strpos($uri, 'cronograma') !== false) {
    $controller->cronograma();
} elseif ($method === 'POST' && strpos($uri, 'bloquear') !== false) {
    $controller->bloquear();
} else {
    http_response_code(404);
    echo json_encode(["error" => "Ruta no encontrada en ms-disponibilidad"]);
}