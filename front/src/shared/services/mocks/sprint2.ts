/**
 * Mock tipado de los endpoints del Sprint 2 que el back todavía no expone:
 *   POST /view/alternativas · POST /view/aceptaralternativa · POST /view/rechazaralternativas
 *   POST /view/anticipo · POST /view/confirmarsinanticipo · GET /view/pagos
 * Aplica las mismas reglas de la documentación del Sprint 2 y guarda los datos en el
 * navegador (localStorage) para que sobrevivan a una recarga mientras se prueba con el back real.
 */
import { ApiError } from '../http';
import type {
  Anticipo,
  ConstanciaSaldo,
  FechaAlternativa,
  PagoReserva,
  SolicitudReserva,
} from '../types';

interface Sprint2Store {
  solicitudes: SolicitudReserva[];
  alternativas: FechaAlternativa[];
  anticipos: Anticipo[];
  constancias: ConstanciaSaldo[];
  /** valor_total por reserva_id (columna nueva de RESERVA en el Sprint 2). */
  valores: Record<number, number>;
}

const CLAVE = 'cdr.sprint2.v1';
const vacio = (): Sprint2Store => ({ solicitudes: [], alternativas: [], anticipos: [], constancias: [], valores: {} });

function cargar(): Sprint2Store {
  try {
    const raw = globalThis.localStorage?.getItem(CLAVE);
    if (raw) return { ...vacio(), ...(JSON.parse(raw) as Partial<Sprint2Store>) };
  } catch {
    // Sin almacenamiento disponible: se trabaja solo en memoria.
  }
  return vacio();
}

const store: Sprint2Store = cargar();

function guardar() {
  try {
    globalThis.localStorage?.setItem(CLAVE, JSON.stringify(store));
  } catch {
    // Ignorado: el mock sigue funcionando en memoria.
  }
}

const siguienteId = (rows: { id: number }[]) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
const codigo = (prefijo: string, id: number, base: number) => `${prefijo}-${String(base + id).padStart(4, '0')}`;
const hoy = () => new Date().toISOString().slice(0, 10);

export const sprint2Mock = {
  crearSolicitud(datos: Omit<SolicitudReserva, 'id' | 'estado' | 'reserva_id' | 'created_at'>, franjas: Omit<FechaAlternativa, 'id' | 'solicitud_id' | 'orden' | 'estado'>[]) {
    const solicitud: SolicitudReserva = { ...datos, id: siguienteId(store.solicitudes), estado: 'PENDIENTE', reserva_id: null, created_at: new Date().toISOString() };
    store.solicitudes.push(solicitud);
    let id = siguienteId(store.alternativas);
    const alternativas = franjas.map((f, i) => ({ ...f, id: id++, solicitud_id: solicitud.id, orden: i + 1, estado: 'SUGERIDA' as const }));
    store.alternativas.push(...alternativas);
    guardar();
    return { solicitud, alternativas };
  },

  aceptarAlternativa(solicitudId: number, alternativaId: number, reservaId: number) {
    const solicitud = store.solicitudes.find((s) => s.id === solicitudId);
    if (!solicitud) throw new ApiError(400, 'La solicitud no existe');
    if (solicitud.estado !== 'PENDIENTE') throw new ApiError(409, 'La solicitud ya fue resuelta');
    const alternativas = store.alternativas.filter((a) => a.solicitud_id === solicitudId);
    if (!alternativas.some((a) => a.id === alternativaId)) throw new ApiError(400, 'La alternativa no pertenece a la solicitud');
    alternativas.forEach((a) => (a.estado = a.id === alternativaId ? 'ACEPTADA' : 'RECHAZADA'));
    solicitud.estado = 'CONFIRMADA';
    solicitud.reserva_id = reservaId;
    guardar();
    return { solicitud, alternativas };
  },

  rechazarAlternativas(solicitudId: number) {
    const solicitud = store.solicitudes.find((s) => s.id === solicitudId);
    if (!solicitud) throw new ApiError(400, 'La solicitud no existe');
    const alternativas = store.alternativas.filter((a) => a.solicitud_id === solicitudId);
    alternativas.forEach((a) => (a.estado = 'RECHAZADA'));
    solicitud.estado = 'FINALIZADA_SIN_RESERVA';
    guardar();
    return { solicitud, alternativas };
  },

  registrarAnticipo(datos: Omit<Anticipo, 'id' | 'codigo'>, valorTotal: number) {
    if (store.anticipos.some((a) => a.reserva_id === datos.reserva_id)) {
      throw new ApiError(409, 'La reserva ya tiene un anticipo registrado');
    }
    if (!(datos.monto > 0) || datos.monto > valorTotal) {
      throw new ApiError(400, 'El anticipo debe ser mayor que 0 y no puede superar el valor total');
    }
    const id = siguienteId(store.anticipos);
    const anticipo: Anticipo = { ...datos, id, codigo: codigo('A', id, 34) };
    store.anticipos.push(anticipo);
    store.valores[datos.reserva_id] = valorTotal;
    // Si antes se había confirmado sin anticipo, la constancia deja de aplicar.
    store.constancias = store.constancias.filter((c) => c.reserva_id !== datos.reserva_id);
    guardar();
    return { anticipo, saldo_pendiente: valorTotal - datos.monto };
  },

  confirmarSinAnticipo(datos: Omit<ConstanciaSaldo, 'id' | 'codigo' | 'saldo_pendiente' | 'fecha_emision'>, valorTotal: number) {
    if (store.anticipos.some((a) => a.reserva_id === datos.reserva_id)) {
      throw new ApiError(409, 'La reserva ya tiene anticipo: no aplica constancia de saldo');
    }
    if (!datos.fecha_limite_pago) throw new ApiError(400, 'La fecha límite de pago es obligatoria');
    const id = siguienteId(store.constancias);
    const constancia: ConstanciaSaldo = { ...datos, id, codigo: codigo('S', id, 11), saldo_pendiente: valorTotal, fecha_emision: hoy() };
    store.constancias = store.constancias.filter((c) => c.reserva_id !== datos.reserva_id);
    store.constancias.push(constancia);
    store.valores[datos.reserva_id] = valorTotal;
    guardar();
    return constancia;
  },

  listarPagos(): PagoReserva[] {
    const ids = new Set<number>([
      ...Object.keys(store.valores).map(Number),
      ...store.solicitudes.filter((s) => s.reserva_id).map((s) => s.reserva_id as number),
    ]);
    return [...ids].map((reservaId) => {
      const anticipo = store.anticipos.find((a) => a.reserva_id === reservaId) ?? null;
      const constancia = store.constancias.find((c) => c.reserva_id === reservaId) ?? null;
      const valor = store.valores[reservaId] ?? 0;
      const solicitud = store.solicitudes.find((s) => s.reserva_id === reservaId);
      const aceptada = solicitud ? store.alternativas.find((a) => a.solicitud_id === solicitud.id && a.estado === 'ACEPTADA') : undefined;
      return {
        reserva_id: reservaId,
        valor_total: valor,
        anticipo,
        constancia,
        saldo_pendiente: Math.max(0, valor - (anticipo?.monto ?? 0)),
        alternativa: solicitud && aceptada ? { solicitud, aceptada } : null,
      };
    });
  },
};
