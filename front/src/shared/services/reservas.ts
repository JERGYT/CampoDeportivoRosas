/**
 * Servicio del microservicio ms-reservas (rama back).
 * Endpoints: GET /view/clientes · POST /view/createcliente · GET /view/reservas · POST /view/validarrecurrencia · POST /view/confirmarreserva
 * Sprint 2 (propuestos, aún no existen en el back; mientras tanto mocks/sprint2.ts):
 *   POST /view/alternativas · POST /view/aceptaralternativa · POST /view/rechazaralternativas
 *   POST /view/anticipo · POST /view/confirmarsinanticipo · GET /view/pagos
 */

import { diaIso } from '../utils/format';
import { apiConfig } from './config';
import { estaDisponible } from './disponibilidad';
import { ApiError, request } from './http';
import { bloqueos, clientes, delay, nextId, nextReservaId } from './mocks/db';
import { sprint2Mock } from './mocks/sprint2';
import type {
  AceptarAlternativaRequest,
  AceptarAlternativaResponse,
  ConfirmarSinAnticipoRequest,
  ConfirmarSinAnticipoResponse,
  ListarPagosResponse,
  ProponerAlternativasRequest,
  ProponerAlternativasResponse,
  RechazarAlternativasRequest,
  RegistrarAnticipoRequest,
  RegistrarAnticipoResponse,
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
  // Sprint 2
  proponerAlternativas(body: ProponerAlternativasRequest): Promise<ProponerAlternativasResponse>;
  aceptarAlternativa(body: AceptarAlternativaRequest): Promise<AceptarAlternativaResponse>;
  rechazarAlternativas(body: RechazarAlternativasRequest): Promise<AceptarAlternativaResponse>;
  registrarAnticipo(body: RegistrarAnticipoRequest): Promise<RegistrarAnticipoResponse>;
  confirmarSinAnticipo(body: ConfirmarSinAnticipoRequest): Promise<ConfirmarSinAnticipoResponse>;
  listarPagos(): Promise<ListarPagosResponse>;
}

const base = () => apiConfig.reservasUrl;

/** Endpoints del Sprint 2: reales si EXPO_PUBLIC_SPRINT2_API=true, si no, mock tipado. */
const sprint2Api: Pick<
  ReservasService,
  'proponerAlternativas' | 'aceptarAlternativa' | 'rechazarAlternativas' | 'registrarAnticipo' | 'confirmarSinAnticipo' | 'listarPagos'
> = {
  proponerAlternativas: (body) => request(base(), '/view/alternativas', { method: 'POST', body }),
  aceptarAlternativa: (body) => request(base(), '/view/aceptaralternativa', { method: 'POST', body }),
  rechazarAlternativas: (body) => request(base(), '/view/rechazaralternativas', { method: 'POST', body }),
  registrarAnticipo: (body) => request(base(), '/view/anticipo', { method: 'POST', body }),
  confirmarSinAnticipo: (body) => request(base(), '/view/confirmarsinanticipo', { method: 'POST', body }),
  listarPagos: () => request(base(), '/view/pagos'),
};

const sprint2Local: typeof sprint2Api = {
  async proponerAlternativas({ alternativas, ...datos }) {
    await delay();
    return { status: 'success', ...sprint2Mock.crearSolicitud(datos, alternativas) };
  },
  async aceptarAlternativa({ solicitud_id, alternativa_id, reserva_id }) {
    await delay();
    const r = sprint2Mock.aceptarAlternativa(solicitud_id, alternativa_id, reserva_id);
    return { status: 'success', mensaje: 'Alternativa aceptada', ...r };
  },
  async rechazarAlternativas({ solicitud_id }) {
    await delay();
    const r = sprint2Mock.rechazarAlternativas(solicitud_id);
    return { status: 'success', mensaje: 'El cliente rechazó todas las alternativas', ...r };
  },
  async registrarAnticipo({ valor_total, ...datos }) {
    await delay();
    const r = sprint2Mock.registrarAnticipo(datos, valor_total);
    return { status: 'success', mensaje: 'Anticipo registrado', ...r };
  },
  async confirmarSinAnticipo({ valor_total, ...datos }) {
    await delay();
    const constancia = sprint2Mock.confirmarSinAnticipo(datos, valor_total);
    return { status: 'success', mensaje: 'Reserva confirmada sin anticipo', constancia };
  },
  async listarPagos() {
    return { status: 'success', pagos: sprint2Mock.listarPagos() };
  },
};

const sprint2 = () => (apiConfig.sprint2Api ? sprint2Api : sprint2Local);

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
  proponerAlternativas: (body) => sprint2().proponerAlternativas(body),
  aceptarAlternativa: (body) => sprint2().aceptarAlternativa(body),
  rechazarAlternativas: (body) => sprint2().rechazarAlternativas(body),
  registrarAnticipo: (body) => sprint2().registrarAnticipo(body),
  confirmarSinAnticipo: (body) => sprint2().confirmarSinAnticipo(body),
  listarPagos: () => sprint2().listarPagos(),
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
  ...sprint2Local,
};

export const reservasService: ReservasService = api;