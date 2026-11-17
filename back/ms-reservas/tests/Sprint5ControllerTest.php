<?php
namespace Tests;

use PHPUnit\Framework\TestCase;
use Illuminate\Database\Capsule\Manager as Capsule;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\StreamFactory;
use App\Controllers\AuthController;
use App\Controllers\ReportesController;

require_once __DIR__ . '/../../ms-disponibilidad/app/Models/Espacio.php';
require_once __DIR__ . '/../../ms-disponibilidad/app/Models/HorarioAtencion.php';
require_once __DIR__ . '/../../ms-disponibilidad/app/Models/BloqueoHorario.php';
require_once __DIR__ . '/../../ms-disponibilidad/app/Repositories/DisponibilidadRepository.php';
require_once __DIR__ . '/../../ms-disponibilidad/app/Controllers/DisponibilidadController.php';
require_once __DIR__ . '/../../ms-disponibilidad/app/Controllers/EspacioController.php';

use App\Controllers\DisponibilidadController;
use App\Controllers\EspacioController;
use App\Repositories\DisponibilidadRepository;

class Sprint5ControllerTest extends TestCase
{
    private static bool $booted = false;

    protected function setUp(): void
    {
        if (!self::$booted) {
            $capsule = new Capsule();
            $capsule->addConnection([
                'driver'   => 'sqlite',
                'database' => ':memory:',
                'prefix'   => '',
            ]);
            $capsule->setAsGlobal();
            $capsule->bootEloquent();
            self::$booted = true;
        }

        $pdo = Capsule::connection()->getPdo();
        $pdo->exec('DROP TABLE IF EXISTS usuarios');
        $pdo->exec('DROP TABLE IF EXISTS reservas');
        $pdo->exec('DROP TABLE IF EXISTS clientes');
        $pdo->exec('DROP TABLE IF EXISTS horarios_atencion');
        $pdo->exec('DROP TABLE IF EXISTS bloqueos_horario');
        $pdo->exec('DROP TABLE IF EXISTS espacios');

        $pdo->exec("
            CREATE TABLE clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                telefono TEXT NOT NULL,
                correo TEXT,
                tipo TEXT NOT NULL DEFAULT 'PARTICULAR'
            );
            CREATE TABLE reservas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                espacio_id INTEGER NOT NULL,
                cliente_id INTEGER NOT NULL,
                tipo TEXT NOT NULL,
                entidad_organizadora TEXT,
                fecha TEXT NOT NULL,
                hora_inicio TEXT NOT NULL,
                hora_fin TEXT NOT NULL,
                anticipo REAL NOT NULL DEFAULT 0,
                danos REAL NOT NULL DEFAULT 0,
                metodo_pago TEXT,
                estado TEXT NOT NULL DEFAULT 'CONFIRMADA',
                motivo_cancelacion TEXT,
                monto_devolucion REAL NOT NULL DEFAULT 0,
                metodo_devolucion TEXT,
                fecha_cancelacion TEXT
            );
            CREATE TABLE espacios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                capacidad INTEGER NOT NULL DEFAULT 10,
                estado TEXT NOT NULL DEFAULT 'DISPONIBLE',
                tipo TEXT NOT NULL
            );
            CREATE TABLE horarios_atencion (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                espacio_id INTEGER NOT NULL,
                dia TEXT NOT NULL,
                hora_apertura TEXT NOT NULL,
                hora_cierre TEXT NOT NULL
            );
            CREATE TABLE bloqueos_horario (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                espacio_id INTEGER NOT NULL,
                reserva_id INTEGER,
                fecha TEXT NOT NULL,
                hora_inicio TEXT NOT NULL,
                hora_fin TEXT NOT NULL,
                tipo TEXT NOT NULL DEFAULT 'RESERVA'
            );
        ");

        Capsule::table('espacios')->insert([
            ['id' => 1, 'nombre' => 'Cancha Sintética Fútbol 8', 'capacidad' => 16, 'estado' => 'DISPONIBLE', 'tipo' => 'CANCHA_FUTBOL'],
            ['id' => 2, 'nombre' => 'Cancha de Tejo Tradicional', 'capacidad' => 10, 'estado' => 'DISPONIBLE', 'tipo' => 'CANCHA_TEJO'],
        ]);

        Capsule::table('horarios_atencion')->insert([
            ['espacio_id' => 1, 'dia' => 'Miércoles', 'hora_apertura' => '06:00:00', 'hora_cierre' => '12:00:00'],
            ['espacio_id' => 1, 'dia' => 'Sábado',    'hora_apertura' => '06:00:00', 'hora_cierre' => '22:00:00'],
        ]);

        Capsule::table('clientes')->insert([
            ['id' => 1, 'nombre' => 'Escuela Semillero', 'telefono' => '3104445566', 'correo' => 'semillero@boyaca.com', 'tipo' => 'ESCUELA_FORMACION'],
            ['id' => 2, 'nombre' => 'Carlos Pérez', 'telefono' => '3157771122', 'correo' => 'carlos@ejemplo.com', 'tipo' => 'PARTICULAR'],
        ]);
    }

    private function makeJsonRequest(string $method, string $uri, array $body = [], array $query = [])
    {
        $req = (new ServerRequestFactory())->createServerRequest($method, $uri);
        if (!empty($query)) {
            $req = $req->withQueryParams($query);
        }
        $stream = (new StreamFactory())->createStream(json_encode($body));
        return $req->withBody($stream)->withHeader('Content-Type', 'application/json');
    }

    // =========================================================================
    // 1. PRUEBAS HU-18: Autenticación segura y roles diferenciados
    // =========================================================================

    public function testHU18LoginAdministradorExitoso()
    {
        $ctrl = new AuthController();
        $req = $this->makeJsonRequest('POST', '/view/login', [
            'correo'   => 'admin@losrosas.com',
            'password' => 'admin123',
        ]);
        $res = $ctrl->login($req, (new ResponseFactory())->createResponse());
        $data = json_decode((string)$res->getBody(), true);

        $this->assertEquals(200, $res->getStatusCode());
        $this->assertEquals('success', $data['status']);
        $this->assertEquals('ADMINISTRADOR', $data['usuario']['rol']);
        $this->assertNotEmpty($data['token']);
    }

    public function testHU18LoginOperarioExitoso()
    {
        $ctrl = new AuthController();
        $req = $this->makeJsonRequest('POST', '/view/login', [
            'correo'   => 'operario@losrosas.com',
            'password' => 'operario123',
        ]);
        $res = $ctrl->login($req, (new ResponseFactory())->createResponse());
        $data = json_decode((string)$res->getBody(), true);

        $this->assertEquals(200, $res->getStatusCode());
        $this->assertEquals('OPERARIO', $data['usuario']['rol']);
    }

    public function testHU18LoginRechazaCredencialesIncorrectasYCamposVacios()
    {
        $ctrl = new AuthController();

        // Credenciales erróneas -> 401
        $reqInvalido = $this->makeJsonRequest('POST', '/view/login', [
            'correo'   => 'admin@losrosas.com',
            'password' => 'clave_incorrecta',
        ]);
        $resInvalido = $ctrl->login($reqInvalido, (new ResponseFactory())->createResponse());
        $this->assertEquals(401, $resInvalido->getStatusCode());

        // Campos vacíos -> 400
        $reqVacio = $this->makeJsonRequest('POST', '/view/login', [
            'correo'   => '',
            'password' => '',
        ]);
        $resVacio = $ctrl->login($reqVacio, (new ResponseFactory())->createResponse());
        $this->assertEquals(400, $resVacio->getStatusCode());
    }

    // =========================================================================
    // 2. PRUEBAS HU-19: Reportes de reservas, ingresos y cancelaciones
    // =========================================================================

    public function testHU19GeneraReporteConsolidadoConIngresosYCancelaciones()
    {
        Capsule::table('reservas')->insert([
            // 1. Confirmada con anticipo de $50.000 -> ingreso neto $50.000
            [
                'espacio_id' => 1, 'cliente_id' => 1, 'tipo' => 'ESCUELA_FORMACION',
                'fecha' => '2026-11-10', 'hora_inicio' => '16:00:00', 'hora_fin' => '18:00:00',
                'anticipo' => 50000, 'danos' => 0, 'monto_devolucion' => 0, 'estado' => 'CONFIRMADA',
            ],
            // 2. Completada ($120.000 base + $40.000 daños) -> ingreso neto $160.000
            [
                'espacio_id' => 1, 'cliente_id' => 2, 'tipo' => 'PARTICULAR',
                'fecha' => '2026-11-14', 'hora_inicio' => '14:00:00', 'hora_fin' => '16:00:00',
                'anticipo' => 50000, 'danos' => 40000, 'monto_devolucion' => 0, 'estado' => 'COMPLETADA',
            ],
            // 3. Cancelada con anticipo $50.000 y devolución $30.000 -> retención $20.000
            [
                'espacio_id' => 2, 'cliente_id' => 2, 'tipo' => 'PARTICULAR',
                'fecha' => '2026-11-15', 'hora_inicio' => '10:00:00', 'hora_fin' => '12:00:00',
                'anticipo' => 50000, 'danos' => 0, 'monto_devolucion' => 30000, 'estado' => 'CANCELADA',
            ],
        ]);

        $ctrl = new ReportesController();
        $req = $this->makeJsonRequest('GET', '/view/reportes');
        $res = $ctrl->generar($req, (new ResponseFactory())->createResponse());
        $data = json_decode((string)$res->getBody(), true);

        $this->assertEquals(200, $res->getStatusCode());
        $this->assertEquals(3, $data['resumen']['total_reservas']);
        $this->assertEquals(1, $data['resumen']['activas_confirmadas']);
        $this->assertEquals(1, $data['resumen']['completadas']);
        $this->assertEquals(1, $data['resumen']['canceladas']);
        $this->assertEquals(190000.0, $data['resumen']['ingresos_alquiler']); // 50k + 120k + 20k
        $this->assertEquals(40000.0, $data['resumen']['ingresos_danos']);
        $this->assertEquals(30000.0, $data['resumen']['total_devoluciones']);
        $this->assertEquals(230000.0, $data['resumen']['ingreso_neto_total']);
    }

    public function testHU19FiltraReportePorRangoDeFechas()
    {
        Capsule::table('reservas')->insert([
            [
                'espacio_id' => 1, 'cliente_id' => 1, 'tipo' => 'ESCUELA_FORMACION',
                'fecha' => '2026-11-05', 'hora_inicio' => '16:00:00', 'hora_fin' => '18:00:00',
                'anticipo' => 50000, 'danos' => 0, 'monto_devolucion' => 0, 'estado' => 'CONFIRMADA',
            ],
            [
                'espacio_id' => 1, 'cliente_id' => 2, 'tipo' => 'PARTICULAR',
                'fecha' => '2026-11-20', 'hora_inicio' => '14:00:00', 'hora_fin' => '16:00:00',
                'anticipo' => 50000, 'danos' => 0, 'monto_devolucion' => 0, 'estado' => 'CONFIRMADA',
            ],
        ]);

        $ctrl = new ReportesController();
        $req = $this->makeJsonRequest('GET', '/view/reportes', [], ['desde' => '2026-11-15', 'hasta' => '2026-11-25']);
        $res = $ctrl->generar($req, (new ResponseFactory())->createResponse());
        $data = json_decode((string)$res->getBody(), true);

        $this->assertEquals(1, $data['resumen']['total_reservas']);
        $this->assertEquals('2026-11-20', $data['detalle'][0]['fecha']);
    }

    // =========================================================================
    // 3. PRUEBAS HU-20: CRUD de horarios de atención y sincronización de espacios
    // =========================================================================

    public function testHU20EspacioControllerAceptaEstadoDisponibleYActivo()
    {
        $ctrl = new EspacioController();
        $req = $this->makeJsonRequest('GET', '/view/espacios');
        $res = $ctrl->listar($req, (new ResponseFactory())->createResponse());
        $data = json_decode((string)$res->getBody(), true);

        $this->assertEquals(200, $res->getStatusCode());
        $this->assertCount(2, $data['espacios'], 'Debe listar los espacios con estado DISPONIBLE del SQL.');
    }

    public function testHU20CrearActualizarEliminarHorarioYValidarSolapamientos()
    {
        $ctrl = new DisponibilidadController();

        // 1. Crear segunda franja el Miércoles (14:00 a 20:00) sin solapar (06:00 a 12:00) -> 201
        $reqCrear = $this->makeJsonRequest('POST', '/view/horarios', [
            'espacio_id'    => 1,
            'dia'           => 'Miércoles',
            'hora_apertura' => '14:00',
            'hora_cierre'   => '20:00',
        ]);
        $resCrear = $ctrl->crearHorario($reqCrear, (new ResponseFactory())->createResponse());
        $bodyCrear = json_decode((string)$resCrear->getBody(), true);
        $this->assertEquals(201, $resCrear->getStatusCode());
        $nuevoId = $bodyCrear['id'];

        // 2. Intentar crear horario solapado en el mismo día (incluso sin tilde 'MIERCOLES') -> 409
        $reqCruce = $this->makeJsonRequest('POST', '/view/horarios', [
            'espacio_id'    => 1,
            'dia'           => 'MIERCOLES',
            'hora_apertura' => '10:00',
            'hora_cierre'   => '15:00',
        ]);
        $resCruce = $ctrl->crearHorario($reqCruce, (new ResponseFactory())->createResponse());
        $this->assertEquals(409, $resCruce->getStatusCode());

        // 3. Verificar que DisponibilidadRepository acepta ambas franjas del Miércoles 2026-11-11
        $repo = new DisponibilidadRepository();
        $this->assertTrue($repo->consultarDisponibilidad(1, '2026-11-11', '08:00:00', '10:00:00'));
        $this->assertTrue($repo->consultarDisponibilidad(1, '2026-11-11', '15:00:00', '17:00:00'));
        $this->assertFalse($repo->consultarDisponibilidad(1, '2026-11-11', '12:00:00', '14:00:00'));

        // 4. Actualizar la segunda franja a 15:00 - 21:00 -> 200
        $reqAct = $this->makeJsonRequest('POST', '/view/horarios/actualizar', [
            'id'            => $nuevoId,
            'espacio_id'    => 1,
            'dia'           => 'Miércoles',
            'hora_apertura' => '15:00',
            'hora_cierre'   => '21:00',
        ]);
        $resAct = $ctrl->actualizarHorario($reqAct, (new ResponseFactory())->createResponse());
        $this->assertEquals(200, $resAct->getStatusCode());

        // 5. Eliminar el horario creado -> 200
        $reqDel = $this->makeJsonRequest('POST', '/view/horarios/eliminar', [
            'id' => $nuevoId,
        ]);
        $resDel = $ctrl->eliminarHorario($reqDel, (new ResponseFactory())->createResponse());
        $this->assertEquals(200, $resDel->getStatusCode());
    }
}
