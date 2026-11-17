<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Illuminate\Database\Capsule\Manager as Capsule;

class ReportesController
{
    public function generar(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $desde = $params['desde'] ?? null;
        $hasta = $params['hasta'] ?? null;

        $query = Capsule::table('reservas')
            ->leftJoin('clientes', 'reservas.cliente_id', '=', 'clientes.id')
            ->select(
                'reservas.*',
                'clientes.nombre as cliente_nombre'
            )
            ->orderBy('reservas.fecha', 'desc');

        if (!empty($desde)) {
            $query->where('reservas.fecha', '>=', $desde);
        }
        if (!empty($hasta)) {
            $query->where('reservas.fecha', '<=', $hasta);
        }

        $reservas = $query->get();
        $alquilerBase = 120000.00;

        $totalReservas = count($reservas);
        $confirmadas = 0;
        $completadas = 0;
        $canceladas = 0;
        $ingresosAlquiler = 0.0;
        $ingresosDanos = 0.0;
        $totalDevoluciones = 0.0;

        $detalle = [];

        foreach ($reservas as $r) {
            $estado = strtoupper(trim($r->estado ?? 'CONFIRMADA'));
            $anticipo = floatval($r->anticipo ?? 0);
            $danos = floatval($r->danos ?? 0);
            $devolucion = floatval($r->monto_devolucion ?? 0);

            if ($estado === 'CANCELADA') {
                $canceladas++;
                $retencion = max(0, $anticipo - $devolucion);
                $ingresosAlquiler += $retencion;
                $totalDevoluciones += $devolucion;
                $ingresoFila = $retencion;
            } elseif ($estado === 'COMPLETADA') {
                $completadas++;
                $ingresosAlquiler += $alquilerBase;
                $ingresosDanos += $danos;
                $ingresoFila = $alquilerBase + $danos;
            } else {
                $confirmadas++;
                $ingresosAlquiler += $anticipo;
                $ingresoFila = $anticipo;
            }

            $detalle[] = [
                'id' => $r->id,
                'codigo' => 'R-' . str_pad($r->id, 4, '0', STR_PAD_LEFT),
                'cliente' => $r->cliente_nombre ?: ($r->entidad_organizadora ?: 'Cliente #' . $r->cliente_id),
                'tipo' => $r->tipo,
                'espacio_id' => $r->espacio_id,
                'fecha' => $r->fecha,
                'franja' => substr($r->hora_inicio, 0, 5) . ' - ' . substr($r->hora_fin, 0, 5),
                'estado' => $estado,
                'anticipo' => $anticipo,
                'danos' => $danos,
                'devolucion' => $devolucion,
                'ingreso_neto' => $ingresoFila,
                'metodo_pago' => $r->metodo_pago ?? 'PENDIENTE'
            ];
        }

        $ingresoNetoTotal = $ingresosAlquiler + $ingresosDanos;

        $response->getBody()->write(json_encode([
            'status' => 'success',
            'resumen' => [
                'total_reservas' => $totalReservas,
                'activas_confirmadas' => $confirmadas,
                'completadas' => $completadas,
                'canceladas' => $canceladas,
                'ingresos_alquiler' => $ingresosAlquiler,
                'ingresos_danos' => $ingresosDanos,
                'total_devoluciones' => $totalDevoluciones,
                'ingreso_neto_total' => $ingresoNetoTotal,
            ],
            'detalle' => $detalle
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}