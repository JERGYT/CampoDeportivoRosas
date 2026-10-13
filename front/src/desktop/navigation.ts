/**
 * Mapa de navegación desktop: rutas, migas de pan y elementos del menú lateral
 * resaltados en cada pantalla (tal como aparecen en los mockups).
 */
import type { Href } from 'expo-router';

export type NavKey = 'agenda' | 'clientes' | 'espacios' | 'pagos' | 'reserva' | 'cancelaciones' | 'reportes';

export const routes = {
  login: '/login',
  reservas: '/reservas',
  nuevaReserva: '/reservas/nueva',
  agregarCliente: '/clientes/nuevo',
  espacios: '/espacios',
  entrega: '/entrega',
  recepcion: '/recepcion',
  danos: '/danos',
  liquidacion: '/liquidacion',
  cancelacion: '/cancelacion',
  cancelacionCompletada: '/cancelacion/completada',
  devolucion: '/devolucion',
  reportes: '/reportes',
} as const satisfies Record<string, Href>;

/** Destino de cada elemento del menú lateral. */
export const navTargets: Record<NavKey, Href> = {
  agenda: routes.reservas,
  clientes: routes.agregarCliente,
  espacios: routes.espacios,
  pagos: routes.liquidacion,
  reserva: routes.entrega,
  cancelaciones: routes.cancelacion,
  reportes: routes.reportes,
};

interface ScreenMeta {
  breadcrumb: string;
  active: NavKey[];
}

export const screenMeta: Record<string, ScreenMeta> = {
  [routes.reservas]: { breadcrumb: 'Administración / Reservas / Gestión de reservas', active: ['agenda', 'reserva'] },
  [routes.nuevaReserva]: { breadcrumb: 'Administración / Reservas / Nueva reserva', active: ['agenda'] },
  [routes.agregarCliente]: { breadcrumb: 'Administración / Clientes / Agregar cliente', active: ['clientes'] },
  [routes.espacios]: { breadcrumb: 'Administración / Espacios / Disponibilidad y bloqueos', active: ['espacios'] },
  [routes.entrega]: { breadcrumb: 'Administración / Reserva / Entrega del espacio e implementos', active: ['reserva'] },
  [routes.recepcion]: { breadcrumb: 'Reserva  /  Recepción  /  Recepción al terminar', active: ['reserva'] },
  [routes.danos]: { breadcrumb: 'Administración / Reserva / Registro y valoración de daños', active: ['reserva'] },
  [routes.liquidacion]: { breadcrumb: 'Administración  /  Pagos  /  Liquidación y pago final', active: ['pagos', 'reserva'] },
  [routes.cancelacion]: { breadcrumb: 'Administración  /  Cancelaciones  /  Cancelar una reserva confirmada', active: ['cancelaciones'] },
  [routes.cancelacionCompletada]: { breadcrumb: 'Administración  /  Cancelaciones  /  Cancelación completada y auditoría', active: ['reserva', 'cancelaciones'] },
  [routes.devolucion]: { breadcrumb: 'Administración  /  Pagos  /  Devolución del anticipo', active: ['pagos'] },
  [routes.reportes]: { breadcrumb: 'Administración  /  Reportes · Futuro  /  Reportes de reservas e ingresos', active: ['reportes'] },
};
