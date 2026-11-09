import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, Field, SelectField, T, Divider, Chip, Row, DataRow } from '../components/ui';
import { reservasService } from '../../shared/services/reservas';
import { formatCOP } from '../../shared/utils/format';
import { routes } from '../navigation';

export default function DevolucionScreen() {
  const params = useLocalSearchParams();
  const reservaId = Number(params.id) || 0;
  const motivoParam = typeof params.motivo === 'string' ? params.motivo : 'Cancelación de reserva';

  const [detalle, setDetalle] = useState<any | null>(null);
  const [montoDevolucion, setMontoDevolucion] = useState('0');
  const [metodoDevolucion, setMetodoDevolucion] = useState('TRANSFERENCIA');
  const [motivo, setMotivo] = useState(motivoParam);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (reservaId <= 0) return;
    let activo = true;

    reservasService.iniciarCancelacion({ reserva_id: reservaId }).then((res: any) => {
      if (activo && res?.reserva) {
        setDetalle(res.reserva);
        setMontoDevolucion(String(res.reserva.anticipo || 0));
      }
    });

    return () => {
      activo = false;
    };
  }, [reservaId]);

  const onConfirmarDevolucion = () => {
    if (cargando) return;
    setCargando(true);

    reservasService
      .confirmarCancelacion({
        reserva_id: reservaId,
        motivo,
        monto_devolucion: parseFloat(montoDevolucion) || 0,
        metodo_devolucion: metodoDevolucion,
      })
      .then((res: any) => {
        const fechaAuditoria = res.auditoria?.fecha_cancelacion || new Date().toISOString();
        router.push(
          `${routes.cancelacionCompletada}?id=${reservaId}&motivo=${encodeURIComponent(motivo)}&devolucion=${montoDevolucion}&metodo=${encodeURIComponent(metodoDevolucion)}&fecha_cancelacion=${encodeURIComponent(fechaAuditoria)}` as any
        );
      })
      .catch((err: any) => {
        alert(err.message || 'Error al procesar la devolución.');
      })
      .finally(() => {
        setCargando(false);
      });
  };

  const anticipoOriginal = Number(detalle?.anticipo || 0);
  const reintegro = parseFloat(montoDevolucion) || 0;
  const retencion = Math.max(0, anticipoOriginal - reintegro);

  return (
    <>
      <TitleBar
        title="Gestión de devolución de anticipo "
        subtitle="Calcula el reintegro económico del cliente, define retenciones y registra el método de reembolso."
      />

      <TwoColumns
        main={
          <Card title="Liquidación de devolución de anticipo">
            <T weight="semibold" size={15}>
              Datos del titular y pago previo:
            </T>
            <DataRow label="Código de reserva" value={detalle?.codigo || `R-${reservaId}`} />
            <DataRow label="Cliente titular" value={detalle?.cliente || 'Cliente'} />
            <DataRow label="Anticipo en custodia " value={formatCOP(anticipoOriginal)} />

            <Divider />

            <Field
              label="Monto a devolver al cliente · COP"
              value={montoDevolucion}
              onChangeText={setMontoDevolucion}
              placeholder="Ej: 50000"
            />
            <T size={12} color="#6B7280" style={{ marginTop: -8, marginBottom: 12 }}>
              Puedes ajustar el monto si aplica retención o penalidad según la política comercial.
            </T>

            <SelectField
              label="Método de desembolso de la devolución"
              value={metodoDevolucion}
              onChange={setMetodoDevolucion}
              options={[
                { label: 'Transferencia bancaria / Nequi / Daviplata', value: 'TRANSFERENCIA' },
                { label: 'Efectivo en caja', value: 'EFECTIVO' },
              ]}
            />

            <Field
              label="Motivo formal de la cancelación"
              value={motivo}
              onChangeText={setMotivo}
            />

            <Divider />

            <Row gap={16}>
              <Button
                label={cargando ? 'Procesando...' : 'Reintegrar anticipo y confirmar cancelación >'}
                loading={cargando}
                onPress={() => {
                  onConfirmarDevolucion();
                }}
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
          <Card title="Balance financiero de cancelación" badge={<Chip label="" />}>
            <DataRow label="Anticipo original" value={formatCOP(anticipoOriginal)} />
            <DataRow label="Monto a reintegrar" value={formatCOP(reintegro)} />
            <DataRow big label="Retención / Penalidad" value={formatCOP(retencion)} />
            <Divider />
            <T size={12} color="#6B7280">
              Al confirmar, el estado cambiará a <T weight="bold">CANCELADA</T> y la agenda quedará desocupada en tiempo real[cite: 31].
            </T>
          </Card>
        }
      />
    </>
  );
}