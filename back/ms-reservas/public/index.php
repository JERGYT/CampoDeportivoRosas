<?php
// Permitir solicitudes CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../controllers/ReservaController.php';

$database = new Database();
$db = $database->getConnection();
$controller = new ReservaController($db);

$uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' && strpos($uri, 'confirmar') !== false) {
    $controller->confirmarReserva();
    exit;
}

if ($method === 'POST' && strpos($uri, 'validar-recurrencia') !== false) {
    $controller->validarRecurrencia();
    exit;
}

http_response_code(404);
echo json_encode([
    "status" => "error",
    "mensaje" => "Ruta no encontrada",
    "uri" => $uri
]);
exit;