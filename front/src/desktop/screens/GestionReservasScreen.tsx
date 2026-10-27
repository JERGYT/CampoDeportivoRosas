
import { router, type Href } from 'expo-router';
import { View } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { reservasService } from '../../shared/services/reservas';

import { disponibilidadService, type Espacio } from '@/shared/services';
import { colors } from '@/shared/theme/tokens';
import { formatCOP } from '@/shared/utils/format';

import { TitleBar, TwoColumns } from '../components/composites';
import { DateRangeField } from '../components/DatePicker';
import {
  Button,
  Card,
  Chip,
  DataRow,
  Divider,
  Field,
  Notice,
  Row,
  SelectField,
  Small,
  T,
  Table,
  Timeline,
} from '../components/ui';
import { historialR1048, listadoReservas, type FilaReserva } from '../data/demo';
import { routes } from '../navigation';

const ESTADOS = ['Confirmada', 'Completada', 'Cancelada', 'Recibida', 'Finalizado'];

/** Acciones del detalle según el estado de la reserva seleccionada. */
function accionesPara(fila: FilaReserva): { primaria: [string, Href]; secundaria?: [string, Href]; nota: string } {
  switch (fila.estado) {
    case 'Confirmada':
      return {
        primaria: ['Validar y entregar espacio', routes.entrega],
        secundaria: ['Iniciar cancelación', routes.cancelacion],
        nota: 'La reserva está confirmada: puede entregarse tras validar. La cancelación solo la gestiona el administrador.',
      };
    case 'Recibida':
      return { primaria: ['Liquidar reserva', routes.liquidacion], nota: 'El espacio ya fue recibido: falta la liquidación y el pago final.' };
    case 'Cancelada':
      return {
        primaria: ['Gestionar devolución', routes.devolucion],
        secundaria: ['Ver auditoría de cancelación', routes.cancelacionCompletada],
        nota: 'La reserva fue cancelada y el horario liberado. La devolución conserva su propio estado.',
      };
    case 'Completada':
      return { primaria: ['Ver liquidación', routes.liquidacion], nota: 'Reserva cerrada con saldo $0.' };
    default:
      return { primaria: ['Nueva reserva', routes.nuevaReserva], nota: 'Consulta sin reserva: no hay franja, cobro ni penalidad.' };
  }
}
const filaVacia: FilaReserva = {
  ref: '---',
  cliente: 'Sin reservas',
  espacio: '---',
  espacioId: 0,
  fecha: '---',
  estado: 'Confirmada',
  linea1: 'Sin registros',
  linea2: 'No hay reservas disponibles',
  estadoDetalle: '',
  saldo: '$0',
  detalle: {
    nombre: 'Sin reservas en BD',
    perfil: '---',
    fecha: '---',
    contacto: '---',
    telefono: '---',
    correo: '---',
    alquiler: 0,
    anticipo: 0,
  },
};

export default function GestionReservasScreen() {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [estado, setEstado] = useState('todos');
  const [espacio, setEspacio] = useState<number>(0);
  const [rango, setRango] = useState<{ desde: string; hasta: string }>({ desde: '', hasta: '' });
  const [texto, setTexto] = useState('');
  const [filtros, setFiltros] = useState({ estado: 'todos', espacio: 0, desde: '', hasta: '', texto: '' });
  const [seleccion, setSeleccion] = useState('R-1048');

  // Estado para las reservas que vienen de la base de datos MySQL
  // Estado para las reservas reales y estado de carga
  const [reservasBD, setReservasBD] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Cargar reservas y espacios de MySQL al entrar
  useEffect(() => {
    reservasService
      .listarReservas()
      .then((res) => {
        if (res && res.reservas) {
          setReservasBD(res.reservas);
          if (res.reservas.length > 0) {
            setSeleccion(`R-${String(res.reservas[0].id).padStart(4, '0')}`);
          }
        }
      })
      .catch((err) => console.error('Error al cargar reservas:', err))
      .finally(() => setCargando(false));

    fetch('http://localhost/CampoDeportivoRosas/back/ms-disponibilidad/public/index.php/view/espacios')
      .then((r) => r.json())
      .then((data) => {
        if (data?.espacios) setEspacios(data.espacios);
      })
      .catch(() => {});
  }, []);

  // Adaptar las reservas de MySQL (NUNCA usa listadoReservas)
  const reservasAdaptadas = useMemo(() => {
    if (!reservasBD || reservasBD.length === 0) {
      return []; // Devuelve arreglo vacío mientras carga o si no hay filas
    }

    const mapaEspacios: Record<number, string> = {
      1: 'Fútbol',
      2: 'Tejo',
      3: 'Salón de Eventos',
      4: 'Zona BBQ',
    };

    return reservasBD.map((r: any) => {
      const ref = `R-${String(r.id).padStart(4, '0')}`;
      const nombreCliente = r.cliente?.nombre || r.entidad_organizadora || `Cliente #${r.cliente_id}`;
      const espacioNombre = mapaEspacios[r.espacio_id] || `Espacio #${r.espacio_id}`;
      const anticipoNum = parseFloat(r.anticipo) || 0;
      const alquilerNum = 120000;
      const saldoNum = Math.max(0, alquilerNum - anticipoNum);
      const hIni = (r.hora_inicio || '').slice(0, 5);
      const hFin = (r.hora_fin || '').slice(0, 5);

      return {
        ref,
        cliente: nombreCliente,
        espacioId: r.espacio_id,
        fecha: r.fecha,
        estado: r.estado === 'CONFIRMADA' ? 'Confirmada' : (r.estado || 'Confirmada'),
        linea1: `${espacioNombre} · ${r.fecha}`,
        linea2: `${hIni} – ${hFin}`,
        estadoDetalle: anticipoNum > 0 ? 'Con anticipo' : 'Sin anticipo',
        saldo: formatCOP(saldoNum),
        detalle: {
          nombre: nombreCliente,
          perfil: r.tipo || 'Particular',
          fecha: `${espacioNombre} · ${r.fecha} · ${hIni} – ${hFin}`,
          contacto: nombreCliente,
          telefono: r.cliente?.telefono || 'Sin teléfono',
          correo: r.cliente?.correo || 'Sin correo',
          alquiler: alquilerNum,
          anticipo: anticipoNum,
        },
      } as FilaReserva;
    });
  }, [reservasBD]);

  // Filtrado sobre reservas reales
  const filas = useMemo(
    () =>
      reservasAdaptadas.filter((f) => {
        const q = filtros.texto.trim().toLowerCase();
        return (
          (filtros.estado === 'todos' || f.estado === filtros.estado) &&
          (!filtros.espacio || f.espacioId === filtros.espacio) &&
          (!filtros.desde || f.fecha >= filtros.desde) &&
          (!filtros.hasta || f.fecha <= filtros.hasta) &&
          (!q || `${f.ref} ${f.cliente} ${f.detalle.telefono}`.toLowerCase().includes(q))
        );
      }),
    [filtros, reservasAdaptadas],
  );

  // Reserva seleccionada para el detalle derecho
  const actual = reservasAdaptadas.find((f) => f.ref === seleccion) ?? reservasAdaptadas[0] ?? filaVacia;
  const acciones = accionesPara(actual);

  const limpiar = () => {
    setEstado('todos');
    setEspacio(0);
    setRango({ desde: '', hasta: '' });
    setTexto('');
    setFiltros({ estado: 'todos', espacio: 0, desde: '', hasta: '', texto: '' });
  };

  return (
    <>
      <TitleBar
        title="Gestión de reservas"
        subtitle="Consulta reservas pactadas y distingue las consultas que terminaron sin reservar."
      />

      <Card title="Buscar y filtrar" style={{ zIndex: 10 }}>
        <Row gap={16}>
          <SelectField
            label="Estado"
            value={estado}
            onChange={setEstado}
            options={[{ label: 'Todos los estados', value: 'todos' }, ...ESTADOS.map((e) => ({ label: e, value: e }))]}
            style={{ flex: 1 }}
          />
          <SelectField
            label="Espacio"
            value={espacio}
            onChange={setEspacio}
            options={[{ label: 'Todos los espacios', value: 0 }, ...espacios.map((e) => ({ label: e.nombre, value: e.id }))]}
            style={{ flex: 1 }}
          />
          <DateRangeField
            label="Fechas de uso"
            desde={rango.desde}
            hasta={rango.hasta}
            onChange={(desde, hasta) => setRango({ desde, hasta })}
            style={{ flex: 1.4 }}
          />
          <Field
            label="Cliente o referencia"
            value={texto}
            onChangeText={setTexto}
            placeholder="Nombre, teléfono o código"
            style={{ flex: 1 }}
          />
        </Row>
        <Row gap={16}>
          <Chip label={`${filas.length} resultados`} />
          <Button label="Agregar cliente" variant="secondary" onPress={() => router.push(routes.agregarCliente)} />
          <View style={{ flex: 1 }} />
          <Button label="Consultar" onPress={() => setFiltros({ estado, espacio, ...rango, texto })} />
          <Button label="Limpiar" variant="secondary" onPress={limpiar} />
        </Row>
      </Card>

      <TwoColumns
        main={
          <>
            <Card title="Reservas y consultas" badge={<Chip label="Listado" />}>
              <Table
                columns={[
                  { title: 'Referencia / cliente', width: 210 },
                  { title: 'Espacio / fecha', width: 190 },
                  { title: 'Estado', width: 170 },
                  { title: 'Saldo · COP' },
                ]}
                rows={filas.map((f) => [
                  [f.ref, f.cliente],
                  [f.linea1, f.linea2],
                  f.estadoDetalle ? [f.estado, f.estadoDetalle] : [f.estado],
                  f.saldo,
                ])}
                selected={filas.findIndex((f) => f.ref === seleccion)}
                onSelect={(i) => setSeleccion(filas[i].ref)}
              />
              <Row gap={16}>
                <View style={{ flex: 1 }} />
                <Small>{cargando ? 'Cargando reservas...' : `Mostrando ${filas.length} de ${reservasAdaptadas.length}`}</Small>
                <Button label="< Anterior" variant="disabled" />
                <Button label="Siguiente >" variant="disabled" />
              </Row>
            </Card>
            <Notice title="Finalizado sin reserva ≠ cancelación">
              C-0081: el cliente rechazó las alternativas de una consulta. No se creó ni bloqueó reserva; no hay cobro, multa ni penalidad.
            </Notice>
            <Small>
              Escuela: lunes–sábado, sin domingo. Campeonato/Particular: sábado–domingo. Sábado disponible para ambos, sin prioridad.
            </Small>
          </>
        }
        aside={
          <>
            <Card title={`Detalle de ${actual.ref}`} badge={<Chip label={actual.estado} />}>
              <T size={18} weight="semibold" lh={1.45}>
                {actual.detalle.nombre}
              </T>
              <View>
                <T color={colors.textMuted} lh={1.45}>
                  {actual.detalle.perfil}
                </T>
                <T color={colors.textMuted} lh={1.45}>
                  {actual.detalle.fecha}
                </T>
              </View>
              <DataRow label="Contacto" value={actual.detalle.contacto} />
              <T size={13} color={colors.textMuted} lh={1.45}>
                {actual.detalle.telefono} · {actual.detalle.correo}
              </T>
              <Divider />
              <Chip label="Tarifa · COP" />
              <DataRow label="Alquiler" value={formatCOP(actual.detalle.alquiler)} />
              <DataRow label="Anticipo registrado" value={formatCOP(-actual.detalle.anticipo)} />
              <DataRow big label="Saldo de servicio" value={formatCOP(actual.detalle.alquiler - actual.detalle.anticipo)} />
              <Small>Antes de recepción y valoración de daños. Moneda asumida COP.</Small>
              <Button label={acciones.primaria[0]} onPress={() => router.push(acciones.primaria[1])} />
              {acciones.secundaria ? (
                <Button
                  label={acciones.secundaria[0]}
                  variant="secondary"
                  onPress={() => router.push(acciones.secundaria![1])}
                />
              ) : null}
              <Small>{acciones.nota}</Small>
            </Card>
            <Card title="Historial de la reserva">
              <Timeline
                events={
                  actual.ref === 'R-1048'
                    ? historialR1048
                    : [
                        {
                          title: 'Consulta de detalle · Reciente',
                          detail: 'Registro sincronizado desde la base de datos.',
                        },
                      ]
                }
              />
            </Card>
          </>
        }
      />
    </>
  );
}