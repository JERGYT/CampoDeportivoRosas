/**
 * HU-06 · Fechas alternativas: cuando la franja pedida no está libre se listan las franjas
 * sugeridas (estado SUGERIDA) para que el cliente acepte una. Al aceptarla, la reserva toma
 * esa fecha y hora; las demás quedan RECHAZADA.
 */
import { Pressable, StyleSheet, View } from 'react-native';

import type { FechaAlternativa } from '@/shared/services';
import { colors, radius } from '@/shared/theme/tokens';
import { formatFecha, shortTime } from '@/shared/utils/format';

import { Button, Card, Chip, Notice, Row, Small, T } from './ui';

const ESTADO = { SUGERIDA: 'Sugerida', ACEPTADA: 'Aceptada', RECHAZADA: 'Rechazada' } as const;

export function FechasAlternativasPanel({
  pedida,
  alternativas,
  seleccion,
  onSeleccionar,
  onAceptar,
  onRechazar,
  cargando,
  resuelta,
}: {
  /** Franja que pidió el cliente y no estaba libre. */
  pedida: { fecha: string; hora_inicio: string; hora_fin: string };
  alternativas: FechaAlternativa[];
  seleccion: number | null;
  onSeleccionar: (id: number) => void;
  onAceptar: () => void;
  onRechazar: () => void;
  cargando?: 'aceptar' | 'rechazar' | null;
  /** true cuando ya se aceptó o se rechazaron todas: solo lectura. */
  resuelta?: boolean;
}) {
  return (
    <Card title="Fechas alternativas" badge={<Chip label={resuelta ? 'Resuelta' : 'Pendiente'} tone={resuelta ? 'success' : 'danger'} />}>
      <Notice tone="danger" title="La franja pedida no está disponible">
        {`${formatFecha(pedida.fecha)} · ${shortTime(pedida.hora_inicio)} – ${shortTime(pedida.hora_fin)}. La solicitud queda pendiente hasta que el cliente acepte una alternativa.`}
      </Notice>
      {alternativas.length === 0 ? (
        <Small>No hay franjas libres de la misma duración en los próximos 14 días para este perfil.</Small>
      ) : (
        <View style={{ gap: 10 }}>
          {alternativas.map((a) => {
            const activa = a.estado === 'SUGERIDA' ? seleccion === a.id : a.estado === 'ACEPTADA';
            return (
              <Pressable
                key={a.id}
                disabled={resuelta}
                onPress={() => onSeleccionar(a.id)}
                style={[styles.opcion, activa && styles.opcionActiva]}>
                <View style={[styles.radio, activa && styles.radioActivo]} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T weight="semibold" lh={1.45}>
                    {`Opción ${a.orden} · ${formatFecha(a.fecha)}`}
                  </T>
                  <T size={13} color={colors.textMuted} lh={1.45}>
                    {`${shortTime(a.hora_inicio)} – ${shortTime(a.hora_fin)} · misma duración`}
                  </T>
                </View>
                <Chip label={ESTADO[a.estado]} tone={a.estado === 'ACEPTADA' ? 'success' : a.estado === 'RECHAZADA' ? 'danger' : 'neutral'} />
              </Pressable>
            );
          })}
        </View>
      )}
      {resuelta ? null : (
        <Row gap={12}>
          <Button
            label="Aceptar y confirmar"
            variant={seleccion === null ? 'disabled' : 'primary'}
            loading={cargando === 'aceptar'}
            onPress={onAceptar}
          />
          <Button label="Rechazar todas" variant="secondary" loading={cargando === 'rechazar'} onPress={onRechazar} />
        </Row>
      )}
      <Small>Se sugieren franjas libres dentro del horario de atención, sin bloqueos y en días permitidos para el perfil del cliente.</Small>
    </Card>
  );
}

const styles = StyleSheet.create({
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  opcionActiva: { borderColor: colors.primary, backgroundColor: colors.surface },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border },
  radioActivo: { borderColor: colors.primary, borderWidth: 5 },
});
