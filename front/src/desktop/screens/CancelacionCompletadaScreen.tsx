import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/shared/theme/tokens';

import { ReservaResumenCard, TwoColumns, TitleBar } from '../components/composites';
import { Button, Card, Chip, DataRow, Divider, Notice, Row, Small, T, Table } from '../components/ui';
import { reservaR1052 } from '../data/demo';
import { routes } from '../navigation';

function ResultadoTile({ etiqueta, valor, detalle, bg, fg }: { etiqueta: string; valor: string; detalle: string; bg: string; fg: string }) {
  return (
    <View style={[styles.tile, { backgroundColor: bg }]}>
      <T size={13} color={fg === colors.text ? colors.textMuted : fg} lh={1.45}>
        {etiqueta}
      </T>
      <T size={24} weight="semibold" color={fg} lh={1.3}>
        {valor}
      </T>
      <T size={13} color={fg} lh={1.45}>
        {detalle}
      </T>
    </View>
  );
}

export default function CancelacionCompletadaScreen() {
  return (
    <>
      <TitleBar title="Cancelación completada y auditoría" subtitle="La reserva está cancelada, el horario liberado y la devolución conserva su propio estado." />
      <Notice tone="success" title="Cancelación confirmada · R-1052">
        Ana Martínez confirmó el viernes 16 oct 2026 a las 10:30. Zona BBQ quedó disponible el domingo 18 oct, de 12:00 a 16:00.
      </Notice>
      <TwoColumns
        main={
          <>
            <Card title="Resultado de la cancelación">
              <Row gap={16}>
                <ResultadoTile etiqueta="Reserva" valor="Cancelada" detalle="Confirmada por Ana Martínez" bg={colors.chip} fg={colors.text} />
                <ResultadoTile etiqueta="Horario" valor="Liberado" detalle="Dom 18 oct · 12:00 – 16:00" bg={colors.successBg} fg={colors.successText} />
                <ResultadoTile etiqueta="Devolución" valor="Pendiente" detalle="$60.000 COP autorizados" bg={colors.dangerBg} fg={colors.dangerText} />
              </Row>
              <T lh={1.45}>Motivo: el titular no realizará la reunión familiar prevista. El registro se conserva para consulta y trazabilidad.</T>
            </Card>
            <Card title="Auditoría de acciones">
              <Table
                columns={[{ title: 'Momento', width: 170 }, { title: 'Acción y resultado', flex: 1.7 }, { title: 'Responsable', flex: 1 }]}
                rows={[
                  ['14 oct 2026 · 11:00', ['Reserva R-1052 confirmada', 'Zona BBQ · horario bloqueado'], ['Ana Martínez', 'Administradora']],
                  ['14 oct 2026 · 11:05', ['Anticipo A-0035 registrado', '$60.000 COP · Transferencia'], ['Ana Martínez', 'Administradora']],
                  ['16 oct 2026 · 10:20', ['Solicitud de cancelación abierta', 'Sin cambio de estado ni disponibilidad'], ['Ana Martínez', 'Solicitud de Diego Herrera']],
                  ['16 oct 2026 · 10:30', ['Cancelación confirmada', 'Confirmada → Cancelada'], ['Ana Martínez', 'Administradora']],
                  ['16 oct 2026 · 10:30', ['Horario liberado al confirmar', '18 oct · 12:00 – 16:00 · Zona BBQ'], ['Ana Martínez', 'Acción asociada a confirmación']],
                  ['16 oct 2026 · 10:35', ['Devolución D-0009 autorizada', '$60.000 COP · Sigue pendiente'], ['Ana Martínez', 'Administradora']],
                ]}
              />
              <Small>Campos y horas ilustrativos. Corte de consulta: 16 oct 2026 · 10:36. No hay devolución realizada registrada.</Small>
            </Card>
            <Notice title="Una consulta rechazada no es una reserva cancelada">
              «Finalizado sin reserva» no tiene franja que liberar, anticipo que devolver, cobros ni penalidades.
            </Notice>
          </>
        }
        aside={
          <>
            <ReservaResumenCard reserva={reservaR1052} estado="Cancelada" />
            <Card title="Seguimiento pendiente">
              <Chip label="Devolución pendiente" tone="danger" />
              <DataRow label="Importe autorizado" value="$60.000" />
              <DataRow label="Importe registrado como devuelto" value="$0" />
              <Divider />
              <T lh={1.45}>
                La cancelación ya terminó. La devolución puede completarse después sin cambiar el estado de la reserva ni volver a bloquear el horario.
              </T>
              <Button label="Gestionar devolución" onPress={() => router.push(routes.devolucion)} />
              <Button label="Consultar franja liberada" variant="secondary" onPress={() => router.push(routes.espacios)} />
              <Small>Multa por cancelación: concepto futuro, no aplicado. No existe un cargo registrado por cancelación.</Small>
            </Card>
          </>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minWidth: 170, borderRadius: radius.card - 4, padding: 20, gap: 10 },
});
