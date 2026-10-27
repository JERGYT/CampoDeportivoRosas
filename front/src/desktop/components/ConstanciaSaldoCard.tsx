/**
 * Comprobante que se entrega al confirmar: anticipo registrado (HU-08) o constancia de
 * saldo pendiente cuando se confirma sin anticipo (HU-09). Mismo estilo que el comprobante
 * de pago de Liquidación.
 */
import { View } from 'react-native';

import type { Anticipo, ConstanciaSaldo } from '@/shared/services';
import { colors } from '@/shared/theme/tokens';
import { formatCOP, formatFecha } from '@/shared/utils/format';

import { METODOS } from './AnticipoForm';
import { Card, Chip, DataRow, Divider, Small, T } from './ui';

export function ConstanciaSaldoCard({
  referencia,
  cliente,
  detalle,
  valorTotal,
  anticipo,
  constancia,
}: {
  referencia: string;
  cliente: string;
  detalle: string;
  valorTotal: number;
  anticipo: Anticipo | null;
  constancia: ConstanciaSaldo | null;
}) {
  const montoAnticipo = anticipo?.monto ?? 0;
  const saldo = Math.max(0, valorTotal - montoAnticipo);
  return (
    <Card
      title={anticipo ? 'Comprobante de anticipo' : 'Constancia de saldo'}
      badge={<Chip label={anticipo?.codigo ?? constancia?.codigo ?? '—'} />}>
      <Chip label={anticipo ? 'Anticipo recibido' : 'Saldo pendiente'} tone={anticipo ? 'success' : 'danger'} />
      <T size={20} weight="semibold" lh={1.45}>
        Campo Deportivo los Rosas
      </T>
      <View>
        <T color={colors.textMuted} lh={1.45}>{`Reserva ${referencia} · Confirmada`}</T>
        <T color={colors.textMuted} lh={1.45}>{`Cliente: ${cliente}`}</T>
        <T color={colors.textMuted} lh={1.45}>{detalle}</T>
      </View>
      <Divider />
      <DataRow label="Valor total" value={formatCOP(valorTotal)} />
      <DataRow label="Anticipo" value={formatCOP(-montoAnticipo)} />
      <Divider />
      <DataRow big label="Saldo pendiente · COP" value={formatCOP(saldo)} />
      <Small>{`${formatCOP(valorTotal)} − ${formatCOP(montoAnticipo)} = ${formatCOP(saldo)} COP`}</Small>
      <Divider />
      {anticipo ? (
        <View>
          <T size={13} lh={1.45}>{`${METODOS.find((m) => m.value === anticipo.metodo_pago)?.label ?? anticipo.metodo_pago}${anticipo.referencia ? ` · ${anticipo.referencia}` : ''}`}</T>
          <T size={13} lh={1.45}>{formatFecha(anticipo.fecha_pago)}</T>
          <T size={13} lh={1.45}>{`Responsable: ${anticipo.registrado_por}`}</T>
        </View>
      ) : constancia ? (
        <View>
          <T size={13} lh={1.45}>{`Pagar antes de: ${formatFecha(constancia.fecha_limite_pago)}`}</T>
          <T size={13} lh={1.45}>{`Emitida: ${formatFecha(constancia.fecha_emision)}`}</T>
          {constancia.observacion ? <T size={13} lh={1.45}>{constancia.observacion}</T> : null}
          <T size={13} lh={1.45}>{`Responsable: ${constancia.registrado_por}`}</T>
        </View>
      ) : null}
      <Small>El saldo se cobra en la liquidación final, junto con daños si los hay.</Small>
    </Card>
  );
}
