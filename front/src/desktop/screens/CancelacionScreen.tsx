import { router } from 'expo-router';
import { useState } from 'react';

import { colors } from '@/shared/theme/tokens';

import { ReservaResumenCard, TitleBar, TwoColumns } from '../components/composites';
import { DateTimeField } from '../components/DatePicker';
import { Button, Card, Chip, DataRow, Divider, Field, Notice, Row, Small, Stepper, T } from '../components/ui';
import { reservaR1052 } from '../data/demo';
import { routes } from '../navigation';

export default function CancelacionScreen() {
  const [solicitante, setSolicitante] = useState('Diego Herrera · Cliente titular');
  const [contacto, setContacto] = useState('310 555 0146');
  const [canal, setCanal] = useState('Llamada del cliente');
  const [fecha, setFecha] = useState({ fecha: '2026-10-16', hora: '10:20' });
  const [motivo, setMotivo] = useState(
    'El cliente informa que no realizará la reunión familiar prevista y solicita cancelar la reserva de Zona BBQ.',
  );
  const [notas, setNotas] = useState('Se verificó la referencia y el titular. Solicitud de devolución del anticipo a revisar por separado.');
  const [responsable, setResponsable] = useState('Ana Martínez · Administradora');

  return (
    <>
      <TitleBar title="Cancelar una reserva confirmada" subtitle="Recolecta los datos y revisa las repercusiones antes de confirmar la cancelación." />
      <Stepper current={2} steps={[{ label: 'Identificar reserva' }, { label: 'Datos y motivo' }, { label: 'Revisar y confirmar' }]} />
      <Notice tone="danger" title="Proceso abierto · el horario sigue ocupado">
        R-1052 permanece confirmada. Abrir esta solicitud no cancela la reserva ni libera la franja.
      </Notice>
      <TwoColumns
        main={
          <>
            <Card title="Datos de la solicitud" badge={<Chip label="Por confirmar" />}>
              <Row gap={16}>
                <Field label="Solicitante" value={solicitante} onChangeText={setSolicitante} style={{ flex: 1 }} />
                <Field label="Contacto" value={contacto} onChangeText={setContacto} style={{ flex: 1 }} />
              </Row>
              <Row gap={16}>
                <Field label="Canal de solicitud" value={canal} onChangeText={setCanal} style={{ flex: 1 }} />
                <DateTimeField label="Fecha de solicitud" fecha={fecha.fecha} hora={fecha.hora} onChange={(f, h) => setFecha({ fecha: f, hora: h })} style={{ flex: 1 }} />
              </Row>
              <Field label="Motivo de cancelación" value={motivo} onChangeText={setMotivo} multiline />
              <Field label="Notas del administrador" value={notas} onChangeText={setNotas} />
            </Card>
            <Card title="Repercusiones al confirmar">
              <DataRow label="Estado de la reserva" value="Confirmada → Cancelada" />
              <DataRow label="Franja del domingo 18 oct" value="Ocupada → Disponible" />
              <DataRow label="Anticipo registrado" value="$60.000 COP" />
              <Divider />
              <T lh={1.45}>
                La franja 12:00–16:00 de Zona BBQ se libera solo al confirmar. Se conserva la trazabilidad de la reserva y de quien confirma.
              </T>
              <Notice title="Cancelación y devolución son procesos distintos">
                Confirmar no registra una devolución. El importe a devolver se autoriza manualmente en el siguiente proceso; no hay porcentajes ni plazos definidos.
              </Notice>
            </Card>
            <Card title="Revisión condicional" badge={<Chip label="FUTURO · No aplicado" />}>
              <T size={13} color={colors.textMuted} lh={1.45}>
                Concepto futuro: multa de $100.000 COP solo si la cancelación causó la pérdida de otra reserva. Requeriría revisión del administrador; no es un cargo vigente ni automático.
              </T>
              <DataRow label="Importe aplicado a este caso" value="$0 COP" />
              <Small>No se suma a esta cancelación ni a la liquidación normal.</Small>
            </Card>
          </>
        }
        aside={
          <>
            <ReservaResumenCard reserva={reservaR1052} estado="Confirmada" />
            <Card title="Confirmación final">
              <T weight="semibold" lh={1.45}>
                Has revisado los datos de R-1052
              </T>
              <T lh={1.45}>{'✓ Titular y motivo verificados\n✓ Franja que se liberará revisada\n✓ Devolución pendiente de gestionar'}</T>
              <Field label="Responsable" value={responsable} onChangeText={setResponsable} />
              <Notice tone="danger" title="Esta acción cancela la reserva">
                Al confirmar, se libera el horario y se registra el responsable en la auditoría.
              </Notice>
              <Button label="Confirmar cancelación" onPress={() => router.push(routes.cancelacionCompletada)} />
              <Button label="Volver sin cancelar" variant="secondary" onPress={() => router.navigate(routes.reservas)} />
              <Small>Volver mantiene la reserva confirmada y el horario ocupado. Esta solicitud aún no es una cancelación completada.</Small>
            </Card>
          </>
        }
      />
    </>
  );
}
