/**
 * Servicio del microservicio ms-disponibilidad (rama back).
 * Endpoints: GET /view/espacios · GET /view/consultar · GET /view/cronograma · POST /view/bloquear
 */
import { apiConfig } from './config';
import { ApiError, request } from './http';
import { bloqueos, delay, espacios, horarioAtencion, nextId } from './mocks/db';
import type {
  BloquearRequest,
  BloquearResponse,
  ConsultarDisponibilidadParams,
  ConsultarDisponibilidadResponse,
  CronogramaParams,
  CronogramaResponse,
  ListarEspaciosResponse,
} from './types';
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
};

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
};

export const disponibilidadService: DisponibilidadService = api;
