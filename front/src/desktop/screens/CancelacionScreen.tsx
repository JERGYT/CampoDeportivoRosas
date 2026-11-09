import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, Field, SelectField, T, Divider, Chip, Row, DataRow } from '../components/ui';
import { reservasService } from '../../shared/services/reservas';
import { formatCOP } from '../../shared/utils/format';
import { routes } from '../navigation';

export default function CancelacionScreen() {
  const params = useLocalSearchParams();
  const [reservas, setReservas] = useState<any[]>([]);
  const [reservaId, setReservaId] = useState<number>(Number(params.id) || 0);
  const [detalle, setDetalle] = useState<any | null>(null);
  const [motivo, setMotivo] = useState('Imprevisto personal del cliente');
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Carga inicial de reservas para el selector
  useEffect(() => {
    let activo = true;
    reservasService.listarReservas().then((res: any) => {
      if (activo && res?.reservas && res.reservas.length > 0) {
        setReservas(res.reservas);
        const buscado = Number(params.id) || res.reservas[0].id;
        setReservaId(buscado);
      }
    });
    return () => {
      activo = false;
    };
  }, [params.id]);

  useEffect(() => {
    if (reservaId <= 0) return;
    let activo = true;

    reservasService
      .iniciarCancelacion({ reserva_id: reservaId })
      .then((res: any) => {
        if (!activo) return;
        if (res?.status === 'success') {
          setDetalle(res.reserva);
          setMensajeError(null);
        } else {
          setDetalle(null);
          setMensajeError(res?.mensaje || 'No se puede cancelar esta reserva.');
        }
      })
      .catch((err: any) => {
        if (!activo) return;
        setDetalle(null);
        setMensajeError(err.message || 'Error al recolectar datos de la reserva.');
      });

    return () => {
      activo = false;
    };
  }, [reservaId]);

  const esCancelable = detalle && detalle.estado === 'CONFIRMADA';
  const tieneAnticipo = detalle && Number(detalle.anticipo) > 0;

  const onContinuarProceso = () => {
    if (!esCancelable || cargando) return;

    if (tieneAnticipo) {
      router.push(`${routes.devolucion}?id=${detalle.id}&motivo=${encodeURIComponent(motivo)}` as any);
    } else {
      setCargando(true);
      reservasService
        .confirmarCancelacion({
          reserva_id: detalle.id,
          motivo,
          monto_devolucion: 0,
          metodo_devolucion: 'NO_APLICA',
        })
        .then((res: any) => {
          const fechaAuditoria = res.auditoria?.fecha_cancelacion || new Date().toISOString();
          router.push(
            `${routes.cancelacionCompletada}?id=${detalle.id}&motivo=${encodeURIComponent(motivo)}&devolucion=0&metodo=NO_APLICA&fecha_cancelacion=${encodeURIComponent(fechaAuditoria)}` as any
          );
        })
        .catch((err: any) => {
          alert(err.message || 'Error al procesar la cancelación.');
        })
        .finally(() => {
          setCargando(false);
        });
    }
  };

  return (
    <>
      <TitleBar
        title="Cancelación de reserva "
        subtitle="Recolecta datos de la reserva, evalúa la política de anticipo y prepara la baja del servicio."
      />

      <TwoColumns
        main={
          <Card title="Recolección de datos y verificación de estado">
            <SelectField
              label="Seleccionar reserva a cancelar"
              value={reservaId}
              onChange={(val) => {
                setReservaId(Number(val));
                setMensajeError(null);
              }}
              options={reservas.map((r) => ({
                label: `R-${String(r.id).padStart(4, '0')} · ${r.cliente?.nombre || 'Cliente'} (${r.fecha} ${r.hora_inicio?.slice(0, 5)}) · Estado: ${r.estado}`,
                value: r.id,
              }))}
            />

            <Divider />

            {mensajeError ? (
              <View
                style={{
                  padding: 14,
                  backgroundColor: '#FEF2F2',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#EF4444',
                  marginVertical: 10,
                }}
              >
                <T weight="semibold" style={{ color: '#991B1B' }}>
                  ✕ Restricción de cancelación
                </T>
                <T size={13} style={{ color: '#B91C1C', marginTop: 4 }}>
                  {mensajeError}
                </T>
              </View>
            ) : detalle ? (
              <View style={{ gap: 8 }}>
                <View
                  style={{
                    padding: 12,
                    backgroundColor: esCancelable ? '#ECFDF5' : '#FEF3C7',
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: esCancelable ? '#10B981' : '#F59E0B',
                  }}
                >
                  <T weight="semibold" style={{ color: esCancelable ? '#065F46' : '#92400E' }}>
                    {esCancelable
                      ? '✓ Reserva apta para cancelación (Estado: CONFIRMADA)'
                      : `⚠ Estado actual: ${detalle.estado}. Solo reservas en CONFIRMADA pueden cancelarse.`}
                  </T>
                </View>

                <T weight="semibold" size={15} style={{ marginTop: 8 }}>
                  Detalles pactados:
                </T>
                <DataRow label="Cliente titular" value={`${detalle.cliente} (${detalle.tipo_cliente})`} />
                <DataRow label="Teléfono de contacto" value={detalle.telefono} />
                <DataRow label="Fecha y franja" value={`${detalle.fecha} · ${detalle.hora_inicio} a ${detalle.hora_fin}`} />
                <DataRow label="Alquiler total pactado" value={formatCOP(detalle.alquiler)} />
                <DataRow label="Anticipo registrado " value={formatCOP(detalle.anticipo)} />
                <DataRow big label="Saldo pendiente" value={formatCOP(detalle.saldo_pendiente)} />

                <Divider />

                <Field
                  label="Motivo de la cancelación "
                  value={motivo}
                  onChangeText={setMotivo}
                  placeholder="Ej: Lluvia severa, fuerza mayor o solicitud del cliente"
                />
              </View>
            ) : null}

            <Divider />

            <Row gap={16}>
              <Button
                label={
                  cargando
                    ? 'Procesando...'
                    : tieneAnticipo
                    ? 'Gestionar devolución de anticipo >'
                    : 'Confirmar cancelación y liberar agenda >'
                }
                variant={!esCancelable || cargando ? 'disabled' : 'primary'}
                loading={cargando}
                onPress={() => {
                  onContinuarProceso();
                }}
              />
              <Button
                label="Volver a Reservas"
                variant="secondary"
                onPress={() => {
                  router.push(routes.reservas as any);
                }}
              />
            </Row>
          </Card>
        }
        aside={
          <Card title="Impacto del proceso" badge={<Chip label={detalle?.estado || '---'} />}>
            <T size={15} weight="semibold">
              Efectos de la cancelación:
            </T>
            <T size={13} color="#4B5563" lh={1.45} style={{ marginTop: 4 }}>
              • El estado de la reserva cambiará a <T weight="bold">CANCELADA</T>[cite: 31].
            </T>
            <T size={13} color="#4B5563" lh={1.45}>
              • La franja horaria en la agenda quedará <T weight="bold">liberada</T> inmediatamente[cite: 31].
            </T>
            <T size={13} color="#4B5563" lh={1.45}>
              • {tieneAnticipo ? `Existe un anticipo de ${formatCOP(detalle.anticipo)} por reintegrar[cite: 31].` : 'Reserva sin anticipo: no requiere reintegro financiero[cite: 31].'}
            </T>
          </Card>
        }
      />
    </>
  );
}