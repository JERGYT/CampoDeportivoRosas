import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';

import { ProcesoReserva, TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, Chip, DataRow, Divider, Field, Notice, Row, Small, T, Table, Timeline } from '../components/ui';
import { routes } from '../navigation';

export default function LiquidacionScreen() {
  const [importe, setImporte] = useState('$115.000');
  const [metodo, setMetodo] = useState('Transferencia');
  const [referencia, setReferencia] = useState('TRX-DEMO-1725');
  const [fecha, setFecha] = useState('17/10/2026 · 18:25');
  const [registradoPor, setRegistradoPor] = useState('Ana Martínez · Administradora');
  const [observacion, setObservacion] = useState('Pago final recibido por el servicio y el daño revisado.');

  const descargar = () => {
    const msg = 'La descarga del comprobante se conectará cuando el back exponga el endpoint de pagos.';
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Comprobante P-0068', msg);
  };

  return (
    <>
      <TitleBar title="Liquidación y pago final" subtitle="Alquiler, daños y anticipo en un mismo cierre. Pago final registrado." />
      <ProcesoReserva current={3} finished />
      <Notice tone="success" title="Liquidación completada · Reserva cerrada">
        R-1048 · Ana Martínez · Sábado 17 oct 2026, 18:25 · Etapa actual: Liquidar · Saldo $0 COP.
      </Notice>
      <TwoColumns
        main={
          <>
            <Card title="Liquidación de R-1048" badge={<Chip label="Tarifa · COP" />}>
              <T size={18} weight="semibold" lh={1.45}>
                Fútbol · Escuela de Fútbol Semillero
              </T>
              <T color={colors.textMuted} lh={1.45}>
                Sábado 17 oct 2026 · 16:00 – 18:00 · Laura Gómez
              </T>
              <Table
                columns={[{ title: 'Concepto' }, { title: 'Detalle' }, { title: 'Importe · COP' }]}
                rows={[
                  ['Alquiler del espacio', '1 sesión de 2 horas', '$120.000'],
                  ['Daño registrado D-0021', 'Reparación de 1 peto · Ana Martínez', '$25.000'],
                  ['Total del servicio y daños', '$120.000 + $25.000', '$145.000'],
                  ['Anticipo registrado', 'Transferencia · 15 oct 2026', '− $30.000'],
                  ['Saldo antes del pago final', '$145.000 − $30.000', '$115.000'],
                ]}
              />
              <Small>Importes ilustrativos · Moneda asumida COP · Sin multas por cancelación en esta liquidación.</Small>
              <Notice title="Anticipo opcional">
                Vacío o $0 es válido. Sin anticipo, el servicio queda pendiente completo; en este caso con daño, el total a pagar habría sido $145.000 COP.
              </Notice>
            </Card>
            <Card title="Registro del pago final" badge={<Chip label="Registrado" />}>
              <Row gap={16}>
                <Field label="Importe recibido · COP" value={importe} onChangeText={setImporte} style={{ flex: 1 }} />
                <Field label="Método de pago" value={metodo} onChangeText={setMetodo} style={{ flex: 1 }} />
              </Row>
              <Row gap={16}>
                <Field label="Referencia del pago" value={referencia} onChangeText={setReferencia} style={{ flex: 1 }} />
                <Field label="Fecha y hora" value={fecha} onChangeText={setFecha} style={{ flex: 1 }} />
              </Row>
              <Field label="Registrado por" value={registradoPor} onChangeText={setRegistradoPor} />
              <Field label="Observación" value={observacion} onChangeText={setObservacion} />
            </Card>
          </>
        }
        aside={
          <>
            <Card title="Comprobante de pago" badge={<Chip label="P-0068" />}>
              <Chip label="Pagado" tone="success" />
              <T size={20} weight="semibold" lh={1.45}>
                Campo Deportivo los Rosas
              </T>
              <View>
                <T color={colors.textMuted} lh={1.45}>
                  Comprobante ilustrativo · R-1048
                </T>
                <T color={colors.textMuted} lh={1.45}>
                  Cliente: Escuela Semillero
                </T>
              </View>
              <Divider />
              <DataRow label="Alquiler" value="$120.000" />
              <DataRow label="Daño D-0021" value="$25.000" />
              <DataRow label="Total liquidado" value="$145.000" />
              <DataRow label="Anticipo" value="− $30.000" />
              <DataRow label="Pago final recibido" value="− $115.000" />
              <Divider />
              <DataRow big label="Saldo actual · COP" value="$0" />
              <Small>$145.000 − $30.000 − $115.000 = $0 COP</Small>
              <Divider />
              <View>
                <T size={13} lh={1.45}>
                  Transferencia · TRX-DEMO-1725
                </T>
                <T size={13} lh={1.45}>
                  17 oct 2026 · 18:25
                </T>
                <T size={13} lh={1.45}>
                  Responsable: Ana Martínez
                </T>
              </View>
              <Button label="Descargar comprobante" onPress={descargar} />
              <Button label="Ver reserva completada" variant="secondary" onPress={() => router.navigate(routes.reservas)} />
            </Card>
            <Card title="Trazabilidad del cierre">
              <Timeline
                events={[
                  { title: 'Daño registrado · 18:20', detail: 'Ana Martínez · $25.000, valoración manual revisada.' },
                  { title: 'Pago final registrado · 18:25', detail: 'Ana Martínez · P-0068 · $115.000 COP.' },
                  { title: 'Reserva completada · 18:25', detail: 'Recepción y liquidación cerradas · Saldo $0.' },
                ]}
              />
            </Card>
          </>
        }
      />
    </>
  );
}
