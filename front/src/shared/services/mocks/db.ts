/**
 * Datos de prueba en memoria que replican las semillas SQL de la rama back
 * (back/sql/01_db_disponibilidad.sql y 02_db_reservas.sql). Se usan cuando
 * EXPO_PUBLIC_USE_MOCKS=true, mientras el back no esté corriendo.
 */
import type { BloqueoHorario, Cliente, Espacio } from '../types';

export const espacios: Espacio[] = [
  { id: 1, nombre: 'Cancha Sintética Fútbol 8', tipo: 'FUTBOL', capacidad: 16, estado: 'ACTIVO', jugadores_por_equipo: 8, dimensiones: '40x20m', numero_carriles: null, tiene_sonido: null, numero_asadores: null, tiene_mesas: null },
  { id: 2, nombre: 'Pistas de Tejo Tradicional', tipo: 'TEJO', capacidad: 20, estado: 'ACTIVO', jugadores_por_equipo: null, dimensiones: null, numero_carriles: 4, tiene_sonido: null, numero_asadores: null, tiene_mesas: null },
  { id: 3, nombre: 'Salón de Eventos Principal', tipo: 'SALON_COMUNAL', capacidad: 80, estado: 'ACTIVO', jugadores_por_equipo: null, dimensiones: null, numero_carriles: null, tiene_sonido: 1, numero_asadores: null, tiene_mesas: null },
  { id: 4, nombre: 'Zona BBQ Los Rosas', tipo: 'BARBECUE', capacidad: 30, estado: 'ACTIVO', jugadores_por_equipo: null, dimensiones: null, numero_carriles: null, tiene_sonido: null, numero_asadores: 2, tiene_mesas: 1 },
];

/** horarios_atencion: todos los espacios, lunes a domingo, 06:00–22:00 */
export const horarioAtencion = { hora_apertura: '06:00:00', hora_cierre: '22:00:00' };

export const bloqueos: BloqueoHorario[] = [
  { id: 1, espacio_id: 1, reserva_id: 1048, fecha: '2026-10-17', hora_inicio: '16:00:00', hora_fin: '18:00:00', tipo: 'ESCUELA_FORMACION' },
  { id: 2, espacio_id: 1, reserva_id: 1049, fecha: '2026-10-17', hora_inicio: '12:00:00', hora_fin: '14:00:00', tipo: 'CAMPEONATO' },
  { id: 3, espacio_id: 2, reserva_id: 1046, fecha: '2026-10-17', hora_inicio: '10:00:00', hora_fin: '12:00:00', tipo: 'PARTICULAR' },
  { id: 4, espacio_id: 3, reserva_id: 1055, fecha: '2026-10-18', hora_inicio: '15:00:00', hora_fin: '19:00:00', tipo: 'PARTICULAR' },
  { id: 5, espacio_id: 1, reserva_id: 1060, fecha: '2026-10-25', hora_inicio: '08:00:00', hora_fin: '12:00:00', tipo: 'CAMPEONATO' },
];

export const clientes: Cliente[] = [
  { id: 1, nombre: 'Escuela de Fútbol Semillero', telefono: '3005550182', correo: 'laura@semillero.example', tipo: 'ESCUELA_FORMACION' },
  { id: 2, nombre: 'Torneo Relámpago Boyacá', telefono: '3119876543', correo: 'torneo@deportes.example', tipo: 'CAMPEONATO' },
  { id: 3, nombre: 'Carlos Pérez', telefono: '3201234567', correo: 'carlos.perez@example.com', tipo: 'PARTICULAR' },
];

let reservaSeq = 2000;
export const nextReservaId = () => ++reservaSeq;
export const nextId = <T extends { id: number }>(rows: T[]) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;

/** Simula la latencia de red para que los estados de carga se vean igual que con el back. */
export const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
