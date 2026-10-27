/**
 * Servicio del microservicio ms-disponibilidad (rama back).
 * Endpoints: GET /view/espacios · GET /view/consultar · GET /view/cronograma · POST /view/bloquear
 * Sprint 2 (propuesto, aún no existe en el back): GET /view/alternativas
 */
import { apiConfig } from './config';
import { ApiError, request } from './http';
import { bloqueos, delay, espacios, horarioAtencion, nextId } from './mocks/db';
import { minutos } from './tarifas';
import type {
  AlternativasParams,
  AlternativasResponse,
  BloquearRequest,
  BloquearResponse,
  ConsultarDisponibilidadParams,
  ConsultarDisponibilidadResponse,
  CronogramaParams,
  CronogramaResponse,
  FranjaDisponible,
  ListarEspaciosResponse,
} from './types';
import { diaIso } from '../utils/format';
export interface Espacio {
  id: number;
  nombre: string;
  tipo?: string;
  capacidad?: number;
  estado?: string;
  [key: string]: any;
}

export interface DisponibilidadService {
  
  listarEspacios(): Promise<ListarEspaciosResponse>;
  consultar(params: ConsultarDisponibilidadParams): Promise<ConsultarDisponibilidadResponse>;
  cronograma(params: CronogramaParams): Promise<CronogramaResponse>;
  bloquear(body: BloquearRequest): Promise<BloquearResponse>;
  /** HU-06: franjas libres cercanas a la pedida, dentro del horario de atención y sin bloqueos. */
  sugerirAlternativas(params: AlternativasParams): Promise<AlternativasResponse>;
  obtenerEspacios(): Promise<Espacio[]>;
}

const base = () => apiConfig.disponibilidadUrl;

const api: DisponibilidadService = {
  obtenerEspacios: async () => {
  const res = await request<{ status: string; espacios: Espacio[] }>(base(), '/view/espacios');
  return res.espacios || [];
  },
  listarEspacios: () => request(base(), '/view/espacios'),
  consultar: (params) => request(base(), '/view/consultar', { query: { ...params } }),
  cronograma: (params) => request(base(), '/view/cronograma', { query: { ...params } }),
  bloquear: (body) => request(base(), '/view/bloquear', { method: 'POST', body }),
  sugerirAlternativas: (params) =>
    apiConfig.sprint2Api
      ? request(base(), '/view/alternativas', { query: { ...params } })
      : buscarFranjasLibres(params),
};

const DIAS_BUSQUEDA = 14;
const PASO_MIN = 60;
const hhmmss = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:00`;
const sumarDias = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * Mientras no exista GET /view/alternativas, las alternativas se calculan en el front con datos
 * reales: un solo GET /view/cronograma de los próximos 14 días y el horario de atención (06–22).
 * Se ofrecen franjas de la misma duración, empezando en horas en punto, ordenadas por cercanía
 * (mismo día primero, luego la hora más parecida) y solo en días permitidos para el perfil.
 */
async function buscarFranjasLibres(p: AlternativasParams): Promise<AlternativasResponse> {
  const inicioPedido = minutos(p.hora_inicio);
  const duracion = minutos(p.hora_fin) - inicioPedido;
  if (!p.espacio_id || !p.fecha || !(duracion > 0)) throw new ApiError(400, 'Faltan datos para sugerir alternativas');

  const hoy = new Date().toISOString().slice(0, 10);
  const desde = p.fecha < hoy ? hoy : p.fecha;
  const hasta = sumarDias(desde, DIAS_BUSQUEDA - 1);
  const { cronograma } = await api.cronograma({ espacio_id: p.espacio_id, desde, hasta });

  const apertura = minutos(horarioAtencion.hora_apertura);
  const cierre = minutos(horarioAtencion.hora_cierre);
  const candidatas: (FranjaDisponible & { puntaje: number })[] = [];

  for (let d = 0; d < DIAS_BUSQUEDA; d++) {
    const fecha = sumarDias(desde, d);
    if (p.tipo && !diaPermitidoPara(p.tipo, fecha)) continue;
    const ocupados = cronograma.filter((b) => b.fecha === fecha).map((b) => [minutos(b.hora_inicio), minutos(b.hora_fin)]);
    for (let ini = apertura; ini + duracion <= cierre; ini += PASO_MIN) {
      const fin = ini + duracion;
      if (fecha === p.fecha && ini === inicioPedido) continue;
      if (ocupados.some(([a, b]) => !(b <= ini || a >= fin))) continue;
      const diasDistancia = Math.abs((Date.parse(fecha) - Date.parse(p.fecha)) / 86400000);
      candidatas.push({
        espacio_id: p.espacio_id,
        fecha,
        hora_inicio: hhmmss(ini),
        hora_fin: hhmmss(fin),
        puntaje: diasDistancia * 100 + Math.abs(ini - inicioPedido) / 60,
      });
    }
  }

  const alternativas = candidatas
    .sort((a, b) => a.puntaje - b.puntaje)
    .slice(0, p.max ?? 4)
    .map(({ puntaje: _puntaje, ...f }) => f);
  return { status: 'success', alternativas };
}

/** Misma regla que Reserva::validarDiaPermitido (copiada aquí para no crear un import circular). */
function diaPermitidoPara(tipo: NonNullable<AlternativasParams['tipo']>, fecha: string): boolean {
  const dia = diaIso(fecha);
  if (tipo === 'ESCUELA_FORMACION') return dia >= 1 && dia <= 6;
  if (tipo === 'CAMPEONATO' || tipo === 'PARTICULAR') return dia === 6 || dia === 7;
  return true;
}

/** Misma regla que DisponibilidadRepository::consultarDisponibilidad (horario de atención + cruces). */
export function estaDisponible(espacioId: number, fecha: string, horaInicio: string, horaFin: string): boolean {
  if (horaInicio < horarioAtencion.hora_apertura || horaFin > horarioAtencion.hora_cierre) return false;
  return !bloqueos.some(
    (b) => b.espacio_id === espacioId && b.fecha === fecha && !(b.hora_fin <= horaInicio || b.hora_inicio >= horaFin),
  );
}

const mock: DisponibilidadService = {
  async obtenerEspacios() {
  return [
    { id: 1, nombre: 'Cancha Sintética Fútbol 8' },
    { id: 2, nombre: 'Pistas de Tejo Tradicional' },
    { id: 3, nombre: 'Salón de Eventos Principal' },
    { id: 4, nombre: 'Zona BBQ Los Rosas' },
  ] as any;
},
  async listarEspacios() {
    await delay();
    return { status: 'success', espacios: espacios.filter((e) => e.estado === 'ACTIVO') };
  },
  async consultar(p) {
    await delay();
    if (!p.espacio_id || !p.fecha || !p.hora_inicio || !p.hora_fin) throw new ApiError(400, 'Faltan parámetros de consulta');
    return { ...p, disponible: estaDisponible(p.espacio_id, p.fecha, p.hora_inicio, p.hora_fin) };
  },
  async cronograma(p) {
    await delay();
    if (!p.espacio_id || !p.desde || !p.hasta) throw new ApiError(400, 'Parámetros requeridos');
    const cronograma = bloqueos
      .filter((b) => b.espacio_id === p.espacio_id && b.fecha >= p.desde && b.fecha <= p.hasta)
      .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio));
    return { espacio_id: p.espacio_id, cronograma };
  },
  async bloquear(b) {
    await delay();
    if (!b.espacio_id || !b.reserva_id || !b.fecha || !b.hora_inicio || !b.hora_fin) {
      throw new ApiError(400, 'Datos incompletos para bloquear');
    }
    if (!estaDisponible(b.espacio_id, b.fecha, b.hora_inicio, b.hora_fin)) throw new ApiError(409, 'Horario no disponible');
    bloqueos.push({ ...b, id: nextId(bloqueos), tipo: b.tipo ?? 'RESERVA' });
    return { status: 'success' };
  },
  sugerirAlternativas: (params) => buscarFranjasLibres(params),
};

export const disponibilidadService: DisponibilidadService = api;
