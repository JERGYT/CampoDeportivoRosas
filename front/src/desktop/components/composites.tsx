/**
 * Bloques repetidos entre pantallas: columnas principal/lateral, resumen de la reserva
 * y pasos del proceso de una reserva (validar → entregar → recibir → liquidar).
 */
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { colors } from '@/shared/theme/tokens';
import { formatCOP } from '@/shared/utils/format';

import type { ReservaDemo } from '../data/demo';
import { useResponsive } from '../hooks/useResponsive';
import { routes } from '../navigation';
import { Card, Chip, DataRow, Divider, Row, Small, Stepper, T } from './ui';

/** Columna principal flexible + columna lateral (420 px a 1600, 340 px en pantallas medianas, debajo en pequeñas). */
export function TwoColumns({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  const { asideWidth } = useResponsive();
  if (asideWidth === null) {
    return (
      <View style={{ gap: 22 }}>
        {main}
        {aside}
      </View>
    );
  }
  return (
    <Row gap={16} wrap={false}>
      <View style={{ flex: 1, minWidth: 0, gap: 22 }}>{main}</View>
      <View style={{ width: asideWidth, gap: 22 }}>{aside}</View>
    </Row>
  );
}

/** Título + descripción + etiqueta opcional a la derecha. */
export function TitleBar({ title, subtitle, badge }: { title: string; subtitle: string; badge?: ReactNode }) {
  return (
    <Row gap={24} align="center">
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <T size={30} weight="semibold" lh={1.45}>
          {title}
        </T>
        <T color={colors.textMuted} lh={1.45}>
          {subtitle}
        </T>
      </View>
      {badge}
    </Row>
  );
}

/** Tarjeta "Reserva R-xxxx" de la columna lateral. */
export function ReservaResumenCard({ reserva, estado }: { reserva: ReservaDemo; estado: string }) {
  return (
    <Card title={`Reserva ${reserva.codigo}`} badge={<Chip label={estado} />}>
      <T size={18} weight="semibold" lh={1.45}>
        {`${reserva.espacio} · ${reserva.perfil}`}
      </T>
      <T color={colors.textMuted} lh={1.45}>
        {`${reserva.fechaLarga} · ${reserva.franja}`}
      </T>
      <Divider />
      <DataRow label="Cliente" value={reserva.clienteCorto} />
      <DataRow label="Contacto" value={reserva.contacto} />
      <Small>{reserva.contacto === reserva.telefono ? reserva.correo : `${reserva.telefono} · ${reserva.correo}`}</Small>
      <Divider />
      <Chip label="Tarifa · COP" />
      <DataRow label="Alquiler" value={formatCOP(reserva.alquiler)} />
      <DataRow label="Anticipo registrado" value={formatCOP(reserva.anticipo)} />
      <Small>Moneda asumida COP. Datos e importes ilustrativos; no son tarifas oficiales.</Small>
    </Card>
  );
}

const pasosReserva = [
  { label: 'Validar reserva', route: routes.entrega },
  { label: 'Registrar entrega', route: routes.entrega },
  { label: 'Recibir al finalizar', route: routes.recepcion },
  { label: 'Liquidar', route: routes.liquidacion },
];

/** Pasos del proceso de una reserva; `current` es el índice (0–3) del paso actual. */
export function ProcesoReserva({ current, finished }: { current: number; finished?: boolean }) {
  return (
    <Stepper
      current={current}
      steps={pasosReserva.map((p, i) => ({
        label: p.label,
        status: i < current || (finished && i === current) ? 'Completado' : i === current ? 'Paso actual' : 'Pendiente',
        onPress: () => router.navigate(p.route),
      }))}
    />
  );
}
