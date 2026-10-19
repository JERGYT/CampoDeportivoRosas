import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

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

export default function GestionReservasScreen() {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [estado, setEstado] = useState('todos');
  const [espacio, setEspacio] = useState<number>(0);
  // Rango de fechas de uso; vacío = sin límite por ese lado.
  const [rango, setRango] = useState({ desde: '', hasta: '' });
  const [texto, setTexto] = useState('');
  const [filtros, setFiltros] = useState({ estado: 'todos', espacio: 0, desde: '', hasta: '', texto: '' });
  const [seleccion, setSeleccion] = useState('R-1048');

  // GET /view/espacios (ms-disponibilidad) para el filtro de espacio
  useEffect(() => {
    disponibilidadService
      .listarEspacios()
      .then((r) => setEspacios(r.espacios))
      .catch(() => setEspacios([]));
  }, []);

  const filas = useMemo(
    () =>
      listadoReservas.filter((f) => {
        const q = filtros.texto.trim().toLowerCase();
        return (
          (filtros.estado === 'todos' || f.estado === filtros.estado) &&
          (!filtros.espacio || f.espacioId === filtros.espacio) &&
          (!filtros.desde || f.fecha >= filtros.desde) &&
          (!filtros.hasta || f.fecha <= filtros.hasta) &&
          (!q || `${f.ref} ${f.cliente} ${f.detalle.telefono}`.toLowerCase().includes(q))
        );
      }),
    [filtros],
  );

  const actual = listadoReservas.find((f) => f.ref === seleccion) ?? listadoReservas[0];
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
                  { title: 'Estado', width: 176 },
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
                <View style={{ flex: 1 }}>
                  <Small>{`Mostrando ${filas.length} de ${listadoReservas.length}`}</Small>
                </View>
                <Button label="‹ Anterior" variant="disabled" />
                <Button label="Siguiente ›" variant="disabled" />
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
                {`${actual.detalle.telefono} · ${actual.detalle.correo}`}
              </T>
              <Divider />
              <Chip label="Tarifa · COP" />
              <DataRow label="Alquiler" value={formatCOP(actual.detalle.alquiler)} />
              <DataRow label="Anticipo registrado" value={formatCOP(-actual.detalle.anticipo)} />
              <DataRow big label="Saldo de servicio" value={formatCOP(actual.detalle.alquiler - actual.detalle.anticipo)} />
              <Small>Antes de recepción y valoración de daños. Moneda asumida COP.</Small>
              <Button label={acciones.primaria[0]} onPress={() => router.push(acciones.primaria[1])} />
              {acciones.secundaria ? (
                <Button label={acciones.secundaria[0]} variant="secondary" onPress={() => router.push(acciones.secundaria![1])} />
              ) : null}
              <Small>{acciones.nota}</Small>
            </Card>
            <Card title="Historial de la reserva">
              <Timeline events={actual.ref === 'R-1048' ? historialR1048 : [{ title: 'Consulta de detalle · 17 oct, 15:45', detail: 'Ana Martínez · Sin cambios en la reserva.' }]} />
            </Card>
          </>
        }
      />
    </>
  );
}
