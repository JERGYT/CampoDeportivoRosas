import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, Field, SelectField, T, Divider, Chip, Row, DataRow, Notice } from '../components/ui';
import { reservasService } from '../../shared/services/reservas';
import { formatCOP } from '../../shared/utils/format';
import { routes } from '../navigation';

export default function DevolucionScreen() {
  const params = useLocalSearchParams();
  const initialId = Number(params.id) || 0;
  const motivoParam = typeof params.motivo === 'string' && params.motivo.trim() ? params.motivo : 'Cancelación de reserva';

  const [reservas, setReservas] = useState<any[]>([]);
  const [reservaId, setReservaId] = useState<number>(initialId);
  const [detalle, setDetalle] = useState<any | null>(null);
  const [montoDevolucion, setMontoDevolucion] = useState('0');
  const [metodoDevolucion, setMetodoDevolucion] = useState('TRANSFERENCIA');
  const [motivo, setMotivo] = useState(motivoParam);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    reservasService
      .listarReservas()
      .then((res: any) => {
        if (activo && res?.reservas && res.reservas.length > 0) {
          setReservas(res.reservas);
          const buscado = Number(params.id) || res.reservas[0].id;
          setReservaId(buscado);
        }
      })
      .catch(() => {});
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
        if (res?.reserva) {
          setDetalle(res.reserva);
          setErrorMsg(null);
          const sugerido =
            res.reserva.monto_devolucion_sugerido !== undefined
              ? res.reserva.monto_devolucion_sugerido
              : res.reserva.anticipo || 0;
          setMontoDevolucion(String(sugerido));
          if (res.reserva.motivo_cancelacion && !params.motivo) {
            setMotivo(res.reserva.motivo_cancelacion);
          }
          if (res.reserva.metodo_devolucion && res.reserva.metodo_devolucion !== 'NO_APLICA') {
            setMetodoDevolucion(res.reserva.metodo_devolucion);
          }
        }
      })
      .catch((err: any) => {
        if (!activo) return;
        const local = reservas.find((r) => Number(r.id) === Number(reservaId));
        if (local) {
          const ant = parseFloat(local.anticipo) || 0;
          const dev = parseFloat(local.monto_devolucion) || ant;
          setDetalle({
            id: local.id,
            codigo: `R-${String(local.id).padStart(4, '0')}`,
            estado: local.estado || 'CONFIRMADA',
            cliente: local.cliente?.nombre || local.entidad_organizadora || `Cliente #${local.cliente_id}`,
            anticipo: ant,
          });
          setMontoDevolucion(String(dev));
          setErrorMsg(null);
        } else {
          setErrorMsg(err?.message || 'No se pudo cargar la información de la reserva.');
        }
      });

    return () => {
      activo = false;
    };
  }, [reservaId, reservas, params.motivo]);

  const anticipoOriginal = Number(detalle?.anticipo || 0);
  const reintegro = parseFloat(montoDevolucion) || 0;
  const retencion = Math.max(0, anticipoOriginal - reintegro);
  const estadoActual = String(detalle?.estado || 'CONFIRMADA').toUpperCase();
  const noPermitida = ['COMPLETADA', 'ENTREGADA', 'RECIBIDA'].includes(estadoActual);

  const onConfirmarDevolucion = () => {
    if (cargando || noPermitida || reservaId <= 0) return;

    if (reintegro < 0 || reintegro > anticipoOriginal) {
      setErrorMsg(`El monto a devolver debe estar entre $0 y el anticipo registrado (${formatCOP(anticipoOriginal)}).`);
      return;
    }

    setCargando(true);
    setErrorMsg(null);

    reservasService
      .confirmarCancelacion({
        reserva_id: reservaId,
        motivo: motivo.trim() || 'Cancelación de reserva',
        monto_devolucion: reintegro,
        metodo_devolucion: reintegro > 0 ? metodoDevolucion : 'NO_APLICA',
      })
      .then((res: any) => {
        const fechaAuditoria = res?.auditoria?.fecha_cancelacion || new Date().toISOString();
        router.push(
          `${routes.cancelacionCompletada}?id=${reservaId}&motivo=${encodeURIComponent(motivo)}&devolucion=${reintegro}&metodo=${encodeURIComponent(reintegro > 0 ? metodoDevolucion : 'NO_APLICA')}&fecha_cancelacion=${encodeURIComponent(fechaAuditoria)}` as any,
        );
      })
      .catch((err: any) => {
        setErrorMsg(err?.message || 'Error al procesar la devolución.');
      })
      .finally(() => {
        setCargando(false);
      });
  };

  return (
    <>
      <TitleBar
        title="Gestión de devolución de anticipo"
        subtitle="Calcula el reintegro económico del cliente, define retenciones y registra el método de reembolso."
      />

      <TwoColumns
        main={
          <Card title="Liquidación de devolución de anticipo" style={{ overflow: 'visible' }}>
            {reservas.length > 0 ? (
              <View style={{ zIndex: 40, elevation: 40 }}>
                <SelectField
                  label="Reserva seleccionada"
                  value={reservaId}
                  onChange={(val) => {
                    setReservaId(Number(val));
                    setErrorMsg(null);
                  }}
                  options={reservas.map((r) => ({
                    label: `R-${String(r.id).padStart(4, '0')} · ${r.cliente?.nombre || 'Cliente'} (${r.fecha}) · Estado: ${r.estado}`,
                    value: r.id,
                  }))}
                />
              </View>
            ) : null}

            <T weight="semibold" size={15}>
              Datos del titular y pago previo:
            </T>
            <DataRow label="Código de reserva" value={detalle?.codigo || `R-${String(reservaId).padStart(4, '0')}`} />
            <DataRow label="Cliente titular" value={detalle?.cliente || 'Cliente'} />
            <DataRow label="Estado de la reserva" value={estadoActual} />
            <DataRow label="Anticipo en custodia" value={formatCOP(anticipoOriginal)} />

            <Divider />

            <Field
              label="Monto a devolver al cliente · COP"
              value={montoDevolucion}
              onChangeText={setMontoDevolucion}
              keyboardType="numeric"
              placeholder="Ej: 50000"
            />
            <T size={12} color="#6B7280" style={{ marginTop: -8, marginBottom: 4 }}>
              Puedes ajustar el monto si aplica retención o penalidad según la política comercial (máximo {formatCOP(anticipoOriginal)}).
            </T>

            <View style={{ zIndex: 20, elevation: 20 }}>
              <SelectField
                label="Método de desembolso de la devolución"
                value={metodoDevolucion}
                onChange={setMetodoDevolucion}
                options={[
                  { label: 'Transferencia bancaria / Nequi / Daviplata', value: 'TRANSFERENCIA' },
                  { label: 'Efectivo en caja', value: 'EFECTIVO' },
                ]}
              />
            </View>

            <Field label="Motivo formal de la cancelación" value={motivo} onChangeText={setMotivo} />

            {noPermitida ? (
              <Notice tone="danger" title="Devolución no disponible para este estado">
                {`La reserva se encuentra en estado ${estadoActual}. Solo se procesan devoluciones de reservas CONFIRMADAS o CANCELADAS.`}
              </Notice>
            ) : null}

            {errorMsg ? (
              <Notice tone="danger" title="No se pudo procesar la devolución">
                {errorMsg}
              </Notice>
            ) : null}

            <Divider />

            <Row gap={16}>
              <Button
                label={cargando ? 'Procesando...' : 'Reintegrar anticipo y confirmar cancelación >'}
                variant={cargando || noPermitida ? 'disabled' : 'primary'}
                loading={cargando}
                onPress={onConfirmarDevolucion}
              />
              <Button
                label="Regresar"
                variant="secondary"
                onPress={() => {
                  router.push(routes.reservas as any);
                }}
              />
            </Row>
          </Card>
        }
        aside={
          <Card title="Balance financiero de cancelación" badge={<Chip label={estadoActual} />}>
            <DataRow label="Anticipo original" value={formatCOP(anticipoOriginal)} />
            <DataRow label="Monto a reintegrar" value={formatCOP(reintegro)} />
            <DataRow big label="Retención / Penalidad" value={formatCOP(retencion)} />
            <Divider />
            <T size={12} color="#6B7280" lh={1.45}>
              Al confirmar, el estado quedará registrado como <T weight="bold">CANCELADA</T> con su respectiva auditoría y la agenda del espacio quedará desocupada en tiempo real.
            </T>
          </Card>
        }
      />
    </>
  );
}