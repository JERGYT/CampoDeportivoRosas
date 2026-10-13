/**
 * Espacios (menú "Espacios"). No tiene mockup desktop propio: se arma con el mismo sistema
 * de diseño para cubrir los endpoints de ms-disponibilidad:
 *   GET /view/espacios · GET /view/cronograma · POST /view/bloquear
 */
import { useEffect, useState } from 'react';

import { ApiError, disponibilidadService, type Espacio } from '@/shared/services';
import { toBackTime } from '@/shared/utils/format';

import { TitleBar, TwoColumns } from '../components/composites';
import { Cronograma } from '../components/Cronograma';
import { Button, Card, Chip, Field, Notice, Row, SelectField, Small, Table } from '../components/ui';

const TIPO: Record<Espacio['tipo'], string> = {
  FUTBOL: 'Fútbol',
  TEJO: 'Tejo',
  SALON_COMUNAL: 'Salón de Eventos',
  BARBECUE: 'Zona BBQ',
};

function caracteristicas(e: Espacio): string {
  if (e.tipo === 'FUTBOL') return `${e.jugadores_por_equipo ?? '–'} por equipo · ${e.dimensiones ?? ''}`;
  if (e.tipo === 'TEJO') return `${e.numero_carriles ?? '–'} carriles`;
  if (e.tipo === 'SALON_COMUNAL') return e.tiene_sonido ? 'Con sonido' : 'Sin sonido';
  return `${e.numero_asadores ?? '–'} asadores · ${e.tiene_mesas ? 'con mesas' : 'sin mesas'}`;
}

export default function EspaciosScreen() {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [seleccion, setSeleccion] = useState(1);
  const [desde, setDesde] = useState('2026-10-12');
  const [hasta, setHasta] = useState('2026-10-25');
  const [version, setVersion] = useState(0);

  const [reservaId, setReservaId] = useState('99');
  const [fecha, setFecha] = useState('2026-10-28');
  const [horaInicio, setHoraInicio] = useState('14:00');
  const [horaFin, setHoraFin] = useState('16:00');
  const [tipo, setTipo] = useState('MANTENIMIENTO');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; text: string } | null>(null);

  // GET /view/espacios
  useEffect(() => {
    disponibilidadService.listarEspacios().then((r) => setEspacios(r.espacios)).catch(() => setEspacios([]));
  }, []);

  const actual = espacios.find((e) => e.id === seleccion);

  // POST /view/bloquear — 409 si la franja no está disponible
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
      <TitleBar title="Espacios" subtitle="Consulta los espacios activos, su cronograma de bloqueos y reserva franjas para mantenimiento." />
      <TwoColumns
        main={
          <>
            <Card title="Espacios activos" badge={<Chip label={`${espacios.length} espacios`} />}>
              <Table
                columns={[{ title: 'Espacio', flex: 1.6 }, { title: 'Tipo' }, { title: 'Capacidad' }, { title: 'Características', flex: 1.4 }]}
                rows={espacios.map((e) => [e.nombre, TIPO[e.tipo], `${e.capacidad} personas`, caracteristicas(e)])}
                selected={espacios.findIndex((e) => e.id === seleccion)}
                onSelect={(i) => setSeleccion(espacios[i].id)}
              />
              <Small>Selecciona un espacio para ver su cronograma. Horario de atención: lunes a domingo, 06:00 – 22:00.</Small>
            </Card>
            <Card title="Bloquear horario" badge={<Chip label={actual ? TIPO[actual.tipo] : '—'} />} style={{ zIndex: 10 }}>
              <Row gap={16} style={{ zIndex: 10 }}>
                <Field label="Fecha (AAAA-MM-DD)" value={fecha} onChangeText={setFecha} style={{ flex: 1 }} />
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
                <Field label="Referencia (reserva_id)" value={reservaId} onChangeText={setReservaId} keyboardType="numeric" style={{ flex: 1 }} />
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
              <Field label="Desde" value={desde} onChangeText={setDesde} style={{ flex: 1 }} />
              <Field label="Hasta" value={hasta} onChangeText={setHasta} style={{ flex: 1 }} />
            </Row>
            <Cronograma espacioId={seleccion} desde={desde} hasta={hasta} version={version} />
          </Card>
        }
      />
    </>
  );
}
