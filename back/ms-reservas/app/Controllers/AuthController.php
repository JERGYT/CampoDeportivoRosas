<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Illuminate\Database\Capsule\Manager as Capsule;

class AuthController
{
    public function __construct()
    {
        try {
            if (!Capsule::schema()->hasTable('usuarios')) {
                Capsule::schema()->create('usuarios', function ($table) {
                    $table->increments('id');
                    $table->string('nombre', 120);
                    $table->string('correo', 120)->unique();
                    $table->string('password', 255);
                    $table->string('rol', 30)->default('OPERARIO');
                    $table->boolean('activo')->default(true);
                });
                Capsule::table('usuarios')->insert([
                    ['nombre' => 'Ana Martínez (Administradora)', 'correo' => 'admin@losrosas.com', 'password' => 'admin123', 'rol' => 'ADMINISTRADOR', 'activo' => 1],
                    ['nombre' => 'Carlos Gómez (Operario)', 'correo' => 'operario@losrosas.com', 'password' => 'operario123', 'rol' => 'OPERARIO', 'activo' => 1],
                ]);
            }
        } catch (\Exception $e) {}
    }

    public function login(Request $request, Response $response): Response
    {
        $data = json_decode((string)$request->getBody(), true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            $response->getBody()->write(json_encode(['status' => 'error', 'mensaje' => 'JSON inválido']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $correo = trim($data['correo'] ?? '');
        $password = trim($data['password'] ?? '');

        if ($correo === '' || $password === '') {
            $response->getBody()->write(json_encode(['status' => 'error', 'mensaje' => 'Debes ingresar correo y contraseña.']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $usuario = Capsule::table('usuarios')
            ->where('correo', $correo)
            ->where('activo', 1)
            ->first();

        if (!$usuario || ($usuario->password !== $password && !password_verify($password, $usuario->password))) {
            $response->getBody()->write(json_encode(['status' => 'error', 'mensaje' => 'Credenciales inválidas o usuario inactivo.']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $token = base64_encode($usuario->id . '|' . $usuario->rol . '|' . time());

        $response->getBody()->write(json_encode([
            'status' => 'success',
            'mensaje' => 'Inicio de sesión exitoso.',
            'token' => $token,
            'usuario' => [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'correo' => $usuario->correo,
                'rol' => $usuario->rol,
            ]
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}