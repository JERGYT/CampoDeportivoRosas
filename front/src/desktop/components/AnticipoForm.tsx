/**
 * HU-08 / HU-09 · Pago al confirmar una reserva: con anticipo (monto, método, referencia y
 * fecha; 0 < monto ≤ valor total) o sin anticipo (fecha límite de pago y observación, que
 * generan una constancia de saldo pendiente).
 */
import type { MetodoPago } from '@/shared/services';
import { formatCOP } from '@/shared/utils/format';

import { DateField } from './DatePicker';
import { Chip, DataRow, Divider, Field, Notice, Row, SelectField, Small } from './ui';

export type ModoPago = 'anticipo' | 'sin_anticipo';

export interface PagoForm {
  modo: ModoPago;
  monto: string;
  metodo: MetodoPago;
  referencia: string;
  fechaPago: string;
  fechaLimite: string;
  observacion: string;
}

export const METODOS: { label: string; value: MetodoPago }[] = [
  { label: 'Transferencia', value: 'TRANSFERENCIA' },
  { label: 'Efectivo', value: 'EFECTIVO' },
  { label: 'Nequi', value: 'NEQUI' },
  { label: 'Tarjeta', value: 'TARJETA' },
];

export const montoNumero = (v: string) => Number(v.replace(/[^\d]/g, '')) || 0;

/** Mensaje de error del formulario o null si se puede confirmar. */
export function validarPago(p: PagoForm, valorTotal: number): string | null {
  if (p.modo === 'anticipo') {
    const monto = montoNumero(p.monto);
    if (!(monto > 0)) return 'Escribe el monto del anticipo (mayor que $0).';
    if (valorTotal > 0 && monto > valorTotal) return `El anticipo no puede superar el valor total (${formatCOP(valorTotal)}).`;
    if (!p.fechaPago) return 'Elige la fecha en que se recibió el anticipo.';
    return null;
  }
  if (!p.fechaLimite) return 'Elige la fecha límite para pagar el saldo.';
  return null;
}

export function AnticipoForm({ value, onChange, valorTotal, soloAnticipo }: { value: PagoForm; onChange: (v: PagoForm) => void; valorTotal: number; soloAnticipo?: boolean }) {
  const set = (cambios: Partial<PagoForm>) => onChange({ ...value, ...cambios });
  const anticipo = value.modo === 'anticipo' ? montoNumero(value.monto) : 0;
  const error = valorTotal > 0 && (value.monto || value.modo === 'sin_anticipo') ? validarPago(value, valorTotal) : null;

  return (
    <>
      {soloAnticipo ? null : (
        <Row gap={10}>
          <Chip label="Con anticipo" dot={value.modo === 'anticipo' ? 'filled' : 'outline'} tone={value.modo === 'anticipo' ? 'success' : 'neutral'} onPress={() => set({ modo: 'anticipo' })} />
          <Chip label="Sin anticipo" dot={value.modo === 'sin_anticipo' ? 'filled' : 'outline'} tone={value.modo === 'sin_anticipo' ? 'success' : 'neutral'} onPress={() => set({ modo: 'sin_anticipo' })} />
        </Row>
      )}

      {value.modo === 'anticipo' ? (
        <>
          <Row gap={16} style={{ zIndex: 10 }}>
            <Field label="Monto del anticipo · COP" value={value.monto} onChangeText={(v) => set({ monto: v })} keyboardType="numeric" placeholder="$30.000" style={{ flex: 1 }} />
            <SelectField label="Método de pago" value={value.metodo} onChange={(v) => set({ metodo: v })} options={METODOS} style={{ flex: 1 }} />
          </Row>
          <Row gap={16}>
            <Field label="Referencia del pago · opcional" value={value.referencia} onChangeText={(v) => set({ referencia: v })} placeholder="TRX-…" style={{ flex: 1 }} />
            <DateField label="Fecha del anticipo" value={value.fechaPago} onChange={(v) => set({ fechaPago: v })} style={{ flex: 1 }} />
          </Row>
        </>
      ) : (
        <>
          <Row gap={16}>
            <DateField label="Fecha límite de pago del saldo" value={value.fechaLimite} onChange={(v) => set({ fechaLimite: v })} style={{ flex: 1 }} />
            <Field label="Observación · opcional" value={value.observacion} onChangeText={(v) => set({ observacion: v })} placeholder="Pagará el día del uso" style={{ flex: 1.4 }} />
          </Row>
          <Small>Sin anticipo la reserva queda confirmada y se emite una constancia con el saldo pendiente completo.</Small>
        </>
      )}

      <Divider />
      <DataRow label="Valor total del servicio" value={formatCOP(valorTotal)} />
      <DataRow label="Anticipo" value={formatCOP(-anticipo)} />
      <DataRow big label="Saldo pendiente · COP" value={formatCOP(Math.max(0, valorTotal - anticipo))} />
      {error ? <Notice tone="danger" title="Revisa el pago">{error}</Notice> : null}
    </>
  );
}
