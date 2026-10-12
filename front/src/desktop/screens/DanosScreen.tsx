import { router } from 'expo-router';
import { useState } from 'react';

import { colors } from '@/shared/theme/tokens';
import { formatCOP } from '@/shared/utils/format';

import { ReservaResumenCard, TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, Chip, DataRow, Divider, Field, FooterNote, Notice, Row, Small, T, Table, Timeline } from '../components/ui';
import { reservaR1048 } from '../data/demo';
import { routes } from '../navigation';

export default function DanosScreen() {
  const [descripcion, setDescripcion] = useState(
    'Rotura de aproximadamente 8 cm en la costura lateral de un peto. Se entregó sin roturas y se identificó la novedad durante la recepción.',
  );
  const [nota, setNota] = useState('Se revisa la prenda y se considera reparable. Se propone el costo de reparación, no el reemplazo completo.');
  const [criterio, setCriterio] = useState('Reparación de costura lateral');
  const [importeTxt, setImporteTxt] = useState('$25.000');
  const [responsable, setResponsable] = useState('Ana Martínez · Administradora');

  const importe = Number(importeTxt.replace(/[^\d]/g, '')) || 0;

  return (
    <>
      <TitleBar title="Registro y valoración de daños" subtitle="Revisa la incidencia y determina manualmente el importe que corresponde registrar." />
      <Notice tone="danger" title="Recepción con incidencia · R-1048">
        17 oct 2026 · 18:05 · Carlos Ruiz: un peto con rotura lateral. La incidencia no genera un cargo automático.
      </Notice>
      <TwoColumns
        main={
          <>
            <Card title="Detalle del daño" badge={<Chip label="D-0021" />}>
              <Row gap={16}>
                <Field label="Reserva" value="R-1048 · Fútbol" style={{ flex: 1 }} />
                <Field label="Ítem afectado" value="Peto de entrenamiento · 1 unidad" style={{ flex: 1 }} />
              </Row>
              <Field label="Descripción" value={descripcion} onChangeText={setDescripcion} multiline />
              <Row gap={16}>
                <Field label="Estado al entregar" value="Completos · sin roturas" style={{ flex: 1 }} />
                <Field label="Estado al recibir" value="10 recibidos · 1 con rotura" style={{ flex: 1 }} />
              </Row>
              <Field label="Nota de revisión del administrador" value={nota} onChangeText={setNota} multiline />
            </Card>
            <Card title="Valoración manual" badge={<Chip label="Datos de ejemplo" />}>
              <Row gap={16}>
                <Field label="Criterio o justificación" value={criterio} onChangeText={setCriterio} style={{ flex: 1 }} />
                <Field
                  label="Importe del daño · COP"
                  value={importeTxt}
                  onChangeText={(v) => setImporteTxt(formatCOP(Number(v.replace(/[^\d]/g, '')) || 0))}
                  keyboardType="numeric"
                  helper="Importe ilustrativo, definido por el administrador."
                  style={{ flex: 1 }}
                />
              </Row>
              <Notice title="Sin baremo obligatorio">
                El importe es una valoración manual de este caso. No se aplica una tabla de tarifas ni un cargo estándar.
              </Notice>
              <Table
                columns={[{ title: 'Concepto' }, { title: 'Cantidad' }, { title: 'Importe · COP' }]}
                rows={[
                  ['Reparación del peto', '1', formatCOP(importe)],
                  ['Total de daños valorados', '', formatCOP(importe)],
                ]}
              />
            </Card>
            <Card title="Origen y revisión">
              <Timeline
                events={[
                  { title: 'Incidencia recibida · 17 oct, 18:05', detail: 'Carlos Ruiz · Operario · Checklist de recepción.' },
                  { title: 'Valoración preparada · 17 oct, 18:15', detail: `Ana Martínez · Administradora · ${formatCOP(importe)} COP.` },
                ]}
              />
            </Card>
          </>
        }
        aside={
          <>
            <ReservaResumenCard reserva={reservaR1048} estado="Recibida" />
            <Card title="Revisión del administrador" badge={<Chip label="Por registrar" />}>
              <Field label="Responsable" value={responsable} onChangeText={setResponsable} />
              <DataRow big label="Importe revisado" value={formatCOP(importe)} />
              <T size={13} lh={1.45}>
                La revisión está preparada. Registra la valoración para incorporarla a la liquidación; no se ha cobrado todavía.
              </T>
              <Button label="Registrar valoración revisada" onPress={() => router.push(routes.liquidacion)} />
              <Button label="Volver a recepción" variant="secondary" onPress={() => router.navigate(routes.recepcion)} />
              <Divider />
              <Small color={colors.textMuted}>
                En la siguiente vista, este daño aparece registrado. Si la revisión descarta el daño, su importe será $0 y no se añadirá un cargo.
              </Small>
            </Card>
          </>
        }
      />
      <FooterNote />
    </>
  );
}
