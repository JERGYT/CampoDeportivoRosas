import { router } from 'expo-router';
import { View } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { reservasService } from '../../shared/services/reservas';
import { disponibilidadService, type Espacio } from '../../shared/services/disponibilidad';
import { colors } from '../../shared/theme/tokens';
import { formatCOP } from '../../shared/utils/format';
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
import { historialR1048, listadoReservas } from '../data/demo';
import { routes } from '../navigation';

const ESTADOS = ['Confirmada', 'Completada', 'Cancelada', 'Recibida', 'Finalizado'];

function accionesPara(fila: any) {
  switch (fila?.estado) {
    case 'Confirmada':
      return {
        primaria: ['Validar y entregar espacio', routes.entrega],
        secundaria: ['Iniciar cancelación', routes.cancelacion],
        nota: 'La reserva está confirmada: puede entregarse tras validar. La cancelación solo la gestiona el administrador.',
      };
    case 'Recibida':
      return {
        primaria: ['Liquidar reserva', routes.liquidacion],
        nota: 'El espacio ya fue recibido: falta la liquidación y el pago final.',
      };
    case 'Cancelada':
      return {
        primaria: ['Gestionar devolución', routes.devolucion],
        secundaria: ['Ver auditoría de cancelación', routes.cancelacionCompletada],
        nota: 'La reserva fue cancelada y el horario liberado.',
      };
    case 'Completada':
      return {
        primaria: ['Ver liquidación', routes.liquidacion],
        nota: 'Reserva cerrada con saldo $0.',
      };
    default:
      return {
        primaria: ['Nueva reserva', routes.nuevaReserva],
        nota: 'Consulta sin reserva: no hay franja, cobro ni penalidad.',
      };
  }
}

const filaVacia: any = {
  ref: '---',
  cliente: 'Sin reservas',
  espacioId: 0,
  fecha: '---',
  estado: 'Confirmada',
  linea1: 'Sin registros',
  linea2: 'No hay reservas registradas',
  estadoDetalle: 'Sin registros',
  saldo: '$0',
  detalle: {
    nombre: 'Sin reservas en BD',
    perfil: 'Particular',
    fecha: '---',
    contacto: '---',
    telefono: '---',
    correo: '---',
    alquiler: 0,
    anticipo: 0,
    notaPago: 'Sin movimientos registrados.',
  },
};

export default function GestionReservasScreen() {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [estado, setEstado] = useState('todos');
  const [espacio, setEspacio] = useState<number>(0);
  const [rango, setRango] = useState<{ desde: string; hasta: string }>({ desde: '', hasta: '' });
  const [texto, setTexto] = useState('');
  const [filtros, setFiltros] = useState({ estado: 'todos', espacio: 0, desde: '', hasta: '', texto: '' });
  const [seleccion, setSeleccion] = useState<string>('');

  const [reservasBD, setReservasBD] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Carga inicial desde MySQL
  useEffect(() => {
    reservasService
      .listarReservas()
      .then((res: any) => {
        if (res && res.reservas && res.reservas.length > 0) {
          setReservasBD(res.reservas);
          setSeleccion(`R-${String(res.reservas[0].id).padStart(4, '0')}`);
        }
      })
      .catch((err) => console.error('Error al cargar reservas:', err))
      .finally(() => setCargando(false));

    disponibilidadService
      .obtenerEspacios()
      .then((esp) => {
        if (esp && esp.length > 0) setEspacios(esp);
      })
      .catch(() => {});
  }, []);

  const reservasAdaptadas = useMemo(() => {
    if (!reservasBD || reservasBD.length === 0) {
      return [];
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
      const conAnticipo = anticipoNum > 0;
      const hIni = (r.hora_inicio || '').slice(0, 5);
      const hFin = (r.hora_fin || '').slice(0, 5);

      return {
        ref,
        cliente: nombreCliente,
        espacioId: r.espacio_id,
        fecha: r.fecha,
        estado: r.estado === 'CONFIRMADA' ? 'Confirmada' : (r.estado || 'Confirmada'),
        linea1: `${espacioNombre} · ${r.fecha}`,
        linea2: `${hIni} - ${hFin}`,
        // Distinción visual HU-08 vs HU-09 en la tabla
        estadoDetalle: conAnticipo ? 'Con anticipo' : 'Sin anticipo (100% pendiente)',
        saldo: formatCOP(saldoNum),
        detalle: {
          nombre: nombreCliente,
          perfil: r.tipo || r.cliente?.tipo || 'Particular',
          fecha: `${espacioNombre} · ${r.fecha} · ${hIni} - ${hFin}`,
          contacto: nombreCliente,
          telefono: r.cliente?.telefono || 'Sin teléfono',
          correo: r.cliente?.correo || 'Sin correo',
          alquiler: alquilerNum,
          anticipo: anticipoNum,
          // Constancia formal según HU-08 o HU-09
          notaPago: conAnticipo
            ? `Reserva asegurada con anticipo de ${formatCOP(anticipoNum)}. Saldo restante: ${formatCOP(saldoNum)}.`
            : `Constancia: Sin anticipo registrado. Saldo pendiente total de ${formatCOP(saldoNum)} por liquidar.`,
        },
      } as any;
    });
  }, [reservasBD]);

  // Filtrado reactivo de las filas
  const filas = useMemo(
    () =>
      reservasAdaptadas.filter((f: any) => {
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

  const actual = reservasAdaptadas.find((f: any) => f.ref === seleccion) ?? reservasAdaptadas[0] ?? filaVacia;
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
        subtitle="Consulta reservas pactadas, anticipos asegurados y constancias de saldo pendiente."
      />

      <Card title="Buscar y filtrar" style={{ zIndex: 50, elevation: 50, overflow: 'visible' }}>
        {/* Fila 1 con zIndex alto para que los desplegables floten por encima de los botones */}
        <Row gap={16} style={{ zIndex: 60, elevation: 60, position: 'relative' }}>
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
        
        {/* Fila 2 con zIndex base */}
        <Row gap={16} style={{ zIndex: 1, elevation: 1, position: 'relative', marginTop: 12 }}>
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
                  { title: 'Estado y Pago', width: 190 },
                  { title: 'Saldo · COP' },
                ]}
                rows={filas.map((f: any) => [
                  [f.ref, f.cliente],
                  [f.linea1, f.linea2],
                  f.estadoDetalle ? [f.estado, f.estadoDetalle] : [f.estado],
                  f.saldo,
                ])}
                selected={filas.findIndex((f: any) => f.ref === seleccion)}
                onSelect={(i) => setSeleccion(filas[i].ref)}
              />
              <Row gap={16}>
                <View style={{ flex: 1 }} />
                <Small>
                  {cargando ? 'Cargando reservas desde la base de datos...' : `Mostrando ${filas.length} de ${reservasAdaptadas.length}`}
                </Small>
                <Button label="< Anterior" variant="disabled" />
                <Button label="Siguiente >" variant="disabled" />
              </Row>
            </Card>
            <Notice title="Reglas financieras">
              Las reservas con anticipo aseguran la disponibilidad de franja. Las reservas sin anticipo se confirman dejando constancia del 100% del saldo pendiente para cobro en recepción.
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
              <Chip label="Liquidación y Anticipo" />
              <DataRow label="Alquiler total" value={formatCOP(actual.detalle.alquiler)} />
              <DataRow label="Anticipo registrado" value={formatCOP(-actual.detalle.anticipo)} />
              <DataRow big label="Saldo pendiente" value={formatCOP(actual.detalle.alquiler - actual.detalle.anticipo)} />
              
              {/* Bloque de constancia explícita HU-08 / HU-09 */}
              <View style={{ padding: 10, backgroundColor: '#F3F4F6', borderRadius: 6, marginVertical: 8 }}>
                <T size={12} weight="semibold" color="#374151">Constancia de liquidación:</T>
                <T size={12} color="#4B5563">{actual.detalle.notaPago}</T>
              </View>

              <Button label={acciones.primaria[0]} onPress={() => router.push(acciones.primaria[1] as any)} />
              {acciones.secundaria ? (
                <Button
                  label={acciones.secundaria[0]}
                  variant="secondary"
                  onPress={() => router.push(acciones.secundaria![1] as any)}
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
                          title: `Estado: ${actual.estado}`,
                          detail: actual.detalle.notaPago,
                        },
                        {
                          title: 'Registro en MySQL',
                          detail: 'Sincronizado con microservicio ms-reservas y ms-disponibilidad.',
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