import { router } from 'expo-router';
import { useState } from 'react';

import { colors } from '@/shared/theme/tokens';

import { ProcesoReserva, ReservaResumenCard, TitleBar, TwoColumns } from '../components/composites';
import { DateTimeField } from '../components/DatePicker';
import { Button, Card, Chip, DataRow, Divider, Field, Notice, Row, Small, T, Table } from '../components/ui';
import { reservaR1048 } from '../data/demo';
import { routes } from '../navigation';

export default function RecepcionScreen() {
  const [conIncidencias, setConIncidencias] = useState(true);
  const [limpieza, setLimpieza] = useState('✓ Conforme');
  const [instalaciones, setInstalaciones] = useState('✓ Sin novedades');
  const [incidencia, setIncidencia] = useState(
    'Un peto presenta una rotura lateral. El resto del inventario y la cancha se reciben en las condiciones registradas en la entrega.',
  );
  const [responsable, setResponsable] = useState('Carlos Ruiz · Operario');
  const [fecha, setFecha] = useState({ fecha: '2026-10-17', hora: '18:05' });

  return (
    <>
      <TitleBar title="Recepción final" subtitle="Compara lo recibido con la entrega, registra novedades y prepara el cierre." />
      <ProcesoReserva current={2} />
      <Notice title="Entrega registrada · R-1048 está en uso">
        Carlos Ruiz entregó Fútbol el sábado 17 oct a las 16:00. Recepción: 18:05.
      </Notice>
      <TwoColumns
        main={
          <>
            <Card title="Checklist de recepción" badge={<Chip label="4 ítems verificados" />}>
              <T size={13} color={colors.textMuted} lh={1.45}>
                Inventario ilustrativo · La revisión registra condiciones, no calcula cargos.
              </T>
              <Table
                columns={[{ title: 'Espacio / implemento' }, { title: 'Entregado' }, { title: 'Recibido' }, { title: 'Condición' }]}
                rows={[
                  ['Cancha de fútbol', '1 espacio', '1 espacio', '✓ Sin novedades'],
                  ['Balones de entrenamiento', '2 unidades', '2 unidades', '✓ Buen estado'],
                  ['Petos de entrenamiento', '10 unidades', '10 unidades', conIncidencias ? '! 1 con rotura' : '✓ Completos'],
                  ['Conos de señalización', '8 unidades', '8 unidades', '✓ Buen estado'],
                ]}
              />
              <Row gap={16}>
                <Field label="Limpieza del espacio" value={limpieza} onChangeText={setLimpieza} style={{ flex: 1 }} />
                <Field label="Instalaciones y accesos" value={instalaciones} onChangeText={setInstalaciones} style={{ flex: 1 }} />
              </Row>
              <Small>Se verificaron el espacio, las cantidades y el estado de todos los implementos entregados.</Small>
            </Card>
            <Card title="Resultado de la recepción">
              <Row gap={12}>
                <Chip
                  label="Con incidencias"
                  tone={conIncidencias ? 'danger' : 'neutral'}
                  dot={conIncidencias ? 'filled' : 'outline'}
                  onPress={() => setConIncidencias(true)}
                />
                <Chip
                  label="Sin novedades"
                  tone={conIncidencias ? 'neutral' : 'success'}
                  dot={conIncidencias ? 'outline' : 'filled'}
                  onPress={() => setConIncidencias(false)}
                />
              </Row>
              {conIncidencias ? <Field label="Incidencia observada" value={incidencia} onChangeText={setIncidencia} multiline /> : null}
              <Row gap={16}>
                <Field label="Responsable de recepción" value={responsable} onChangeText={setResponsable} style={{ flex: 1 }} />
                <DateTimeField label="Fecha y hora" fecha={fecha.fecha} hora={fecha.hora} onChange={(f, h) => setFecha({ fecha: f, hora: h })} style={{ flex: 1 }} />
              </Row>
              {conIncidencias ? (
                <Notice title="La valoración corresponde al administrador">
                  Esta incidencia se remite para revisión. Todavía no existe un importe de daño aprobado.
                </Notice>
              ) : null}
            </Card>
          </>
        }
        aside={
          <>
            <ReservaResumenCard reserva={reservaR1048} estado="En uso" />
            <Card title="Guardar recepción">
              <DataRow label="Devuelve por el cliente" value="Laura Gómez" />
              <DataRow label="Novedades" value={conIncidencias ? '1 incidencia' : 'Sin novedades'} />
              <Divider />
              {conIncidencias ? (
                <Button label="Registrar y remitir incidencia" onPress={() => router.push(routes.danos)} />
              ) : (
                <Button label="Registrar recepción" onPress={() => router.push(routes.liquidacion)} />
              )}
              <Button label="Volver a la entrega" variant="secondary" onPress={() => router.navigate(routes.entrega)} />
              <T size={13} color={colors.textMuted} lh={1.45}>
                Al guardar: estado Recibida. La reserva aún requiere liquidación y pago final.
              </T>
              <Notice tone="success" title="Recepción sin novedades">
                Si todos los ítems están conformes, selecciona «Sin novedades» y registra la recepción sin crear un daño.
              </Notice>
            </Card>
          </>
        }
      />
    </>
  );
}
