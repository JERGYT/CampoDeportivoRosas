/**
 * Datos de ejemplo de los mockups para los procesos que la rama back todavía NO expone
 * (listado de reservas, entrega, recepción, daños, liquidación, cancelación, devolución
 * y reportes). Cuando existan esos endpoints, se reemplazan por llamadas en
 * src/shared/services siguiendo el mismo patrón de disponibilidad.ts / reservas.ts.
 */

export interface ReservaDemo {
  codigo: string;
  cliente: string;
  clienteCorto: string;
  espacio: string;
  perfil: string;
  fechaLarga: string;
  franja: string;
  contacto: string;
  telefono: string;
  correo: string;
  estado: string;
  alquiler: number;
  anticipo: number;
}

export const reservaR1048: ReservaDemo = {
  codigo: 'R-1048',
  cliente: 'Escuela de Fútbol Semillero',
  clienteCorto: 'Escuela Semillero',
  espacio: 'Fútbol',
  perfil: 'Escuela de Formación',
  fechaLarga: 'Sábado 17 oct 2026',
  franja: '16:00 – 18:00',
  contacto: 'Laura Gómez',
  telefono: '300 555 0182',
  correo: 'laura@semillero.example',
  estado: 'Confirmada',
  alquiler: 120000,
  anticipo: 30000,
};

export const reservaR1052: ReservaDemo = {
  codigo: 'R-1052',
  cliente: 'Diego Herrera',
  clienteCorto: 'Diego Herrera',
  espacio: 'Zona BBQ',
  perfil: 'Particular',
  fechaLarga: 'Domingo 18 oct 2026',
  franja: '12:00 – 16:00',
  contacto: '310 555 0146',
  telefono: '310 555 0146',
  correo: 'diego@correo.example',
  estado: 'Confirmada',
  alquiler: 180000,
  anticipo: 60000,
};

/** Filas del listado "Reservas y consultas" (Gestión de reservas). */
export interface FilaReserva {
  ref: string;
  cliente: string;
  espacio: string;
  espacioId: number;
  fecha: string; // YYYY-MM-DD
  linea1: string;
  linea2: string;
  estado: string;
  estadoDetalle?: string;
  saldo: string;
  detalle: {
    nombre: string;
    perfil: string;
    fecha: string;
    contacto: string;
    telefono: string;
    correo: string;
    alquiler: number;
    anticipo: number;
  };
}

export const listadoReservas: FilaReserva[] = [
  {
    ref: 'R-1048', cliente: 'Escuela Semillero', espacio: 'Fútbol', espacioId: 1, fecha: '2026-10-17',
    linea1: 'Fútbol · Sáb 17', linea2: '16:00 – 18:00', estado: 'Confirmada', estadoDetalle: 'Seleccionada', saldo: '$90.000',
    detalle: { nombre: 'Escuela de Fútbol Semillero', perfil: 'Fútbol · Escuela de Formación', fecha: 'Sáb 17 oct 2026 · 16:00 – 18:00', contacto: 'Laura Gómez', telefono: '300 555 0182', correo: 'laura@semillero.example', alquiler: 120000, anticipo: 30000 },
  },
  {
    ref: 'R-1046', cliente: 'Club Horizonte', espacio: 'Tejo', espacioId: 2, fecha: '2026-10-17',
    linea1: 'Tejo · Sáb 17', linea2: '10:00 – 12:00', estado: 'Completada', saldo: '$0',
    detalle: { nombre: 'Club Horizonte', perfil: 'Tejo · Particular', fecha: 'Sáb 17 oct 2026 · 10:00 – 12:00', contacto: 'Julián Rojas', telefono: '311 555 0120', correo: 'club@horizonte.example', alquiler: 80000, anticipo: 80000 },
  },
  {
    ref: 'R-1052', cliente: 'Diego Herrera', espacio: 'Zona BBQ', espacioId: 4, fecha: '2026-10-18',
    linea1: 'Zona BBQ · Dom 18', linea2: '12:00 – 16:00', estado: 'Cancelada', estadoDetalle: 'Devolución pendiente', saldo: 'No aplica',
    detalle: { nombre: 'Diego Herrera', perfil: 'Zona BBQ · Particular', fecha: 'Dom 18 oct 2026 · 12:00 – 16:00', contacto: 'Diego Herrera', telefono: '310 555 0146', correo: 'diego@correo.example', alquiler: 180000, anticipo: 60000 },
  },
  {
    ref: 'R-1055', cliente: 'María Torres', espacio: 'Salón de Eventos', espacioId: 3, fecha: '2026-10-18',
    linea1: 'Salón de Eventos', linea2: 'Dom 18 · 15:00 – 19:00', estado: 'Confirmada', estadoDetalle: 'Sin anticipo', saldo: '$240.000',
    detalle: { nombre: 'María Torres', perfil: 'Salón de Eventos · Particular', fecha: 'Dom 18 oct 2026 · 15:00 – 19:00', contacto: 'María Torres', telefono: '320 555 0177', correo: 'maria@correo.example', alquiler: 240000, anticipo: 0 },
  },
  {
    ref: 'R-1049', cliente: 'Liga del Norte', espacio: 'Fútbol', espacioId: 1, fecha: '2026-10-17',
    linea1: 'Fútbol · Sáb 17', linea2: '12:00 – 14:00', estado: 'Recibida', estadoDetalle: 'Por liquidar', saldo: '$120.000',
    detalle: { nombre: 'Liga del Norte', perfil: 'Fútbol · Campeonato', fecha: 'Sáb 17 oct 2026 · 12:00 – 14:00', contacto: 'Andrés Castro', telefono: '315 555 0199', correo: 'liga@norte.example', alquiler: 120000, anticipo: 0 },
  },
  {
    ref: 'C-0081', cliente: 'Escuela Alborada', espacio: 'Fútbol', espacioId: 1, fecha: '2026-10-17',
    linea1: 'Fútbol · Sáb 17', linea2: '18:00 – 20:00', estado: 'Finalizado', estadoDetalle: 'sin reserva', saldo: 'Sin cobro',
    detalle: { nombre: 'Escuela Alborada', perfil: 'Fútbol · Escuela de Formación', fecha: 'Sáb 17 oct 2026 · 18:00 – 20:00', contacto: 'Paola Díaz', telefono: '301 555 0111', correo: 'alborada@escuela.example', alquiler: 0, anticipo: 0 },
  },
];

export const historialR1048 = [
  { title: 'Confirmada · 15 oct, 09:20', detail: 'Ana Martínez · Se bloqueó la franja acordada.' },
  { title: 'Anticipo registrado · 15 oct, 09:25', detail: 'Ana Martínez · $30.000 COP · Transferencia.' },
  { title: 'Consulta de detalle · 17 oct, 15:45', detail: 'Ana Martínez · Sin cambios en la reserva.' },
];
