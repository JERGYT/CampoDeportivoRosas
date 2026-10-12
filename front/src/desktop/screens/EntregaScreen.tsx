import { router } from 'expo-router';
import { useState } from 'react';

import { disponibilidadService } from '@/shared/services';
import { colors } from '@/shared/theme/tokens';

import { ProcesoReserva, ReservaResumenCard, TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, Chip, DataRow, Divider, Field, FooterNote, Notice, Row, T, Table } from '../components/ui';
import { reservaR1048 } from '../data/demo';
import { routes } from '../navigation';

export default function EntregaScreen() {
  const [momento, setMomento] = useState('Sáb 17 oct 2026 · 15:50');
  const [validando, setValidando] = useState(false);
  const [observaciones, setObservaciones] = useState('Se entrega el espacio despejado y el inventario completo.');
  const [responsable, setResponsable] = useState('Carlos Ruiz · Operario');
  const [fechaEntrega, setFechaEntrega] = useState('17/10/2026 · 16:00');

  // Revalida que la franja pactada siga bloqueada para R-1048 (GET /view/cronograma, ms-disponibilidad).
  const volverAValidar = async () => {
    setValidando(true);
    try {
      await disponibilidadService.cronograma({ espacio_id: 1, desde: '2026-10-17', hasta: '2026-10-17' });
      const ahora = new Date();
      setMomento(`Sáb 17 oct 2026 · ${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`);
    } finally {
      setValidando(false);
    }
  };

  return (
    <>
      <TitleBar title="Entrega del espacio e implementos" subtitle="Valida la reserva antes de dar acceso y deja constancia de lo entregado." />
      <ProcesoReserva current={1} />
      <TwoColumns
        main={
          <>
            <Card title="Validación previa" badge={<Chip label="Validada" />}>
              <Row gap={16}>
                <Field label="Reserva consultada" value="R-1048 · Escuela Semillero" style={{ flex: 1 }} />
                <Field label="Momento de validación" value={momento} style={{ flex: 1 }} />
                <Button label="Volver a validar" variant="secondary" loading={validando} onPress={volverAValidar} />
              </Row>
              <Table
                columns={[{ title: 'Comprobación' }, { title: 'Resultado' }]}
                rows={[
                  ['Estado actual de la reserva', 'Confirmada · No cancelada'],
                  ['Espacio y franja pactada', 'Fútbol · 17 oct · 16:00 – 18:00'],
                  ['Cliente y contacto verificados', 'Escuela Semillero · Laura Gómez'],
                  ['Entrega anterior', 'Sin entrega registrada'],
                ]}
              />
              <Notice tone="success" title="Reserva apta para entrega">
                Estado confirmado y datos coincidentes. El anticipo es opcional; no condiciona esta validación. Sigue con Registrar entrega.
              </Notice>
            </Card>
            <Card title="Inventario a entregar" badge={<Chip label="Datos de ejemplo" />}>
              <T size={13} color={colors.textMuted} lh={1.45}>
                Elementos y cantidades ilustrativos. Verifica físicamente cada ítem antes de registrar.
              </T>
              <Table
                columns={[{ title: 'Espacio / implemento' }, { title: 'Cantidad' }, { title: 'Estado inicial' }, { title: 'Verificación' }]}
                rows={[
                  ['Cancha de fútbol', '1 espacio', 'Limpia · sin novedades', '✓ Revisado'],
                  ['Balones de entrenamiento', '2 unidades', 'Buen estado', '✓ Revisado'],
                  ['Petos de entrenamiento', '10 unidades', 'Completos · sin roturas', '✓ Revisado'],
                  ['Conos de señalización', '8 unidades', 'Buen estado', '✓ Revisado'],
                ]}
              />
              <Field label="Observaciones de entrega · opcional" value={observaciones} onChangeText={setObservaciones} />
              <Row gap={16}>
                <Field label="Responsable de entrega" value={responsable} onChangeText={setResponsable} style={{ flex: 1 }} />
                <Field label="Fecha y hora de entrega" value={fechaEntrega} onChangeText={setFechaEntrega} style={{ flex: 1 }} />
              </Row>
            </Card>
          </>
        }
        aside={
          <>
            <ReservaResumenCard reserva={reservaR1048} estado="Confirmada" />
            <Card title="Registro de entrega">
              <DataRow label="Recibe por el cliente" value="Laura Gómez" />
              <DataRow label="Estado al guardar" value="En uso" />
              <Divider />
              <T lh={1.45}>
                Al registrar, quedarán asociados el inventario, las observaciones y el responsable a R-1048. Luego continúa con Recibir al finalizar.
              </T>
              <Button label="Registrar entrega" onPress={() => router.push(routes.recepcion)} />
              <Button label="Volver al detalle" variant="secondary" onPress={() => router.navigate(routes.reservas)} />
              <Notice title="Control de estado">
                Si la reserva está cancelada, finalizada o no existe, no se habilita una nueva entrega.
              </Notice>
            </Card>
          </>
        }
      />
      <FooterNote />
    </>
  );
}
