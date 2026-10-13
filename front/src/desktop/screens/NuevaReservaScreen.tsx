/**
 * Nueva reserva (botón "Reservar" del menú). No tiene mockup desktop propio: se arma con el
 * mismo sistema de diseño para cubrir los endpoints de reserva de la rama back:
 *   GET  /view/clientes, /view/espacios, /view/consultar, /view/cronograma
 *   POST /view/validarrecurrencia, /view/confirmarreserva
 */
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  ApiError,
  disponibilidadService,
  reservasService,
  type Cliente,
  type Espacio,
  type SesionValidada,
  type TipoCliente,
} from '@/shared/services';
import { colors } from '@/shared/theme/tokens';
import { formatFecha, shortTime, toBackTime } from '@/shared/utils/format';

import { TitleBar, TwoColumns } from '../components/composites';
import { DateField, MultiDateField } from '../components/DatePicker';
import { Cronograma } from '../components/Cronograma';
import { Button, Card, Chip, Field, Notice, Row, SelectField, Small, T, Table } from '../components/ui';

const PERFIL: Record<TipoCliente, string> = {
  ESCUELA_FORMACION: 'Escuela de Formación',
  CAMPEONATO: 'Campeonato',
  PARTICULAR: 'Particular',
  OCASIONAL: 'Ocasional',
};
const REGLA: Record<TipoCliente, string> = {
  ESCUELA_FORMACION: 'Lunes a sábado. Los domingos no están habilitados.',
  CAMPEONATO: 'Sábado y domingo.',
  PARTICULAR: 'Sábado y domingo.',
  OCASIONAL: 'Cualquier día de la semana.',
};
const ESTADO_SESION = { DISPONIBLE: 'Disponible', CRUCE_HORARIO: 'Cruce de horario', NO_PERMITIDO: 'Día no permitido' } as const;

type Aviso = { tone: 'success' | 'danger' | 'info'; title: string; text: string } | null;

/** Lunes y domingo de la semana de una fecha YYYY-MM-DD. */
function semanaDe(fecha: string): { desde: string; hasta: string } {
  const d = new Date(`${fecha}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return { desde: fecha, hasta: fecha };
  const dia = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  const lunes = new Date(d.getTime() - (dia - 1) * 86400000);
  const domingo = new Date(lunes.getTime() + 6 * 86400000);
  return { desde: lunes.toISOString().slice(0, 10), hasta: domingo.toISOString().slice(0, 10) };
}

export default function NuevaReservaScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [clienteId, setClienteId] = useState(2);
  const [espacioId, setEspacioId] = useState(1);
  const [entidad, setEntidad] = useState('Torneo Relámpago Boyacá');
  const [fecha, setFecha] = useState('2026-10-24');
  const [horaInicio, setHoraInicio] = useState('14:00');
  const [horaFin, setHoraFin] = useState('16:00');
  const [anticipo, setAnticipo] = useState('50000');
  const [aviso, setAviso] = useState<Aviso>(null);
  const [cargando, setCargando] = useState<'consultar' | 'confirmar' | 'recurrencia' | null>(null);
  const [fechasRecurrentes, setFechasRecurrentes] = useState<string[]>(['2026-10-24', '2026-10-25', '2026-10-31']);
  const [sesiones, setSesiones] = useState<SesionValidada[] | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    reservasService.listarClientes().then((r) => setClientes(r.clientes)).catch(() => setClientes([]));
    disponibilidadService.listarEspacios().then((r) => setEspacios(r.espacios)).catch(() => setEspacios([]));
  }, []);

  const cliente = clientes.find((c) => c.id === clienteId);
  const tipo: TipoCliente = cliente?.tipo ?? 'PARTICULAR';
  const semana = useMemo(() => semanaDe(fecha), [fecha]);
  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha);

  const errorDe = (e: unknown) => (e instanceof ApiError ? e.message : 'Ocurrió un error inesperado');

  // GET /view/consultar (ms-disponibilidad)
  const consultar = async () => {
    setCargando('consultar');
    setAviso(null);
    try {
      const r = await disponibilidadService.consultar({
        espacio_id: espacioId,
        fecha,
        hora_inicio: toBackTime(horaInicio),
        hora_fin: toBackTime(horaFin),
      });
      setAviso(
        r.disponible
          ? { tone: 'success', title: 'Franja disponible', text: `${formatFecha(r.fecha)} · ${shortTime(r.hora_inicio)} – ${shortTime(r.hora_fin)}` }
          : { tone: 'danger', title: 'Franja no disponible', text: 'Está ocupada o fuera del horario de atención (06:00 – 22:00).' },
      );
    } catch (e) {
      setAviso({ tone: 'danger', title: 'No se pudo consultar', text: errorDe(e) });
    } finally {
      setCargando(null);
    }
  };

  // POST /view/confirmarreserva (ms-reservas) — 400 cliente inexistente / día no permitido, 409 cruce
  const confirmar = async () => {
    setCargando('confirmar');
    setAviso(null);
    try {
      const r = await reservasService.confirmarReserva({
        espacio_id: espacioId,
        cliente_id: clienteId,
        tipo,
        entidad_organizadora: entidad.trim() || null,
        fecha,
        hora_inicio: toBackTime(horaInicio),
        hora_fin: toBackTime(horaFin),
        anticipo: Number(anticipo.replace(/[^\d.]/g, '')) || 0,
      });
      setAviso({
        tone: 'success',
        title: `${r.mensaje} · R-${r.reserva_id}`,
        text: r.bloqueo_sincronizado ? 'La franja quedó bloqueada en el cronograma del espacio.' : 'La reserva se guardó, pero el bloqueo no se sincronizó.',
      });
      setVersion((v) => v + 1);
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      setAviso({ tone: 'danger', title: status === 409 ? 'Cruce de horario' : 'No se pudo confirmar', text: errorDe(e) });
    } finally {
      setCargando(null);
    }
  };

  // POST /view/validarrecurrencia (ms-reservas)
  const validarRecurrencia = async () => {
    setCargando('recurrencia');
    setSesiones(null);
    try {
      const r = await reservasService.validarRecurrencia({
        espacio_id: espacioId,
        tipo,
        sesiones: fechasRecurrentes.map((f) => ({ fecha: f, hora_inicio: toBackTime(horaInicio), hora_fin: toBackTime(horaFin) })),
      });
      setSesiones(r.sesiones);
    } catch (e) {
      setAviso({ tone: 'danger', title: 'No se pudo validar la recurrencia', text: errorDe(e) });
    } finally {
      setCargando(null);
    }
  };

  return (
    <>
      <TitleBar
        title="Nueva reserva"
        subtitle="Elige cliente, espacio y franja; consulta la disponibilidad y confirma la reserva."
      />
      <TwoColumns
        main={
          <>
            <Card title="Datos de la reserva" style={{ zIndex: 10 }}>
              <Row gap={16} style={{ zIndex: 10 }}>
                <SelectField
                  label="Cliente"
                  value={clienteId}
                  onChange={setClienteId}
                  options={clientes.map((c) => ({ label: c.nombre, value: c.id }))}
                  style={{ flex: 1 }}
                />
                <SelectField
                  label="Espacio"
                  value={espacioId}
                  onChange={setEspacioId}
                  options={espacios.map((e) => ({ label: e.nombre, value: e.id }))}
                  style={{ flex: 1 }}
                />
              </Row>
              <Field label="Entidad organizadora · opcional" value={entidad} onChangeText={setEntidad} />
              <Row gap={16}>
                <DateField label="Fecha" value={fecha} onChange={setFecha} style={{ flex: 1 }} />
                <Field label="Hora de inicio" value={horaInicio} onChangeText={setHoraInicio} style={{ flex: 1 }} />
                <Field label="Hora de fin" value={horaFin} onChangeText={setHoraFin} style={{ flex: 1 }} />
                <Field label="Anticipo · COP" value={anticipo} onChangeText={setAnticipo} keyboardType="numeric" style={{ flex: 1 }} />
              </Row>
              <Small>El anticipo es opcional: vacío o 0 es válido.</Small>
              {aviso ? (
                <Notice tone={aviso.tone} title={aviso.title}>
                  {aviso.text}
                </Notice>
              ) : null}
              <Row gap={12}>
                <Button label="Consultar disponibilidad" variant="secondary" loading={cargando === 'consultar'} onPress={consultar} />
                <Button label="Confirmar reserva" loading={cargando === 'confirmar'} onPress={confirmar} />
              </Row>
            </Card>

            <Card title="Reserva recurrente" badge={<Chip label="Varias sesiones" />}>
              <MultiDateField
                label="Fechas de las sesiones"
                values={fechasRecurrentes}
                onChange={setFechasRecurrentes}
                helper="Usa el mismo espacio, cliente y franja de arriba."
              />
              <Button label="Validar recurrencia" variant="secondary" loading={cargando === 'recurrencia'} onPress={validarRecurrencia} />
              {sesiones ? (
                <Table
                  columns={[{ title: 'Fecha' }, { title: 'Franja' }, { title: 'Resultado' }]}
                  rows={sesiones.map((s) => [
                    formatFecha(s.fecha),
                    `${shortTime(s.hora_inicio)} – ${shortTime(s.hora_fin)}`,
                    s.mensaje ? [ESTADO_SESION[s.estado], s.mensaje] : [ESTADO_SESION[s.estado]],
                  ])}
                />
              ) : null}
            </Card>
          </>
        }
        aside={
          <>
            <Card title="Regla del perfil" badge={<Chip label={PERFIL[tipo]} />}>
              <T lh={1.45}>{REGLA[tipo]}</T>
              <Small>Horario de atención de todos los espacios: lunes a domingo, 06:00 – 22:00.</Small>
            </Card>
            <Card title="Cronograma de la semana">
              <T size={13} color={colors.textMuted} lh={1.45}>
                {fechaValida ? `${formatFecha(semana.desde)} – ${formatFecha(semana.hasta)}` : 'Escribe una fecha válida'}
              </T>
              {fechaValida ? (
                <View>
                  <Cronograma espacioId={espacioId} desde={semana.desde} hasta={semana.hasta} version={version} />
                </View>
              ) : null}
            </Card>
          </>
        }
      />
    </>
  );
}
