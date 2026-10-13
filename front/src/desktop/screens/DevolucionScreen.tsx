import { router } from 'expo-router';
import { useState } from 'react';

import { ReservaResumenCard, TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, Chip, DataRow, Divider, Field, Notice, Row, Small, Timeline } from '../components/ui';
import { reservaR1052 } from '../data/demo';
import { routes } from '../navigation';

export default function DevolucionScreen() {
  const [autorizado, setAutorizado] = useState('$60.000');
  const [justificacion, setJustificacion] = useState(
    'Ana Martínez autoriza devolver el anticipo registrado tras revisar la solicitud de Diego Herrera. Importe decidido para este caso, sin regla porcentual.',
  );
  const [autorizadoPor, setAutorizadoPor] = useState('Ana Martínez · Administradora');
  const [momento, setMomento] = useState('16/10/2026 · 10:35');
  const [beneficiario, setBeneficiario] = useState('Diego Herrera');
  const [metodo, setMetodo] = useState('Transferencia');
  const [destino, setDestino] = useState('Cuenta del titular · terminación 0146');
  const [referencia, setReferencia] = useState('');
  const [fechaEfectiva, setFechaEfectiva] = useState('');
  const [comprobante, setComprobante] = useState('');

  // Solo se habilita con los datos de la operación efectivamente realizada.
  const listo = referencia.trim() !== '' && fechaEfectiva.trim() !== '' && comprobante.trim() !== '';

  return (
    <>
      <TitleBar title="Devolución del anticipo" subtitle="Autoriza el importe manualmente y registra la devolución solo cuando haya sido realizada." />
      <Notice title="Cancelación confirmada · devolución pendiente">
        R-1052 se canceló el viernes 16 oct 2026 a las 10:30. La franja ya está libre; el anticipo aún no se ha devuelto.
      </Notice>
      <TwoColumns
        main={
          <>
            <Card title="Autorización de devolución" badge={<Chip label="Autorizada" />}>
              <Row gap={16}>
                <Field label="Anticipo registrado · COP" value="$60.000" helper="Registro original A-0035 · 14 oct 2026" style={{ flex: 1 }} />
                <Field
                  label="Importe autorizado · COP"
                  value={autorizado}
                  onChangeText={setAutorizado}
                  helper="Definido manualmente; no supera el anticipo."
                  style={{ flex: 1 }}
                />
              </Row>
              <Field label="Justificación del importe" value={justificacion} onChangeText={setJustificacion} multiline />
              <Row gap={16}>
                <Field label="Autorizado por" value={autorizadoPor} onChangeText={setAutorizadoPor} style={{ flex: 1 }} />
                <Field label="Momento de autorización" value={momento} onChangeText={setMomento} style={{ flex: 1 }} />
              </Row>
              <Notice title="Sin política de porcentaje ni plazo">
                El importe autorizado es específico de este caso. No se presume un porcentaje de devolución ni una fecha límite.
              </Notice>
            </Card>
            <Card title="Preparación del registro" badge={<Chip label="Pendiente" />}>
              <Row gap={16}>
                <Field label="Beneficiario" value={beneficiario} onChangeText={setBeneficiario} style={{ flex: 1 }} />
                <Field label="Método previsto" value={metodo} onChangeText={setMetodo} style={{ flex: 1 }} />
              </Row>
              <Field label="Destino previsto" value={destino} onChangeText={setDestino} />
              <Row gap={16}>
                <Field label="Referencia de la devolución" value={referencia} onChangeText={setReferencia} placeholder="Pendiente de realizar" style={{ flex: 1 }} />
                <Field label="Fecha efectiva de devolución" value={fechaEfectiva} onChangeText={setFechaEfectiva} placeholder="Sin registrar" style={{ flex: 1 }} />
              </Row>
              <Field
                label="Comprobante de devolución"
                value={comprobante}
                onChangeText={setComprobante}
                placeholder="Sin comprobante · la devolución no ha ocurrido"
              />
              <Button
                label="Registrar devolución realizada"
                variant={listo ? 'primary' : 'disabled'}
                onPress={() => router.push(routes.cancelacionCompletada)}
              />
              <Small>Se habilita con los datos de la operación efectivamente realizada. Preparar o autorizar no equivale a devolver.</Small>
            </Card>
          </>
        }
        aside={
          <>
            <ReservaResumenCard reserva={reservaR1052} estado="Cancelada" />
            <Card title="Estado del anticipo" badge={<Chip label="D-0009" />}>
              <Chip label="Pendiente de devolución" tone="danger" />
              <DataRow label="Anticipo recibido" value="$60.000" />
              <DataRow label="Devolución autorizada" value={autorizado} />
              <DataRow label="Devuelto hasta ahora" value="$0" />
              <Divider />
              <DataRow big label="Pendiente · COP" value={autorizado} />
              <Small>El importe a devolver no puede superar el anticipo registrado. Si no hubo anticipo, no hay importe que devolver.</Small>
              <Button label="Ver auditoría de cancelación" variant="secondary" onPress={() => router.navigate(routes.cancelacionCompletada)} />
            </Card>
            <Card title="Estados del proceso">
              <Timeline
                events={[
                  { title: 'Pendiente · Estado actual', detail: 'Importe autorizado. Sin pago ni comprobante registrado.' },
                  {
                    title: 'Registrado · Después de devolver',
                    detail: 'Incluye importe realizado, método, referencia, fecha y responsable. No es el estado actual.',
                  },
                ]}
              />
            </Card>
          </>
        }
      />
    </>
  );
}
