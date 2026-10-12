/**
 * Tipos de las respuestas de la rama back. Los nombres de campos son EXACTAMENTE los
 * que devuelven los controladores PHP (snake_case), para que la unión sea directa.
 */

// ───────────── ms-disponibilidad ─────────────

export type TipoEspacio = 'FUTBOL' | 'TEJO' | 'SALON_COMUNAL' | 'BARBECUE';

/** Tabla espacios (db_disponibilidad). Los campos opcionales dependen del tipo. */
export interface Espacio {
  id: number;
  nombre: string;
  tipo: TipoEspacio;
  capacidad: number;
  estado: string;
  jugadores_por_equipo: number | null;
  dimensiones: string | null;
  numero_carriles: number | null;
  tiene_sonido: 0 | 1 | null;
  numero_asadores: number | null;
  tiene_mesas: 0 | 1 | null;
}

/** Tabla bloqueos_horario. tipo por defecto "RESERVA"; también "MANTENIMIENTO", etc. */
export interface BloqueoHorario {
  id: number;
  espacio_id: number;
  reserva_id: number;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM:SS
  hora_fin: string; // HH:MM:SS
  tipo: string;
  created_at?: string;
}

/** GET /view/espacios */
export interface ListarEspaciosResponse {
  status: 'success';
  espacios: Espacio[];
}

/** GET /view/consultar?espacio_id&fecha&hora_inicio&hora_fin */
export interface ConsultarDisponibilidadParams {
  espacio_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}
export interface ConsultarDisponibilidadResponse {
  espacio_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
}

/** GET /view/cronograma?espacio_id&desde&hasta */
export interface CronogramaParams {
  espacio_id: number;
  desde: string;
  hasta: string;
}
export interface CronogramaResponse {
  espacio_id: number;
  cronograma: BloqueoHorario[];
}

/** POST /view/bloquear */
export interface BloquearRequest {
  espacio_id: number;
  reserva_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tipo?: string; // RESERVA | MANTENIMIENTO …
}
export interface BloquearResponse {
  status: 'success' | 'error';
}

// ───────────── ms-reservas ─────────────

export type TipoCliente = 'ESCUELA_FORMACION' | 'CAMPEONATO' | 'PARTICULAR' | 'OCASIONAL';

/** Tabla clientes (db_reservas) */
export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  correo: string | null;
  tipo: TipoCliente;
}

/** GET /view/clientes */
export interface ListarClientesResponse {
  status: 'success';
  clientes: Cliente[];
}

/** POST /view/createcliente */
export interface CrearClienteRequest {
  nombre: string;
  telefono: string;
  tipo: TipoCliente;
  correo?: string | null;
}
export interface CrearClienteResponse {
  status: 'success';
  mensaje: string;
  cliente_id: number;
}

/** POST /view/validarrecurrencia */
export interface SesionRecurrente {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}
export interface ValidarRecurrenciaRequest {
  espacio_id: number;
  tipo: TipoCliente;
  sesiones: SesionRecurrente[];
}
export type EstadoSesion = 'DISPONIBLE' | 'CRUCE_HORARIO' | 'NO_PERMITIDO';
export interface SesionValidada extends SesionRecurrente {
  estado: EstadoSesion;
  mensaje?: string;
}
export interface ValidarRecurrenciaResponse {
  hay_cruces: boolean;
  sesiones: SesionValidada[];
}

/** POST /view/confirmarreserva (400 cliente inexistente / día no permitido, 409 cruce) */
export interface ConfirmarReservaRequest {
  espacio_id: number;
  cliente_id: number;
  tipo: TipoCliente;
  entidad_organizadora: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  anticipo: number;
}
export interface ConfirmarReservaResponse {
  status: 'success';
  mensaje: string;
  reserva_id: number;
  bloqueo_sincronizado: boolean;
}

/** Forma de todos los errores del back: { status: "error", mensaje } */
export interface ErrorResponse {
  status: 'error';
  mensaje: string;
}
