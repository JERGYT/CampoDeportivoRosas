import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { disponibilidadService, type Espacio } from '@/shared/services';
import { colors, radius } from '@/shared/theme/tokens';

import { TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, Chip, DataRow, Divider, Field, Notice, Row, SelectField, Small, T, Table } from '../components/ui';

const semanas = [
  { label: '01–07 oct', total: '$300.000', anticipos: 120000, pagos: 180000 },
  { label: '08–14 oct', total: '$420.000', anticipos: 140000, pagos: 280000 },
  { label: '15–21 oct', total: '$540.000', anticipos: 200000, pagos: 340000 },
  { label: '22–31 oct', total: '$420.000', anticipos: 140000, pagos: 280000 },
];
const MAX = 540000;
const ALTURA = 196;

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
  return (
    <View style={{ gap: 10 }}>
      <Row gap={16}>
        <T color={colors.textMuted} lh={1.45} style={{ flex: 1 }}>
          {label}
        </T>
        <T weight="semibold">{valor}</T>
      </Row>
      <View style={{ height: 8, width: `${(valor / total) * 100}%`, backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

export default function ReportesScreen() {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [periodo, setPeriodo] = useState('01 – 31 octubre 2026');
  const [espacio, setEspacio] = useState(0);
  const [perfil, setPerfil] = useState('todos');
  const [estado, setEstado] = useState('todos');

  // GET /view/espacios (ms-disponibilidad) para el filtro de espacio
  useEffect(() => {
    disponibilidadService
      .listarEspacios()
      .then((r) => setEspacios(r.espacios))
      .catch(() => setEspacios([]));
  }, []);

  return (
    <>
      <TitleBar title="Reportes de reservas e ingresos" subtitle="Concepto de consulta para el administrador. Todas las cifras son ilustrativas y no son métricas reales." />
      <Notice title="Funcionalidad futura">
        Exploración visual del módulo pendiente. Filtros, gráficos y exportación aún no están conectados a datos reales.
      </Notice>
      <Card title="Filtros del reporte" style={{ zIndex: 10 }}>
        <Row gap={16}>
          <Field label="Periodo" value={periodo} onChangeText={setPeriodo} style={{ flex: 1 }} />
          <SelectField
            label="Espacio"
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
              { label: 'Completada', value: 'COMPLETADA' },
              { label: 'Confirmada', value: 'CONFIRMADA' },
              { label: 'Cancelada', value: 'CANCELADA' },
            ]}
            style={{ flex: 1 }}
          />
          <Button label="Consultar demo" variant="secondary" />
        </Row>
      </Card>

      <Row gap={16}>
        <Kpi titulo="Reservas pactadas" valor="24" detalle="16 completadas · 4 confirmadas · 4 canceladas" />
        <Kpi titulo="Ingresos registrados · COP" valor="$1.680.000" detalle="Anticipos $600.000 + pagos finales $1.080.000" />
        <Kpi titulo="Cancelaciones confirmadas" valor="4" detalle="4 franjas liberadas en el conjunto demo" />
        <Kpi titulo="Consultas sin reserva" valor="3" detalle="Fuera de las 24 reservas · Sin cobro" />
      </Row>

      <TwoColumns
        main={
          <>
            <Card title="Ingresos registrados por semana" badge={<Chip label="COP · Demo" />}>
              <Row gap={16} align="center">
                <Chip label="Anticipos" dot="filled" />
                <View style={[styles.legend, { backgroundColor: colors.dangerBg }]}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dangerText }} />
                  <T size={12} weight="semibold" color={colors.dangerText}>
                    Pagos finales
                  </T>
                </View>
                <Small>Total bruto · No descuenta devoluciones</Small>
              </Row>
              <Row gap={0} align="flex-end" style={{ height: ALTURA + 90, paddingTop: 20 }}>
                {semanas.map((s) => (
                  <View key={s.label} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                    <T weight="semibold" numberOfLines={1}>{s.total}</T>
                    <View style={{ width: '70%', maxWidth: 96, borderTopLeftRadius: 6, borderTopRightRadius: 6, overflow: 'hidden' }}>
                      <View style={{ height: (s.pagos / MAX) * ALTURA, backgroundColor: colors.primary }} />
                      <View style={{ height: (s.anticipos / MAX) * ALTURA, backgroundColor: colors.navy }} />
                    </View>
                    <T size={12} color={colors.textMuted}>
                      {s.label}
                    </T>
                  </View>
                ))}
              </Row>
              <Small>Moneda asumida COP · No se incluyen cargos futuros.</Small>
            </Card>
            <Card title="Resumen por espacio">
              <Table
                columns={[{ title: 'Espacio' }, { title: 'Reservas' }, { title: 'Canceladas' }, { title: 'Ingresos · COP' }]}
                rows={[
                  ['Fútbol', '10', '1', '$840.000'],
                  ['Tejo', '6', '1', '$360.000'],
                  ['Salón de Eventos', '4', '1', '$300.000'],
                  ['Zona BBQ', '4', '1', '$180.000'],
                  ['Total demo', '24', '4', '$1.680.000'],
                ]}
              />
            </Card>
          </>
        }
        aside={
          <>
            <Card title="Distribución de reservas">
              <Barra label="Completadas" valor={16} total={24} color={colors.navy} />
              <Barra label="Confirmadas" valor={4} total={24} color={colors.primary} />
              <Barra label="Canceladas" valor={4} total={24} color={colors.textMuted} />
              <Divider />
              <T size={13} color={colors.textMuted} lh={1.45}>
                Las 3 consultas finalizadas sin reserva se muestran por separado, no como cancelaciones.
              </T>
            </Card>
            <Card title="Devoluciones y balance">
              <DataRow label="Devoluciones autorizadas" value="$120.000" />
              <DataRow label="Registradas como devueltas" value="$60.000" />
              <DataRow label="Pendientes" value="$60.000" />
              <Divider />
              <DataRow label="Ingresos brutos" value="$1.680.000" />
              <DataRow label="Devoluciones registradas" value="− $60.000" />
              <DataRow big label="Balance demo · COP" value="$1.620.000" />
              <Small>Solo se descuentan devoluciones efectivamente registradas, no las pendientes.</Small>
            </Card>
            <Card title="Salida del reporte" badge={<Chip label="Concepto" />}>
              <Button label="Exportar reporte · Futuro" variant="disabled" />
              <T size={13} color={colors.textMuted} lh={1.45}>
                Formato y campos definitivos por definir. Esta vista no genera archivos ni consultas reales.
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
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
});
