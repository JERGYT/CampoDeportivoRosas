import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, SelectField, T, Divider, Chip, Row, DataRow } from '../components/ui';
import { reservasService } from '../../shared/services/reservas';
import { formatCOP } from '../../shared/utils/format';
import { routes } from '../navigation';

export default function LiquidacionScreen() {
  const params = useLocalSearchParams();
  const [reservas, setReservas] = useState<any[]>([]);
  const [reservaId, setReservaId] = useState<number>(Number(params.id) || 0);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<any | null>(null);

  useEffect(() => {
    reservasService.listarReservas().then((res: any) => {
      if (res?.reservas && res.reservas.length > 0) {
        setReservas(res.reservas);
        if (!reservaId) setReservaId(res.reservas[0].id);
      }
    });
  }, []);

  const reserva = reservas.find((r) => r.id === reservaId) || reservas[0];

  const alquiler = 120000;
  const danos = parseFloat(reserva?.danos || 0);
  const anticipo = parseFloat(reserva?.anticipo || 0);
  const totalPagar = Math.max(0, (alquiler + danos) - anticipo);

  const onRegistrarPagoFinal = async () => {
    setCargando(true);
    try {
      const res = await reservasService.liquidar({
        reserva_id: reserva.id,
        metodo_pago: metodoPago,
      });
      setResultado(res);
    } catch (err: any) {
      alert(err.message || 'Error al liquidar');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <TitleBar
        title="Liquidación y pago final"
        subtitle="Calcula el total a pagar, descuenta el anticipo si aplica y registra el pago final."
      />

      <TwoColumns
        main={
          <Card title="Cálculo de liquidación de servicio">
            <SelectField
              label="Seleccionar reserva para liquidar"
              value={reservaId}
              onChange={(val) => {
                setReservaId(Number(val));
                setResultado(null);
              }}
              options={reservas.map((r) => ({
                label: `R-${String(r.id).padStart(4, '0')} · ${r.cliente?.nombre || 'Cliente'} (${r.fecha}) · Estado: ${r.estado}`,
                value: r.id,
              }))}
            />

            <Divider />

            <T weight="semibold" size={15} style={{ marginBottom: 8 }}>
              Desglose de liquidación:
            </T>

            <DataRow label="Tarifa de alquiler base" value={formatCOP(alquiler)} />
            <DataRow label="(+) Cobro por daños o implementos" value={formatCOP(danos)} />
            <DataRow label="Subtotal del servicio" value={formatCOP(alquiler + danos)} />
            <DataRow
              label="(-) Anticipo pagado previamente"
              value={anticipo > 0 ? formatCOP(-anticipo) : '$0 (Sin anticipo)'}
            />

            <Divider />

            <DataRow big label="Saldo pendiente total a pagar" value={formatCOP(totalPagar)} />

            <Divider />

            <SelectField
              label="Método de pago recibido"
              value={metodoPago}
              onChange={setMetodoPago}
              options={[
                { label: 'Efectivo', value: 'EFECTIVO' },
                { label: 'Transferencia Nequi / Bancolombia', value: 'TRANSFERENCIA' },
                { label: 'Tarjeta Débito / Crédito', value: 'TARJETA' },
              ]}
            />

            {resultado && (
              <View style={{ padding: 14, backgroundColor: '#ECFDF5', borderRadius: 8, borderWidth: 1, borderColor: '#10B981', marginVertical: 12 }}>
                <T weight="semibold" style={{ color: '#065F46', marginBottom: 4 }}>
                  ✓ {resultado.mensaje}
                </T>
                <T size={13} style={{ color: '#047857' }}>
                  Reserva completada con éxito. Saldo actual: $0 COP.
                </T>
              </View>
            )}

            <Divider />

            <Row gap={16}>
              <Button
                label={cargando ? 'Procesando...' : 'Registrar pago final y cerrar reserva'}
                variant={reserva?.estado === 'COMPLETADA' || cargando ? 'disabled' : 'primary'}
                loading={cargando}
                onPress={() => {
                  if (reserva?.estado !== 'COMPLETADA' && !cargando) {
                    onRegistrarPagoFinal();
                  }
                }}
              />
              <Button
                label="Ir a Agenda y reservas"
                variant="secondary"
                onPress={() => {
                  router.push(routes.reservas as any);
                }}
              />
            </Row>
          </Card>
        }
        aside={
          <Card title="Comprobante" badge={<Chip label={reserva?.estado || '---'} />}>
            <T size={16} weight="semibold">{reserva?.cliente?.nombre || 'Cliente'}</T>
            <T size={13} color="#6B7280">{reserva?.fecha}</T>
            <Divider />
            <T size={14} weight="bold">Resumen financiero:</T>
            <T size={13} color="#4B5563">Alquiler: {formatCOP(alquiler)}</T>
            <T size={13} color="#4B5563">Daños: {formatCOP(danos)}</T>
            <T size={13} color="#4B5563">Anticipo: -{formatCOP(anticipo)}</T>
            <Divider />
            <T size={16} weight="bold" color="#111827">Total final: {formatCOP(totalPagar)}</T>
          </Card>
        }
      />
    </>
  );
}