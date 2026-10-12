import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { ApiError, disponibilidadService, type BloqueoHorario } from '@/shared/services';
import { colors } from '@/shared/theme/tokens';
import { formatFecha, shortTime } from '@/shared/utils/format';

import { Notice, Small, Timeline } from './ui';

/**
 * Lista los bloqueos de un espacio entre dos fechas (GET /view/cronograma, ms-disponibilidad).
 * `version` permite recargar desde fuera después de crear un bloqueo o una reserva.
 */
export function Cronograma({ espacioId, desde, hasta, version = 0 }: { espacioId: number; desde: string; hasta: string; version?: number }) {
  const clave = `${espacioId}|${desde}|${hasta}|${version}`;
  const [resultado, setResultado] = useState<{ clave: string; bloqueos?: BloqueoHorario[]; error?: string } | null>(null);

  useEffect(() => {
    let vivo = true;
    disponibilidadService
      .cronograma({ espacio_id: espacioId, desde, hasta })
      .then((r) => vivo && setResultado({ clave, bloqueos: r.cronograma }))
      .catch((e) => vivo && setResultado({ clave, error: e instanceof ApiError ? e.message : 'No se pudo consultar el cronograma' }));
    return () => {
      vivo = false;
    };
  }, [clave, espacioId, desde, hasta]);

  // Mientras llega la respuesta de la consulta actual se muestra el indicador de carga.
  const vigente = resultado?.clave === clave ? resultado : null;
  const bloqueos = vigente?.bloqueos ?? null;
  const error = vigente?.error ?? null;

  if (error) return <Notice tone="danger" title="Cronograma no disponible">{error}</Notice>;
  if (!bloqueos) return <ActivityIndicator color={colors.primary} />;
  if (bloqueos.length === 0) return <Small>Sin bloqueos en el periodo: todas las franjas de 06:00 a 22:00 están libres.</Small>;

  return (
    <View>
      <Timeline
        events={bloqueos.map((b) => ({
          title: `${formatFecha(b.fecha)} · ${shortTime(b.hora_inicio)} – ${shortTime(b.hora_fin)}`,
          detail: `${b.tipo} · Reserva #${b.reserva_id}`,
        }))}
      />
    </View>
  );
}
