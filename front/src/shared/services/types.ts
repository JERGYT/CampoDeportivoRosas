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

// ───────────── Sprint 2 (HU-06, HU-08, HU-09) ─────────────
// Endpoints propuestos en la documentación del Sprint 2 que el back TODAVÍA no expone.
// Mientras EXPO_PUBLIC_SPRINT2_API no sea "true", el front los resuelve con mocks tipados
// (ver mocks/sprint2.ts) usando estas mismas formas de petición y respuesta.

/** Franja libre de un espacio (FranjaDisponible del diagrama de clases). */
export interface FranjaDisponible {
  espacio_id: number;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM:SS
  hora_fin: string; // HH:MM:SS
}

/** GET /view/alternativas (ms-disponibilidad) · HU-06 */
export interface AlternativasParams extends FranjaDisponible {
  /** Máximo de opciones a sugerir (por defecto 4). */
  max?: number;
  /** Si se envía, solo se sugieren días permitidos para ese perfil. */
  tipo?: TipoCliente;
}
export interface AlternativasResponse {
  status: 'success';
  alternativas: FranjaDisponible[];
}

export type EstadoAlternativa = 'SUGERIDA' | 'ACEPTADA' | 'RECHAZADA';

/** Tabla fechas_alternativas (db_reservas). */
export interface FechaAlternativa extends FranjaDisponible {
  id: number;
  solicitud_id: number;
  orden: number;
  estado: EstadoAlternativa;
}

export type EstadoSolicitud = 'PENDIENTE' | 'CONFIRMADA' | 'FINALIZADA_SIN_RESERVA';

/** Reserva en estado PENDIENTE: la franja pedida no estaba libre y se ofrecieron alternativas. */
export interface SolicitudReserva {
  id: number;
  espacio_id: number;
  cliente_id: number;
  tipo: TipoCliente;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoSolicitud;
  /** Id de la reserva confirmada cuando se acepta una alternativa. */
  reserva_id: number | null;
  created_at: string;
}

/** POST /view/alternativas (ms-reservas) · guarda la solicitud PENDIENTE y sus alternativas SUGERIDA */
export interface ProponerAlternativasRequest {
  espacio_id: number;
  cliente_id: number;
  tipo: TipoCliente;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  alternativas: FranjaDisponible[];
}
export interface ProponerAlternativasResponse {
  status: 'success';
  solicitud: SolicitudReserva;
  alternativas: FechaAlternativa[];
}

/** POST /view/aceptaralternativa (ms-reservas) · la elegida pasa a ACEPTADA y las demás a RECHAZADA */
export interface AceptarAlternativaRequest {
  solicitud_id: number;
  alternativa_id: number;
  reserva_id: number;
}
export interface AceptarAlternativaResponse {
  status: 'success';
  mensaje: string;
  solicitud: SolicitudReserva;
  alternativas: FechaAlternativa[];
}

/** POST /view/rechazaralternativas (ms-reservas) · el cliente no acepta ninguna (cierre sin reserva) */
export interface RechazarAlternativasRequest {
  solicitud_id: number;
}

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'NEQUI' | 'TARJETA';

/** Tabla anticipos (db_reservas), uno por reserva. Código tipo A-0035. */
export interface Anticipo {
  id: number;
  codigo: string;
  reserva_id: number;
  monto: number;
  metodo_pago: MetodoPago;
  referencia: string | null;
  fecha_pago: string; // YYYY-MM-DD
  registrado_por: string;
}

/** POST /view/anticipo (ms-reservas) · HU-08. Regla: 0 < monto ≤ valor_total. */
export interface RegistrarAnticipoRequest {
  reserva_id: number;
  valor_total: number;
  monto: number;
  metodo_pago: MetodoPago;
  referencia: string | null;
  fecha_pago: string;
  registrado_por: string;
}
export interface RegistrarAnticipoResponse {
  status: 'success';
  mensaje: string;
  anticipo: Anticipo;
  saldo_pendiente: number;
}

/** Tabla constancias_saldo (db_reservas). Código tipo S-0012. */
export interface ConstanciaSaldo {
  id: number;
  codigo: string;
  reserva_id: number;
  saldo_pendiente: number;
  fecha_limite_pago: string; // YYYY-MM-DD
  observacion: string | null;
  fecha_emision: string; // YYYY-MM-DD
  registrado_por: string;
}

/** POST /view/confirmarsinanticipo (ms-reservas) · HU-09 */
export interface ConfirmarSinAnticipoRequest {
  reserva_id: number;
  valor_total: number;
  fecha_limite_pago: string;
  observacion: string | null;
  registrado_por: string;
}
export interface ConfirmarSinAnticipoResponse {
  status: 'success';
  mensaje: string;
  constancia: ConstanciaSaldo;
}

/** Situación de pago de una reserva: valor total, anticipo o constancia y saldo pendiente. */
export interface PagoReserva {
  reserva_id: number;
  valor_total: number;
  anticipo: Anticipo | null;
  constancia: ConstanciaSaldo | null;
  saldo_pendiente: number;
  /** Alternativa aceptada que originó la reserva (HU-06), si la hubo. */
  alternativa: { solicitud: SolicitudReserva; aceptada: FechaAlternativa } | null;
}

/** GET /view/pagos (ms-reservas) */
export interface ListarPagosResponse {
  status: 'success';
  pagos: PagoReserva[];
}
