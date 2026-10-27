/**
 * Nueva reserva (botón "Reservar" del menú). No tiene mockup desktop propio: se arma con el
 * mismo sistema de diseño para cubrir los endpoints de reserva de la rama back:
 *   GET  /view/clientes, /view/espacios, /view/consultar, /view/cronograma
 *   POST /view/validarrecurrencia, /view/confirmarreserva
 * Sprint 2:
 *   HU-06 si la franja no está libre se sugieren fechas alternativas y el cliente acepta una.
 *   HU-08 confirmar con anticipo (0 < monto ≤ valor total) y comprobante.
 *   HU-09 confirmar sin anticipo con constancia de saldo pendiente.
 */
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  ApiError,
  disponibilidadService,
  reservasService,
  calcularValorTotal,
  type Anticipo,
  type Cliente,
  type ConstanciaSaldo,
  type Espacio,
  type FechaAlternativa,
  type SesionValidada,
  type SolicitudReserva,
  type TipoCliente,
} from '@/shared/services';
import { colors } from '@/shared/theme/tokens';
import { formatFecha, shortTime, toBackTime } from '@/shared/utils/format';

import { AnticipoForm, montoNumero, validarPago, type PagoForm } from '../components/AnticipoForm';
import { TitleBar, TwoColumns } from '../components/composites';
import { ConstanciaSaldoCard } from '../components/ConstanciaSaldoCard';
import { DateField, hoyIso, MultiDateField } from '../components/DatePicker';
import { FechasAlternativasPanel } from '../components/FechasAlternativasPanel';
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
type Franja = { fecha: string; hora_inicio: string; hora_fin: string };

/** Responsable que queda en el anticipo o la constancia (sesión del menú lateral). */
const RESPONSABLE = 'Ana Martínez · Administradora';

interface Resultado {
  reservaId: number;
  cliente: string;
  detalle: string;
  valorTotal: number;
  anticipo: Anticipo | null;
  constancia: ConstanciaSaldo | null;
}

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
  const [entidad, setEntidad] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [pago, setPago] = useState<PagoForm>({
    modo: 'anticipo',
    monto: '',
    metodo: 'TRANSFERENCIA',
    referencia: '',
    fechaPago: hoyIso(),
    fechaLimite: '',
    observacion: '',
  });
  const [aviso, setAviso] = useState<Aviso>(null);
  const [avisoPago, setAvisoPago] = useState<Aviso>(null);
  const [cargando, setCargando] = useState<'consultar' | 'confirmar' | 'recurrencia' | 'aceptar' | 'rechazar' | null>(null);
  const [solicitud, setSolicitud] = useState<{ solicitud: SolicitudReserva; alternativas: FechaAlternativa[] } | null>(null);
  const [alternativaSel, setAlternativaSel] = useState<number | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
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
  const espacio = espacios.find((e) => e.id === espacioId) ?? { id: espacioId };
  const valorTotalDe = (f: Franja) => calcularValorTotal(espacio, f.hora_inicio, f.hora_fin);
  const valorTotal = valorTotalDe({ fecha, hora_inicio: horaInicio, hora_fin: horaFin });
  const franjaForm = (): Franja => ({ fecha, hora_inicio: toBackTime(horaInicio), hora_fin: toBackTime(horaFin) });

  const errorDe = (e: unknown) => (e instanceof ApiError ? e.message : 'Ocurrió un error inesperado');

  // HU-06 · GET /view/alternativas + POST /view/alternativas: la solicitud queda PENDIENTE con sus alternativas SUGERIDA
  const abrirAlternativas = async (f: Franja) => {
    try {
      const { alternativas } = await disponibilidadService.sugerirAlternativas({ espacio_id: espacioId, ...f, tipo, max: 4 });
      const r = await reservasService.proponerAlternativas({ espacio_id: espacioId, cliente_id: clienteId, tipo, ...f, alternativas });
      setSolicitud({ solicitud: r.solicitud, alternativas: r.alternativas });
      setAlternativaSel(r.alternativas[0]?.id ?? null);
    } catch (e) {
      setAviso({ tone: 'danger', title: 'No se pudieron sugerir alternativas', text: errorDe(e) });
    }
  };

  /**
   * POST /view/confirmarreserva con el anticipo y, según el modo de pago,
   * POST /view/anticipo (HU-08) o POST /view/confirmarsinanticipo (HU-09).
   * Lanza el ApiError del back (409 = cruce) para que quien llama decida.
   */
  const confirmarFranja = async (f: Franja): Promise<number> => {
    const total = valorTotalDe(f);
    const monto = pago.modo === 'anticipo' ? montoNumero(pago.monto) : 0;
    const r = await reservasService.confirmarReserva({
      espacio_id: espacioId,
      cliente_id: clienteId,
      tipo,
      entidad_organizadora: entidad.trim() || null,
      // Solo la franja: una FechaAlternativa trae además id, orden y estado que el back no debe recibir.
      fecha: f.fecha,
      hora_inicio: f.hora_inicio,
      hora_fin: f.hora_fin,
      anticipo: monto,
    });

    let anticipoReg: Anticipo | null = null;
    let constancia: ConstanciaSaldo | null = null;
    try {
      if (pago.modo === 'anticipo') {
        const a = await reservasService.registrarAnticipo({
          reserva_id: r.reserva_id,
          valor_total: total,
          monto,
          metodo_pago: pago.metodo,
          referencia: pago.referencia.trim() || null,
          fecha_pago: pago.fechaPago,
          registrado_por: RESPONSABLE,
        });
        anticipoReg = a.anticipo;
      } else {
        const c = await reservasService.confirmarSinAnticipo({
          reserva_id: r.reserva_id,
          valor_total: total,
          fecha_limite_pago: pago.fechaLimite,
          observacion: pago.observacion.trim() || null,
          registrado_por: RESPONSABLE,
        });
        constancia = c.constancia;
      }
    } catch (e) {
      setAvisoPago({ tone: 'danger', title: 'La reserva se confirmó, pero el pago no se registró', text: errorDe(e) });
    }

    setResultado({
      reservaId: r.reserva_id,
      cliente: cliente?.nombre ?? `Cliente #${clienteId}`,
      detalle: `${'nombre' in espacio ? espacio.nombre : `Espacio #${espacioId}`} · ${formatFecha(f.fecha)} · ${shortTime(f.hora_inicio)} – ${shortTime(f.hora_fin)}`,
      valorTotal: total,
      anticipo: anticipoReg,
      constancia,
    });
    setAviso({
      tone: 'success',
      title: `${r.mensaje} · R-${r.reserva_id}`,
      text: r.bloqueo_sincronizado ? 'La franja quedó bloqueada en el cronograma del espacio.' : 'La reserva se guardó, pero el bloqueo no se sincronizó.',
    });
    setVersion((v) => v + 1);
    return r.reserva_id;
  };

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
          : { tone: 'danger', title: 'Franja no disponible', text: `La franja de ${shortTime(r.hora_inicio)} a ${shortTime(r.hora_fin)} está ocupada o fuera del horario de atención. Revisa las fechas alternativas.` },
      );
      if (r.disponible) setSolicitud(null);
      else await abrirAlternativas(franjaForm());
    } catch (e) {
      setAviso({ tone: 'danger', title: 'No se pudo consultar', text: errorDe(e) });
    } finally {
      setCargando(null);
    }
  };

  // POST /view/confirmarreserva (ms-reservas) — 400 cliente inexistente / día no permitido, 409 cruce → HU-06
  const confirmar = async () => {
    setAviso(null);
    setAvisoPago(null);
    const errorPago = validarPago(pago, valorTotal);
    if (errorPago) {
      setAvisoPago({ tone: 'danger', title: 'Revisa el pago', text: errorPago });
      return;
    }
    setCargando('confirmar');
    try {
      await confirmarFranja(franjaForm());
      setSolicitud(null);
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      setAviso({ tone: 'danger', title: status === 409 ? 'Cruce de horario' : 'No se pudo confirmar', text: errorDe(e) });
      if (status === 409) await abrirAlternativas(franjaForm());
    } finally {
      setCargando(null);
    }
  };

  // HU-06 · el cliente acepta una alternativa: se confirma esa franja y POST /view/aceptaralternativa
  const aceptarAlternativa = async () => {
    const alt = solicitud?.alternativas.find((a) => a.id === alternativaSel);
    if (!solicitud || !alt) return;
    setAviso(null);
    setAvisoPago(null);
    const errorPago = validarPago(pago, valorTotalDe(alt));
    if (errorPago) {
      setAvisoPago({ tone: 'danger', title: 'Revisa el pago', text: errorPago });
      return;
    }
    setCargando('aceptar');
    try {
      const reservaId = await confirmarFranja(alt);
      const r = await reservasService.aceptarAlternativa({ solicitud_id: solicitud.solicitud.id, alternativa_id: alt.id, reserva_id: reservaId });
      setSolicitud({ solicitud: r.solicitud, alternativas: r.alternativas });
      setFecha(alt.fecha);
      setHoraInicio(shortTime(alt.hora_inicio));
      setHoraFin(shortTime(alt.hora_fin));
    } catch (e) {
      setAviso({ tone: 'danger', title: 'No se pudo aceptar la alternativa', text: errorDe(e) });
    } finally {
      setCargando(null);
    }
  };

  // El cliente rechaza todas las alternativas: el proceso termina sin reserva (cierre completo en HU-07)
  const rechazarAlternativas = async () => {
    if (!solicitud) return;
    setCargando('rechazar');
    try {
      const r = await reservasService.rechazarAlternativas({ solicitud_id: solicitud.solicitud.id });
      setSolicitud({ solicitud: r.solicitud, alternativas: r.alternativas });
      setAviso({ tone: 'info', title: 'Finalizado sin reserva', text: 'El cliente rechazó las alternativas. No se creó ni bloqueó reserva; no hay cobro ni penalidad.' });
    } catch (e) {
      setAviso({ tone: 'danger', title: 'No se pudo cerrar la solicitud', text: errorDe(e) });
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
                <Field label="Hora de inicio" value={horaInicio} onChangeText={setHoraInicio} placeholder="16:00" style={{ flex: 1 }} />
                <Field label="Hora de fin" value={horaFin} onChangeText={setHoraFin} placeholder="18:00" style={{ flex: 1 }} />
              </Row>
              {aviso ? (
                <Notice tone={aviso.tone} title={aviso.title}>
                  {aviso.text}
                </Notice>
              ) : null}
              <Row gap={12}>
                <Button label="Consultar disponibilidad" variant="secondary" loading={cargando === 'consultar'} onPress={consultar} />
              </Row>
            </Card>

            {solicitud ? (
              <FechasAlternativasPanel
                pedida={solicitud.solicitud}
                alternativas={solicitud.alternativas}
                seleccion={alternativaSel}
                onSeleccionar={setAlternativaSel}
                onAceptar={aceptarAlternativa}
                onRechazar={rechazarAlternativas}
                cargando={cargando === 'aceptar' ? 'aceptar' : cargando === 'rechazar' ? 'rechazar' : null}
                resuelta={solicitud.solicitud.estado !== 'PENDIENTE'}
              />
            ) : null}

            <Card title="Pago y confirmación" badge={<Chip label="Tarifa · COP" />} style={{ zIndex: 5 }}>
              <AnticipoForm value={pago} onChange={setPago} valorTotal={valorTotal} />
              <Small>
                {valorTotal > 0
                  ? 'Valor total = valor por hora del espacio × horas reservadas. Moneda COP.'
                  : 'Escribe la hora de inicio y de fin para calcular el valor total.'}
              </Small>
              {avisoPago ? (
                <Notice tone={avisoPago.tone} title={avisoPago.title}>
                  {avisoPago.text}
                </Notice>
              ) : null}
              <Row gap={12}>
                <Button
                  label={pago.modo === 'anticipo' ? 'Confirmar con anticipo' : 'Confirmar sin anticipo'}
                  loading={cargando === 'confirmar'}
                  onPress={confirmar}
                />
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
            {resultado ? (
              <ConstanciaSaldoCard
                referencia={`R-${resultado.reservaId}`}
                cliente={resultado.cliente}
                detalle={resultado.detalle}
                valorTotal={resultado.valorTotal}
                anticipo={resultado.anticipo}
                constancia={resultado.constancia}
              />
            ) : null}
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
