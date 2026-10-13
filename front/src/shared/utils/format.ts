/** Formatea un número como pesos colombianos sin decimales: 120000 → "$120.000". */
export function formatCOP(value: number): string {
  const sign = value < 0 ? '− ' : '';
  const abs = Math.round(Math.abs(value));
  return `${sign}$${abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/** "16:00:00" → "16:00" */
export function shortTime(hhmmss: string): string {
  return hhmmss.slice(0, 5);
}

/** "16:00" → "16:00:00" (formato TIME que espera el back) */
export function toBackTime(hhmm: string): string {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2026-10-17" → "Sáb 17 oct 2026" (sin depender de la zona horaria) */
export function formatFecha(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dia = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DIAS[dia]} ${d} ${MESES[m - 1]} ${y}`;
}

/** Día ISO 1=lunes … 7=domingo, igual que date('N') en PHP. */
export function diaIso(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const dia = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dia === 0 ? 7 : dia;
}
