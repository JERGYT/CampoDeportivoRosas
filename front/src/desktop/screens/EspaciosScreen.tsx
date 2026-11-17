/**
 * Espacios y horarios . Cubre los endpoints de ms-disponibilidad:
 *   GET /view/espacios · GET /view/cronograma · POST /view/bloquear
 *   GET /view/horarios · POST /view/horarios · POST /view/horarios/actualizar · POST /view/horarios/eliminar
 */
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { ApiError, disponibilidadService, type Espacio } from '@/shared/services';
import { authService } from '@/shared/services/auth';
import { toBackTime } from '@/shared/utils/format';

import { TitleBar, TwoColumns } from '../components/composites';
import { DateField, DateRangeField } from '../components/DatePicker';
import { Cronograma } from '../components/Cronograma';
import { Button, Card, Chip, Divider, Field, Notice, Row, SelectField, Small, T, Table } from '../components/ui';

const TIPO: Record<string, string> = {
  FUTBOL: 'Fútbol',
  CANCHA_FUTBOL: 'Fútbol',
  TEJO: 'Tejo',
  CANCHA_TEJO: 'Tejo',
  SALON_COMUNAL: 'Salón de Eventos',
  BARBECUE: 'Zona BBQ',
  ZONA_BARBECUE: 'Zona BBQ',
};

const DIAS_SEMANA = [
  { label: 'Lunes', value: 'Lunes' },
  { label: 'Martes', value: 'Martes' },
  { label: 'Miércoles', value: 'Miércoles' },
  { label: 'Jueves', value: 'Jueves' },
  { label: 'Viernes', value: 'Viernes' },
  { label: 'Sábado', value: 'Sábado' },
  { label: 'Domingo', value: 'Domingo' },
];

function caracteristicas(e: Espacio): string {
  if (e.tipo === 'FUTBOL' || e.tipo === 'CANCHA_FUTBOL') {
    return `${e.jugadores_por_equipo ?? 8} por equipo · ${e.dimensiones ?? '55x35m'}`;
  }
  if (e.tipo === 'TEJO' || e.tipo === 'CANCHA_TEJO') {
    return `${e.numero_carriles ?? 3} carriles`;
  }
  if (e.tipo === 'SALON_COMUNAL') {
    return e.tiene_sonido !== 0 ? 'Con sonido' : 'Sin sonido';
  }
  return `${e.numero_asadores ?? 3} asadores · ${e.tiene_mesas !== 0 ? 'con mesas' : 'sin mesas'}`;
}

export default function EspaciosScreen() {
  const esAdmin = authService.esAdministrador();

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [seleccion, setSeleccion] = useState(1);
  const [desde, setDesde] = useState('2026-11-01');
  const [hasta, setHasta] = useState('2026-11-30');
  const [version, setVersion] = useState(0);

  const [reservaId, setReservaId] = useState('99');
  const [fecha, setFecha] = useState('2026-11-20');
  const [horaInicio, setHoraInicio] = useState('14:00');
  const [horaFin, setHoraFin] = useState('16:00');
  const [tipo, setTipo] = useState('MANTENIMIENTO');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; text: string } | null>(null);


  const [horarios, setHorarios] = useState<any[]>([]);
  const [horarioSelIdx, setHorarioSelIdx] = useState<number>(-1);
  const [diaHorario, setDiaHorario] = useState('Lunes');
  const [aperturaHorario, setAperturaHorario] = useState('06:00');
  const [cierreHorario, setCierreHorario] = useState('22:00');
  const [guardandoHorario, setGuardandoHorario] = useState(false);
  const [avisoHorario, setAvisoHorario] = useState<{ ok: boolean; text: string } | null>(null);

  const cargarHorarios = useCallback((espacioId: number) => {
    disponibilidadService
      .listarHorarios(espacioId)
      .then((res: any) => {
        const lista = res?.horarios || [];
        setHorarios(lista);
        setHorarioSelIdx(-1);
      })
      .catch(() => setHorarios([]));
  }, []);

  
  useEffect(() => {
    disponibilidadService
      .listarEspacios()
      .then((r) => {
        const lista = r.espacios || [];
        setEspacios(lista);
        if (lista.length > 0) {
          setSeleccion(Number(lista[0].id));
        }
      })
      .catch(() => setEspacios([]));
  }, []);

  useEffect(() => {
    if (seleccion > 0) {
      cargarHorarios(seleccion);
    }
  }, [seleccion, cargarHorarios]);

  const actual = espacios.find((e) => Number(e.id) === Number(seleccion));
  const horarioSeleccionado = horarioSelIdx >= 0 ? horarios[horarioSelIdx] : null;

  const seleccionarFilaHorario = (idx: number) => {
    setHorarioSelIdx(idx);
    setAvisoHorario(null);
    const h = horarios[idx];
    if (h) {
      setDiaHorario(h.dia);
      setAperturaHorario(String(h.hora_apertura || '').slice(0, 5));
      setCierreHorario(String(h.hora_cierre || '').slice(0, 5));
    }
  };

  const limpiarFormularioHorario = () => {
    setHorarioSelIdx(-1);
    setDiaHorario('Lunes');
    setAperturaHorario('06:00');
    setCierreHorario('22:00');
    setAvisoHorario(null);
  };

  const onGuardarHorario = async () => {
    if (!aperturaHorario.trim() || !cierreHorario.trim()) {
      setAvisoHorario({ ok: false, text: 'Debes indicar la hora de apertura y la hora de cierre.' });
      return;
    }
    setGuardandoHorario(true);
    setAvisoHorario(null);
    try {
      if (horarioSeleccionado) {
        const res = await disponibilidadService.actualizarHorario({
          id: Number(horarioSeleccionado.id),
          espacio_id: seleccion,
          dia: diaHorario,
          hora_apertura: toBackTime(aperturaHorario),
          hora_cierre: toBackTime(cierreHorario),
        });
        setAvisoHorario({ ok: true, text: res?.mensaje || 'Horario modificado exitosamente.' });
      } else {
        const res = await disponibilidadService.crearHorario({
          espacio_id: seleccion,
          dia: diaHorario,
          hora_apertura: toBackTime(aperturaHorario),
          hora_cierre: toBackTime(cierreHorario),
        });
        setAvisoHorario({ ok: true, text: res?.mensaje || 'Horario de atención agregado correctamente.' });
      }
      cargarHorarios(seleccion);
    } catch (e: any) {
      setAvisoHorario({
        ok: false,
        text: e instanceof ApiError ? e.message : e?.message || 'Error al guardar el horario de atención.',
      });
    } finally {
      setGuardandoHorario(false);
    }
  };

  const onEliminarHorario = async () => {
    if (!horarioSeleccionado) return;
    setGuardandoHorario(true);
    setAvisoHorario(null);
    try {
      const res = await disponibilidadService.eliminarHorario({ id: Number(horarioSeleccionado.id) });
      setAvisoHorario({ ok: true, text: res?.mensaje || 'Horario eliminado correctamente.' });
      limpiarFormularioHorario();
      cargarHorarios(seleccion);
    } catch (e: any) {
      setAvisoHorario({
        ok: false,
        text: e instanceof ApiError ? e.message : e?.message || 'No se pudo eliminar el horario.',
      });
    } finally {
      setGuardandoHorario(false);
    }
  };

  
  const bloquear = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      await disponibilidadService.bloquear({
        espacio_id: seleccion,
        reserva_id: Number(reservaId) || 0,
        fecha,
        hora_inicio: toBackTime(horaInicio),
        hora_fin: toBackTime(horaFin),
        tipo,
      });
      setAviso({ ok: true, text: `Franja ${horaInicio} – ${horaFin} del ${fecha} bloqueada (${tipo}).` });
      setVersion((v) => v + 1);
    } catch (e) {
      setAviso({ ok: false, text: e instanceof ApiError ? e.message : 'No se pudo bloquear' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <TitleBar
        title="Espacios y horarios de atención"
        subtitle="Consulta los espacios activos, administra sus horarios de atención y programa bloqueos de mantenimiento."
      />
      <TwoColumns
        main={
          <>
            <Card title="Espacios activos" badge={<Chip label={`${espacios.length} espacios`} />}>
              <Table
                columns={[
                  { title: 'Espacio', flex: 1.6 },
                  { title: 'Tipo' },
                  { title: 'Capacidad' },
                  { title: 'Características', flex: 1.4 },
                ]}
                rows={espacios.map((e) => [
                  e.nombre,
                  TIPO[e.tipo] || e.tipo,
                  `${e.capacidad} personas`,
                  caracteristicas(e),
                ])}
                selected={espacios.findIndex((e) => Number(e.id) === Number(seleccion))}
                onSelect={(i) => {
                  setAvisoHorario(null);
                  setSeleccion(Number(espacios[i].id));
                }}
              />
              <Small>
                Selecciona un espacio en la tabla para gestionar sus horarios de atención y consultar su cronograma.
              </Small>
            </Card>

            <Card
              title={`Horarios de atención · ${actual?.nombre ?? 'Espacio'}`}
              badge={<Chip label={`${horarios.length} franjas`} />}
              style={{ zIndex: 25, overflow: 'visible' }}>
              <Table
                columns={[
                  { title: 'Día de la semana', flex: 1.2 },
                  { title: 'Hora de apertura', flex: 1 },
                  { title: 'Hora de cierre', flex: 1 },
                ]}
                rows={
                  horarios.length > 0
                    ? horarios.map((h) => [
                        h.dia,
                        String(h.hora_apertura || '').slice(0, 5),
                        String(h.hora_cierre || '').slice(0, 5),
                      ])
                    : [['Sin horarios configurados', '--:--', '--:--']]
                }
                selected={horarioSelIdx}
                onSelect={(idx) => {
                  if (horarios[idx]) seleccionarFilaHorario(idx);
                }}
              />

              {esAdmin ? (
                <>
                  <Divider />
                  <T weight="semibold" size={14}>
                    {horarioSeleccionado
                      ? `Modificar o eliminar horario seleccionado (${horarioSeleccionado.dia} ${String(horarioSeleccionado.hora_apertura).slice(0, 5)} – ${String(horarioSeleccionado.hora_cierre).slice(0, 5)})`
                      : 'Agregar nuevo horario de atención '}
                  </T>
                  <Row gap={16} style={{ zIndex: 30, elevation: 30 }}>
                    <SelectField
                      label="Día"
                      value={diaHorario}
                      onChange={setDiaHorario}
                      options={DIAS_SEMANA}
                      style={{ flex: 1.2 }}
                    />
                    <Field
                      label="Hora apertura (HH:MM)"
                      value={aperturaHorario}
                      onChangeText={setAperturaHorario}
                      placeholder="06:00"
                      style={{ flex: 1 }}
                    />
                    <Field
                      label="Hora cierre (HH:MM)"
                      value={cierreHorario}
                      onChangeText={setCierreHorario}
                      placeholder="22:00"
                      style={{ flex: 1 }}
                    />
                  </Row>

                  {avisoHorario ? (
                    <Notice
                      tone={avisoHorario.ok ? 'success' : 'danger'}
                      title={avisoHorario.ok ? 'Horarios actualizados' : 'Validación de horario'}>
                      {avisoHorario.text}
                    </Notice>
                  ) : null}

                  <Row gap={12}>
                    <Button
                      label={
                        guardandoHorario
                          ? 'Guardando...'
                          : horarioSeleccionado
                          ? 'Guardar cambios en horario'
                          : 'Agregar horario'
                      }
                      loading={guardandoHorario}
                      onPress={onGuardarHorario}
                    />
                    {horarioSeleccionado ? (
                      <>
                        <Button
                          label="Eliminar horario"
                          variant="secondary"
                          onPress={onEliminarHorario}
                        />
                        <Button
                          label="Nuevo / Limpiar"
                          variant="secondary"
                          onPress={limpiarFormularioHorario}
                        />
                      </>
                    ) : null}
                  </Row>
                  <Small>
                    Haz clic sobre cualquier fila de la tabla de horarios para editarla o eliminarla.
                  </Small>
                </>
              ) : (
                <View style={{ marginTop: 8 }}>
                  <Small>
                    Modo consulta (Operario): La creación, modificación y eliminación de horarios de atención está reservada al perfil Administrador.
                  </Small>
                </View>
              )}
            </Card>

            <Card
              title="Bloquear horario por mantenimiento o evento"
              badge={<Chip label={actual ? TIPO[actual.tipo] || actual.tipo : '—'} />}
              style={{ zIndex: 10, overflow: 'visible' }}>
              <Row gap={16} style={{ zIndex: 15 }}>
                <DateField label="Fecha" value={fecha} onChange={setFecha} style={{ flex: 1 }} />
                <Field label="Hora de inicio" value={horaInicio} onChangeText={setHoraInicio} style={{ flex: 1 }} />
                <Field label="Hora de fin" value={horaFin} onChangeText={setHoraFin} style={{ flex: 1 }} />
              </Row>
              <Row gap={16} style={{ zIndex: 10 }}>
                <SelectField
                  label="Tipo de bloqueo"
                  value={tipo}
                  onChange={setTipo}
                  options={[
                    { label: 'Mantenimiento', value: 'MANTENIMIENTO' },
                    { label: 'Reserva', value: 'RESERVA' },
                    { label: 'Evento interno', value: 'EVENTO' },
                  ]}
                  style={{ flex: 1 }}
                />
                <Field
                  label="Referencia (reserva_id)"
                  value={reservaId}
                  onChangeText={setReservaId}
                  keyboardType="numeric"
                  style={{ flex: 1 }}
                />
              </Row>
              {aviso ? (
                <Notice tone={aviso.ok ? 'success' : 'danger'} title={aviso.ok ? 'Horario bloqueado' : 'No se pudo bloquear'}>
                  {aviso.text}
                </Notice>
              ) : null}
              <Button label="Bloquear horario" loading={guardando} onPress={bloquear} />
            </Card>
          </>
        }
        aside={
          <Card title="Cronograma de bloqueos">
            <Chip label={actual?.nombre ?? '—'} />
            <Row gap={16}>
              <DateRangeField
                label="Rango del cronograma"
                desde={desde}
                hasta={hasta}
                allowClear={false}
                onChange={(d, h) => {
                  setDesde(d);
                  setHasta(h);
                }}
                style={{ flex: 1 }}
              />
            </Row>
            <Cronograma espacioId={seleccion} desde={desde} hasta={hasta} version={version} />
          </Card>
        }
      />
    </>
  );
}
