/**
 * Valor total de una reserva = valor_hora del espacio × horas reservadas.
 * El Sprint 2 agrega ESPACIO.valor_hora; mientras el back no lo devuelva se usa esta tabla
 * por tipo de espacio (coincide con los importes de los mockups: Fútbol 2 h = $120.000).
 */
import type { Espacio, TipoEspacio } from './types';

export const VALOR_HORA: Record<TipoEspacio, number> = {
  FUTBOL: 60000,
  TEJO: 40000,
  SALON_COMUNAL: 60000,
  BARBECUE: 45000,
};

/** Tipo por id para cuando aún no se ha cargado la lista de espacios (mismos ids del .sql). */
const TIPO_POR_ID: Record<number, TipoEspacio> = { 1: 'FUTBOL', 2: 'TEJO', 3: 'SALON_COMUNAL', 4: 'BARBECUE' };

export function minutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function valorHora(espacio: Pick<Espacio, 'id'> & Partial<Espacio> & { valor_hora?: number | string }): number {
  if (espacio.valor_hora !== undefined && espacio.valor_hora !== null && Number(espacio.valor_hora) > 0) return Number(espacio.valor_hora);
  const tipo = espacio.tipo ?? TIPO_POR_ID[espacio.id];
  return tipo ? VALOR_HORA[tipo] : 0;
}

export function calcularValorTotal(
  espacio: Pick<Espacio, 'id'> & Partial<Espacio> & { valor_hora?: number | string },
  horaInicio: string,
  horaFin: string,
): number {
  const horas = (minutos(horaFin) - minutos(horaInicio)) / 60;
  if (!(horas > 0)) return 0;
  return Math.round(valorHora(espacio) * horas);
}
