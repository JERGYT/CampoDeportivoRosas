import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, T, Divider, Chip, Row, DataRow } from '../components/ui';
import { formatCOP } from '../../shared/utils/format';
import { routes } from '../navigation';

export default function CancelacionCompletadaScreen() {
  const params = useLocalSearchParams();
  const reservaId = params.id ? String(params.id) : '---';
  const motivo = (params.motivo as string) || 'Cancelación de reserva';
  const devolucion = parseFloat(params.devolucion as string) || 0;
  const metodo = (params.metodo as string) || 'NO_APLICA';
  const fechaCancelacion = (params.fecha_cancelacion as string) || new Date().toLocaleString('es-CO');

  return (
    <>
      <TitleBar
        title="Auditoría de cancelación y liberación de agenda "
        subtitle="Constancia legal del cierre de la reserva y liberación sincrónica del espacio deportivo."
      />

      <TwoColumns
        main={
          <Card title="Comprobante oficial de auditoría">
            <View style={{ padding: 14, backgroundColor: '#ECFDF5', borderRadius: 8, borderWidth: 1, borderColor: '#10B981', marginBottom: 14 }}>
              <T weight="semibold" style={{ color: '#065F46', fontSize: 16 }}>
                ✓ Cancelación completada y horario liberado con éxito
              </T>
              <T size={13} style={{ color: '#047857', marginTop: 4 }}>
                La reserva ha sido dada de baja en la base de datos y el horario en el microservicio de disponibilidad ya se encuentra abierto a nuevos clientes[cite: 24].
              </T>
            </View>

            <T weight="semibold" size={15} style={{ marginBottom: 8 }}>Registro de auditoría del sistema:</T>
            <DataRow label="Identificador de reserva" value={`R-${String(reservaId).padStart(4, '0')}`} />
            <DataRow label="Estado actual" value="CANCELADA" />
            <DataRow label="Fecha y hora de cancelación" value={fechaCancelacion} />
            <DataRow label="Motivo registrado" value={motivo} />
            <DataRow label="Monto reintegrado al cliente" value={formatCOP(devolucion)} />
            <DataRow label="Método de desembolso" value={metodo} />
            <DataRow label="Liberación de agenda (ms-disponibilidad)" value="✓ COMPLETADA (Horario libre)" />

            <Divider />

            <Row gap={16}>
              <Button
                label="Volver a Agenda y reservas"
                onPress={() => router.push(routes.reservas as any)}
              />
            </Row>
          </Card>
        }
        aside={
          <Card title="Trazabilidad" badge={<Chip label="CANCELADA" />}>
            <T size={14} weight="semibold">Disponibilidad en calendario:</T>
            <T size={13} color="#059669" weight="bold" style={{ marginTop: 4 }}>
              ● Franja horaria disponible nuevamente
            </T>
            <Divider />
            <T size={12} color="#6B7280" lh={1.4}>
              El bloqueo generado durante la confirmación inicial ha sido removido del calendario de bloqueos[cite: 24, 30].
            </T>
          </Card>
        }
      />
    </>
  );
}