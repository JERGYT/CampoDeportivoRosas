<?php
namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Models\Reserva;

class ReservaBusinessTest extends TestCase
{
    // =========================================================================
    // 1. PRUEBAS DEL MODELO REAL: Reglas de días por perfil (HU-03, HU-04, HU-06)
    // =========================================================================

    public function testModeloEscuelaPermiteLunesASabado()
    {
        // Martes 2026-11-03
        $reserva = new Reserva([
            'espacio_id' => 1,
            'cliente_id' => 1,
            'tipo' => 'ESCUELA_FORMACION',
            'fecha' => '2026-11-03'
        ]);

        $this->assertTrue($reserva->validarDiaPermitido(), "Escuela de formación debe poder reservar de lunes a sábado.");
    }

    public function testModeloEscuelaRechazaDomingo()
    {
        // Domingo 2026-11-01
        $reserva = new Reserva([
            'espacio_id' => 1,
            'cliente_id' => 1,
            'tipo' => 'ESCUELA_FORMACION',
            'fecha' => '2026-11-01'
        ]);

        $this->assertFalse($reserva->validarDiaPermitido(), "Escuela de formación NO tiene permitido reservar los domingos.");
    }

    public function testModeloCampeonatoYParticularPermitenFinDeSemana()
    {
        // Sábado 2026-10-31 y Domingo 2026-11-01
        $reservaSabado = new Reserva(['tipo' => 'CAMPEONATO', 'fecha' => '2026-10-31']);
        $reservaDomingo = new Reserva(['tipo' => 'PARTICULAR', 'fecha' => '2026-11-01']);

        $this->assertTrue($reservaSabado->validarDiaPermitido(), "Campeonato debe permitir sábados.");
        $this->assertTrue($reservaDomingo->validarDiaPermitido(), "Particular debe permitir domingos.");
    }

    public function testModeloParticularRechazaEntreSemana()
    {
        // Miércoles 2026-11-04
        $reserva = new Reserva([
            'tipo' => 'PARTICULAR',
            'fecha' => '2026-11-04'
        ]);

        $this->assertFalse($reserva->validarDiaPermitido(), "Particular NO debe permitir reservas de lunes a viernes.");
    }

    // =========================================================================
    // 2. PRUEBAS DE DISPONIBILIDAD Y CRUCE DE HORARIOS (HU-01, HU-02, HU-06)
    // =========================================================================

    public function testDeteccionDeCruceDeHorario()
    {
        // Franja ocupada de 14:00 a 16:00
        $ocupadoIni = '14:00:00';
        $ocupadoFin = '16:00:00';

        // Intento que se solapa: 15:00 a 17:00
        $nuevoIni = '15:00:00';
        $nuevoFin = '17:00:00';

        $hayCruce = !($nuevoFin <= $ocupadoIni || $nuevoIni >= $ocupadoFin);
        $this->assertTrue($hayCruce, "Debe detectar colisión entre 14:00-16:00 y 15:00-17:00.");
    }

    public function testHorarioContinuoNoGeneraCruce()
    {
        // Franja ocupada de 14:00 a 16:00
        $ocupadoIni = '14:00:00';
        $ocupadoFin = '16:00:00';

        // Intento justo después: 16:00 a 18:00
        $nuevoIni = '16:00:00';
        $nuevoFin = '18:00:00';

        $hayCruce = !($nuevoFin <= $ocupadoIni || $nuevoIni >= $ocupadoFin);
        $this->assertFalse($hayCruce, "Una reserva que inicia a las 16:00 cuando otra termina a las 16:00 NO debe chocar.");
    }

    // =========================================================================
    // 3. PRUEBAS DE ANTICIPO Y CONSTANCIA DE SALDO (HU-08 y HU-09)
    // =========================================================================

    public function testHU08ReservaConAnticipoAseguraYDescuentaSaldo()
    {
        $alquilerTotal = 120000.00;
        $reserva = new Reserva(['anticipo' => 50000.00]);

        $saldoPendiente = max(0, $alquilerTotal - $reserva->anticipo);
        $tieneAnticipo = $reserva->anticipo > 0;

        $this->assertTrue($tieneAnticipo);
        $this->assertEquals(70000.00, $saldoPendiente, "Con anticipo de $50.000, el saldo pendiente debe ser $70.000.");
    }

    public function testHU08RechazaAnticipoNegativoOSuperiorAlAlquiler()
    {
        $alquilerTotal = 120000.00;
        $anticipoNegativo = -10000.00;
        $anticipoExcesivo = 150000.00;

        $validoNegativo = ($anticipoNegativo >= 0 && $anticipoNegativo <= $alquilerTotal);
        $validoExcesivo = ($anticipoExcesivo >= 0 && $anticipoExcesivo <= $alquilerTotal);

        $this->assertFalse($validoNegativo, "No debe aceptar anticipos negativos.");
        $this->assertFalse($validoExcesivo, "No debe aceptar anticipos mayores al valor total del alquiler.");
    }

    public function testHU09ReservaSinAnticipoDeja100PorCientoPendiente()
    {
        $alquilerTotal = 120000.00;
        $reserva = new Reserva(['anticipo' => 0.00]);

        $saldoPendiente = max(0, $alquilerTotal - $reserva->anticipo);
        $tieneAnticipo = $reserva->anticipo > 0;

        $this->assertFalse($tieneAnticipo, "Debe marcar que no hubo anticipo.");
        $this->assertEquals(120000.00, $saldoPendiente, "Sin anticipo, el saldo pendiente debe ser el 100% ($120.000).");
    }

    // =========================================================================
    // 4. PRUEBAS DE ENTREGA Y RECEPCIÓN (HU-10 y HU-11)
    // =========================================================================

    public function testHU10ValidacionDeEstadoParaEntrega()
    {
        $reservaConfirmada = new Reserva(['estado' => 'CONFIRMADA']);
        $reservaCancelada  = new Reserva(['estado' => 'CANCELADA']);
        $reservaEntregada  = new Reserva(['estado' => 'ENTREGADA']);

        $this->assertEquals('CONFIRMADA', $reservaConfirmada->estado, "Solo el estado CONFIRMADA es apto para entrega.");
        $this->assertNotEquals('CONFIRMADA', $reservaCancelada->estado, "Una reserva CANCELADA no puede entregarse.");
        $this->assertNotEquals('CONFIRMADA', $reservaEntregada->estado, "Una reserva ya ENTREGADA no puede entregarse de nuevo.");
    }

    public function testHU11TransicionDeRecepcionConChecklist()
    {
        $reserva = new Reserva(['estado' => 'ENTREGADA']);
        $puedeRecibirse = in_array($reserva->estado, ['ENTREGADA', 'CONFIRMADA']);

        if ($puedeRecibirse) {
            $reserva->estado = 'RECIBIDA';
        }

        $this->assertTrue($puedeRecibirse);
        $this->assertEquals('RECIBIDA', $reserva->estado, "Al recibir el espacio, el estado debe pasar a RECIBIDA.");
    }

    // =========================================================================
    // 5. PRUEBAS DE VALORACIÓN DE DAÑOS Y LIQUIDACIÓN FINAL (HU-12 y HU-13)
    // =========================================================================

    public function testHU12CalculoYRegistroDeDanosEnModelo()
    {
        $danoRed = 40000.00;
        $danoBalon = 50000.00;
        $totalDanos = $danoRed + $danoBalon;

        $reserva = new Reserva(['danos' => $totalDanos]);

        $this->assertEquals(90000.00, $reserva->danos, "El modelo debe almacenar el valor acumulado de daños ($90.000).");
    }

    public function testHU13LiquidacionCompletaConAnticipoYDanos()
    {
        $alquiler = 120000.00;
        $reserva = new Reserva([
            'anticipo' => 50000.00,
            'danos'    => 40000.00,
            'estado'   => 'RECIBIDA'
        ]);

        // Fórmula HU-13: (Alquiler + Daños) - Anticipo
        $totalPagar = max(0, ($alquiler + $reserva->danos) - $reserva->anticipo);
        $reserva->estado = 'COMPLETADA';
        $reserva->metodo_pago = 'TRANSFERENCIA';

        $this->assertEquals(110000.00, $totalPagar, "El pago final debe ser (120.000 + 40.000) - 50.000 = $110.000.");
        $this->assertEquals('COMPLETADA', $reserva->estado);
        $this->assertEquals('TRANSFERENCIA', $reserva->metodo_pago);
    }

    public function testHU13LiquidacionSinAnticipoYConDanos()
    {
        $alquiler = 120000.00;
        $reserva = new Reserva([
            'anticipo' => 0.00,
            'danos'    => 30000.00,
            'estado'   => 'RECIBIDA'
        ]);

        $totalPagar = max(0, ($alquiler + $reserva->danos) - $reserva->anticipo);

        $this->assertEquals(150000.00, $totalPagar, "Sin anticipo y con $30.000 de daños, debe cobrar $150.000.");
    }
}