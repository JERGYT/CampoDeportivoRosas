/**
 * Servicio del microservicio ms-reservas (rama back).
 * Endpoints: GET /view/clientes · POST /view/createcliente · GET /view/reservas · POST /view/validarrecurrencia · POST /view/confirmarreserva
 */

import { diaIso } from '../utils/format';
import { apiConfig } from './config';
import { estaDisponible } from './disponibilidad';
import { ApiError, request } from './http';
import { bloqueos, clientes, delay, nextId, nextReservaId } from './mocks/db';
import type {
  ConfirmarReservaRequest,
  ConfirmarReservaResponse,
  CrearClienteRequest,
  CrearClienteResponse,
  ListarClientesResponse,
  TipoCliente,
  ValidarRecurrenciaRequest,
  ValidarRecurrenciaResponse,
} from './types';

export interface ReservaItem {
  id: number;
  espacio_id: number;
  cliente_id: number;
  tipo: TipoCliente;
  entidad_organizadora?: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  anticipo: number | string;
  estado: string;
  cliente?: {
    id: number;
    nombre: string;
    telefono: string;
    tipo: TipoCliente;
    correo?: string;
  };
}

export interface ListarReservasResponse {
  status: string;
  reservas: ReservaItem[];
}

export interface ReservasService {
  listarClientes(): Promise<ListarClientesResponse>;
  crearCliente(body: CrearClienteRequest): Promise<CrearClienteResponse>;
  listarReservas(filtros?: { espacio_id?: number; fecha?: string }): Promise<{ status: string; reservas: any[] }>;
  validarRecurrencia(body: ValidarRecurrenciaRequest): Promise<ValidarRecurrenciaResponse>;
  confirmarReserva(body: ConfirmarReservaRequest): Promise<ConfirmarReservaResponse>;
}

const base = () => apiConfig.reservasUrl;

const api: ReservasService = {
  listarClientes: () => request(base(), '/view/clientes'),
  crearCliente: (body) => request(base(), '/view/createcliente', { method: 'POST', body }),
  listarReservas: (filtros) => {
    const params = new URLSearchParams();
    if (filtros?.espacio_id) params.append('espacio_id', String(filtros.espacio_id));
    if (filtros?.fecha) params.append('fecha', filtros.fecha);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(base(), `/view/reservas${qs}`);
  },
  validarRecurrencia: (body) => request(base(), '/view/validarrecurrencia', { method: 'POST', body }),
  confirmarReserva: (body) => request(base(), '/view/confirmarreserva', { method: 'POST', body }),
};

/**
 * Misma regla que Reserva::validarDiaPermitido:
 * Escuela de formación lunes-sábado · Campeonato/Particular sábado-domingo · otros cualquier día.
 */
export function diaPermitido(tipo: TipoCliente, fecha: string): boolean {
  const dia = diaIso(fecha);
  if (tipo === 'ESCUELA_FORMACION') return dia >= 1 && dia <= 6;
  if (tipo === 'CAMPEONATO' || tipo === 'PARTICULAR') return dia === 6 || dia === 7;
  return true;
}

const mock: ReservasService = {
  async listarClientes() {
    await delay();
    return { status: 'success', clientes: [...clientes].sort((a, b) => b.id - a.id) };
  },
  async crearCliente(body) {
    await delay();
    if (!body.nombre || !body.telefono || !body.tipo) {
      throw new ApiError(400, 'Nombre, teléfono y tipo son obligatorios');
    }
    const id = nextId(clientes);
    clientes.push({ id, nombre: body.nombre, telefono: body.telefono, tipo: body.tipo, correo: body.correo ?? null });
    return { status: 'success', mensaje: 'Cliente registrado con éxito', cliente_id: id };
  },
  async listarReservas() {
    await delay();
    return {
      status: 'success',
      reservas: bloqueos.map((b) => ({
        id: b.reserva_id ?? b.id,
        espacio_id: b.espacio_id,
        cliente_id: 1,
        tipo: b.tipo as TipoCliente,
        entidad_organizadora: '',
        fecha: b.fecha,
        hora_inicio: b.hora_inicio,
        hora_fin: b.hora_fin,
        anticipo: 0,
        estado: 'CONFIRMADA',
        cliente: { id: 1, nombre: 'Cliente Registrado', telefono: '3001234567', tipo: b.tipo as TipoCliente },
      })),
    };
  },
  async validarRecurrencia(body) {
    await delay();
    let hay_cruces = false;
    const sesiones = body.sesiones.map((s) => {
      if (!diaPermitido(body.tipo, s.fecha)) {
        hay_cruces = true;
        return { ...s, estado: 'NO_PERMITIDO' as const, mensaje: `Día no habilitado para ${body.tipo}` };
      }
      if (!estaDisponible(body.espacio_id, s.fecha, s.hora_inicio, s.hora_fin)) {
        hay_cruces = true;
        return { ...s, estado: 'CRUCE_HORARIO' as const, mensaje: 'Horario ocupado' };
      }
      return { ...s, estado: 'DISPONIBLE' as const };
    });
    return { hay_cruces, sesiones };
  },
  async confirmarReserva(body) {
    await delay();
    if (!clientes.some((c) => c.id === body.cliente_id)) {
      throw new ApiError(400, 'El cliente especificado no existe');
    }
    if (!diaPermitido(body.tipo, body.fecha)) {
      throw new ApiError(400, 'Día no permitido para este tipo de reserva');
    }
    if (!estaDisponible(body.espacio_id, body.fecha, body.hora_inicio, body.hora_fin)) {
      throw new ApiError(409, 'El horario seleccionado no está disponible');
    }
    const reserva_id = nextReservaId();
    bloqueos.push({
      id: nextId(bloqueos),
      espacio_id: body.espacio_id,
      reserva_id,
      fecha: body.fecha,
      hora_inicio: body.hora_inicio,
      hora_fin: body.hora_fin,
      tipo: body.tipo,
    });
    return { status: 'success', mensaje: 'Reserva confirmada con éxito', reserva_id, bloqueo_sincronizado: true };
  },
};

export const reservasService: ReservasService = api;