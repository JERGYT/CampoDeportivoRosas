/**
 * Servicio del microservicio ms-disponibilidad (rama back).
 * Endpoints: GET /view/espacios · GET /view/consultar · GET /view/cronograma · POST /view/bloquear
 */
import { apiConfig } from './config';
import { request } from './http';
import { bloqueos, horarioAtencion } from './mocks/db';
import type { Espacio, ListarEspaciosResponse } from './types';

export type { Espacio };

export interface DisponibilidadService {
  listarEspacios(): Promise<ListarEspaciosResponse>;
  consultar(params: any): Promise<any>;
  cronograma(params: any): Promise<any>;
  bloquear(body: any): Promise<any>;
  obtenerEspacios(): Promise<Espacio[]>;

  listarHorarios(espacioId?: number): Promise<any>;
  crearHorario(body: { espacio_id: number; dia: string; hora_apertura: string; hora_cierre: string }): Promise<any>;
  actualizarHorario(body: { id: number; espacio_id: number; dia: string; hora_apertura: string; hora_cierre: string }): Promise<any>;
  eliminarHorario(body: { id: number }): Promise<any>;
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

  listarHorarios: (espacioId) =>
    request(base(), espacioId ? `/view/horarios?espacio_id=${espacioId}` : '/view/horarios'),
  crearHorario: (body) => request(base(), '/view/horarios', { method: 'POST', body }),
  actualizarHorario: (body) => request(base(), '/view/horarios/actualizar', { method: 'POST', body }),
  eliminarHorario: (body) => request(base(), '/view/horarios/eliminar', { method: 'POST', body }),
};

/** Misma regla que DisponibilidadRepository::consultarDisponibilidad (horario de atención + cruces). */
export function estaDisponible(espacioId: number, fecha: string, horaInicio: string, horaFin: string): boolean {
  if (horaInicio < horarioAtencion.hora_apertura || horaFin > horarioAtencion.hora_cierre) return false;
  return !bloqueos.some(
    (b) => b.espacio_id === espacioId && b.fecha === fecha && !(b.hora_fin <= horaInicio || b.hora_inicio >= horaFin),
  );
}

export const disponibilidadService: DisponibilidadService = api;