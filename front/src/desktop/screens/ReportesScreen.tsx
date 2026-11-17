import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { disponibilidadService, reservasService, type Espacio } from '@/shared/services';
import { colors, radius } from '@/shared/theme/tokens';
import { formatCOP } from '@/shared/utils/format';

import { TitleBar, TwoColumns } from '../components/composites';
import { DateRangeField } from '../components/DatePicker';
import { Button, Card, Chip, DataRow, Divider, Notice, Row, SelectField, Small, T, Table } from '../components/ui';

function Kpi({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <View style={styles.kpi}>
      <T size={13} color={colors.textMuted} lh={1.45}>
        {titulo}
      </T>
      <T size={30} weight="semibold" lh={1.3} numberOfLines={1}>
        {valor}
      </T>
      <Small>{detalle}</Small>
    </View>
  );
}

function Barra({ label, valor, total, color }: { label: string; valor: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((valor / total) * 100)) : 0;
  return (
    <View style={{ gap: 10 }}>
      <Row gap={16}>
        <T color={colors.textMuted} lh={1.45} style={{ flex: 1 }}>
          {label}
        </T>
        <T weight="semibold">
          {valor} ({pct}%)
        </T>
      </Row>
      <View style={{ height: 8, width: '100%', backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: 8, width: `${pct}%`, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

const MAPA_ESPACIOS_BASE: Record<number, string> = {
  1: 'Cancha Sintética Fútbol 8',
  2: 'Cancha de Tejo Tradicional',
  3: 'Salón Comunal para Eventos',
  4: 'Zona Barbecue (BBQ)',
};

export default function ReportesScreen() {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [rango, setRango] = useState<{ desde: string; hasta: string }>({ desde: '', hasta: '' });
  const [espacio, setEspacio] = useState(0);
  const [perfil, setPerfil] = useState('todos');
  const [estado, setEstado] = useState('todos');

  const [detalleBD, setDetalleBD] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [avisoExport, setAvisoExport] = useState<string | null>(null);

  const cargarReporte = useCallback((desde?: string, hasta?: string) => {
    setCargando(true);
    setAvisoExport(null);
    reservasService
      .obtenerReportes({
        desde: desde || undefined,
        hasta: hasta || undefined,
      })
      .then((res: any) => {
        if (res?.detalle && Array.isArray(res.detalle)) {
          setDetalleBD(res.detalle);
        } else {
          setDetalleBD([]);
        }
      })
      .catch(() => setDetalleBD([]))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    disponibilidadService
      .obtenerEspacios()
      .then((esp) => setEspacios(esp || []))
      .catch(() => setEspacios([]));
    reservasService
      .obtenerReportes()
      .then((res: any) => {
        if (res?.detalle && Array.isArray(res.detalle)) {
          setDetalleBD(res.detalle);
        } else {
          setDetalleBD([]);
        }
      })
      .catch(() => setDetalleBD([]))
      .finally(() => setCargando(false));
  }, []);

  const nombreEspacio = useCallback(
    (id: number) => {
      const encontrado = espacios.find((e) => Number(e.id) === Number(id));
      return encontrado?.nombre || MAPA_ESPACIOS_BASE[id] || `Espacio #${id}`;
    },
    [espacios],
  );

  const filasFiltradas = useMemo(() => {
    return detalleBD.filter((r: any) => {
      const est = String(r.estado || '').toUpperCase();
      const cumpleEspacio = !espacio || Number(r.espacio_id) === Number(espacio);
      const cumplePerfil = perfil === 'todos' || r.tipo === perfil;
      const cumpleEstado =
        estado === 'todos' ||
        (estado === 'ACTIVA'
          ? est === 'CONFIRMADA' || est === 'ENTREGADA' || est === 'RECIBIDA'
          : est === estado);
      return cumpleEspacio && cumplePerfil && cumpleEstado;
    });
  }, [detalleBD, espacio, perfil, estado]);

  const metricas = useMemo(() => {
    let totalReservas = 0;
    let confirmadasActivas = 0;
    let completadas = 0;
    let canceladas = 0;
    let ingresosAlquiler = 0;
    let ingresosDanos = 0;
    let totalDevoluciones = 0;

    filasFiltradas.forEach((r: any) => {
      totalReservas++;
      const est = String(r.estado || 'CONFIRMADA').toUpperCase();
      const anticipo = Number(r.anticipo) || 0;
      const danos = Number(r.danos) || 0;
      const devolucion = Number(r.devolucion) || 0;

      if (est === 'CANCELADA') {
        canceladas++;
        const retencion = Math.max(0, anticipo - devolucion);
        ingresosAlquiler += retencion;
        totalDevoluciones += devolucion;
      } else if (est === 'COMPLETADA') {
        completadas++;
        ingresosAlquiler += 120000;
        ingresosDanos += danos;
      } else {
        confirmadasActivas++;
        ingresosAlquiler += anticipo;
      }
    });

    const ingresoNetoTotal = ingresosAlquiler + ingresosDanos;
    return {
      totalReservas,
      confirmadasActivas,
      completadas,
      canceladas,
      ingresosAlquiler,
      ingresosDanos,
      totalDevoluciones,
      ingresoNetoTotal,
    };
  }, [filasFiltradas]);

  const resumenPorEspacio = useMemo(() => {
    const ids = espacios.length > 0 ? espacios.map((e) => Number(e.id)) : [1, 2, 3, 4];
    const filas = ids.map((id) => {
      const delEspacio = filasFiltradas.filter((r) => Number(r.espacio_id) === id);
      const cant = delEspacio.length;
      const canc = delEspacio.filter((r) => String(r.estado).toUpperCase() === 'CANCELADA').length;
      const ing = delEspacio.reduce((acc, r) => acc + (Number(r.ingreso_neto) || 0), 0);
      return [nombreEspacio(id), String(cant), String(canc), formatCOP(ing)];
    });
    filas.push([
      'Total consolidado',
      String(metricas.totalReservas),
      String(metricas.canceladas),
      formatCOP(metricas.ingresoNetoTotal),
    ]);
    return filas;
  }, [espacios, filasFiltradas, metricas, nombreEspacio]);

  const exportarCSV = () => {
    const encabezados = [
      'Codigo',
      'Cliente',
      'Tipo',
      'Espacio',
      'Fecha',
      'Franja',
      'Estado',
      'Anticipo_COP',
      'Danos_COP',
      'Devolucion_COP',
      'Ingreso_Neto_COP',
      'Metodo_Pago',
    ];
    const lineas = filasFiltradas.map((r: any) => [
      r.codigo,
      `"${String(r.cliente || '').replace(/"/g, '""')}"`,
      r.tipo,
      `"${nombreEspacio(r.espacio_id)}"`,
      r.fecha,
      r.franja,
      r.estado,
      r.anticipo,
      r.danos,
      r.devolucion,
      r.ingreso_neto,
      r.metodo_pago,
    ]);
    const contenido = '\uFEFF' + [encabezados.join(','), ...lineas.map((l) => l.join(','))].join('\n');

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_reservas_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setAvisoExport(`Reporte CSV generado exitosamente con ${filasFiltradas.length} registros.`);
  };

  const limpiarFiltros = () => {
    setRango({ desde: '', hasta: '' });
    setEspacio(0);
    setPerfil('todos');
    setEstado('todos');
    cargarReporte('', '');
  };

  return (
    <>
      <TitleBar
        title="Reportes de reservas, ingresos y cancelaciones"
        subtitle="Consulta indicadores financieros en tiempo real desde la base de datos y exporta el consolidado en CSV."
      />

      <Card title="Filtros del reporte" style={{ zIndex: 50, elevation: 50, overflow: 'visible' }}>
        <Row gap={16} style={{ zIndex: 60, elevation: 60 }}>
          <DateRangeField
            label="Periodo (Desde – Hasta)"
            desde={rango.desde}
            hasta={rango.hasta}
            onChange={(desde, hasta) => setRango({ desde, hasta })}
            style={{ flex: 1.3 }}
          />
          <SelectField
            label="Espacio deportivo"
            value={espacio}
            onChange={setEspacio}
            options={[{ label: 'Todos los espacios', value: 0 }, ...espacios.map((e) => ({ label: e.nombre, value: e.id }))]}
            style={{ flex: 1 }}
          />
          <SelectField
            label="Tipo de cliente"
            value={perfil}
            onChange={setPerfil}
            options={[
              { label: 'Todos los perfiles', value: 'todos' },
              { label: 'Escuela de Formación', value: 'ESCUELA_FORMACION' },
              { label: 'Campeonato', value: 'CAMPEONATO' },
              { label: 'Particular', value: 'PARTICULAR' },
            ]}
            style={{ flex: 1 }}
          />
          <SelectField
            label="Estado de reserva"
            value={estado}
            onChange={setEstado}
            options={[
              { label: 'Todos los estados', value: 'todos' },
              { label: 'Activas / Confirmadas', value: 'ACTIVA' },
              { label: 'Completada', value: 'COMPLETADA' },
              { label: 'Cancelada', value: 'CANCELADA' },
            ]}
            style={{ flex: 1 }}
          />
        </Row>
        <Row gap={16} style={{ marginTop: 12 }}>
          <Chip label={cargando ? 'Actualizando...' : `${filasFiltradas.length} registros en el reporte`} />
          <View style={{ flex: 1 }} />
          <Button label="Consultar en BD" onPress={() => cargarReporte(rango.desde, rango.hasta)} />
          <Button label="Limpiar" variant="secondary" onPress={limpiarFiltros} />
        </Row>
      </Card>

      {avisoExport ? (
        <Notice tone="success" title="Exportación completada">
          {avisoExport}
        </Notice>
      ) : null}

      <Row gap={16}>
        <Kpi
          titulo="Reservas registradas"
          valor={String(metricas.totalReservas)}
          detalle={`${metricas.completadas} completadas · ${metricas.confirmadasActivas} activas · ${metricas.canceladas} canceladas`}
        />
        <Kpi
          titulo="Ingreso neto total · COP"
          valor={formatCOP(metricas.ingresoNetoTotal)}
          detalle={`Alquiler ${formatCOP(metricas.ingresosAlquiler)} + daños ${formatCOP(metricas.ingresosDanos)}`}
        />
        <Kpi
          titulo="Cancelaciones confirmadas"
          valor={String(metricas.canceladas)}
          detalle={`Devoluciones registradas: ${formatCOP(metricas.totalDevoluciones)}`}
        />
        <Kpi
          titulo="Cobros por daños · COP"
          valor={formatCOP(metricas.ingresosDanos)}
          detalle="Reposición e implementos liquidados"
        />
      </Row>

      <TwoColumns
        main={
          <>
            <Card title="Resumen consolidado por espacio" badge={<Chip label="Datos reales MySQL" />}>
              <Table
                columns={[
                  { title: 'Espacio', flex: 1.5 },
                  { title: 'Reservas' },
                  { title: 'Canceladas' },
                  { title: 'Ingreso neto · COP' },
                ]}
                rows={resumenPorEspacio}
              />
            </Card>

            <Card title="Detalle de reservas e ingresos del periodo" badge={<Chip label={`${filasFiltradas.length} filas`} />}>
              <Table
                columns={[
                  { title: 'Código / Cliente', flex: 1.4 },
                  { title: 'Espacio / Fecha', flex: 1.3 },
                  { title: 'Estado' },
                  { title: 'Ingreso neto · COP' },
                ]}
                rows={
                  filasFiltradas.length > 0
                    ? filasFiltradas.map((r: any) => [
                        [r.codigo, r.cliente],
                        [`${nombreEspacio(r.espacio_id)} · ${r.fecha}`, r.franja],
                        [r.estado, `Anticipo: ${formatCOP(Number(r.anticipo) || 0)}`],
                        formatCOP(Number(r.ingreso_neto) || 0),
                      ])
                    : [[['Sin registros', 'No hay reservas con los filtros seleccionados'], ['---', '---'], ['---'], '$0']]
                }
              />
            </Card>
          </>
        }
        aside={
          <>
            <Card title="Distribución de reservas">
              <Barra label="Completadas" valor={metricas.completadas} total={metricas.totalReservas} color={colors.navy} />
              <Barra
                label="Activas / Confirmadas"
                valor={metricas.confirmadasActivas}
                total={metricas.totalReservas}
                color={colors.primary}
              />
              <Barra label="Canceladas" valor={metricas.canceladas} total={metricas.totalReservas} color={colors.textMuted} />
              <Divider />
              <T size={13} color={colors.textMuted} lh={1.45}>
                Distribución calculada directamente sobre las {metricas.totalReservas} reservas filtradas.
              </T>
            </Card>

            <Card title="Devoluciones y balance financiero">
              <DataRow label="Ingresos por alquiler y anticipos" value={formatCOP(metricas.ingresosAlquiler)} />
              <DataRow label="Ingresos por cobro de daños" value={formatCOP(metricas.ingresosDanos)} />
              <DataRow label="Devoluciones de anticipo aplicadas" value={formatCOP(-metricas.totalDevoluciones)} />
              <Divider />
              <DataRow big label="Balance neto · COP" value={formatCOP(metricas.ingresoNetoTotal)} />
              <Small>
                En reservas canceladas se contabiliza únicamente la retención neta (anticipo menos devolución).
              </Small>
            </Card>

            <Card title="Exportación del reporte" badge={<Chip label="CSV" />}>
              <Button label="Exportar reporte CSV" onPress={exportarCSV} />
              <T size={13} color={colors.textMuted} lh={1.45}>
                Descarga un archivo CSV compatible con Excel con el detalle de reservas, anticipos, daños, devoluciones e ingreso neto.
              </T>
            </Card>
          </>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  kpi: {
    flex: 1,
    minWidth: 230,
    gap: 12,
    padding: 24,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
