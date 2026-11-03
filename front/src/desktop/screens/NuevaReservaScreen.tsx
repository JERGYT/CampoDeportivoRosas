import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, Field, SelectField, T, Divider, Chip, Row } from '../components/ui';
import { DateTimeField } from '../components/DatePicker';
import { disponibilidadService, type Espacio } from '../../shared/services/disponibilidad';
import { reservasService } from '../../shared/services/reservas';

function AlertBox({ tone, title, description }: { tone: 'success' | 'danger'; title: string; description: string }) {
  const isSuccess = tone === 'success';
  return (
    <View
      style={{
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: isSuccess ? '#ECFDF5' : '#FEF2F2',
        borderColor: isSuccess ? '#10B981' : '#EF4444',
        marginVertical: 8,
      }}
    >
      <T weight="semibold" style={{ color: isSuccess ? '#065F46' : '#991B1B', marginBottom: 4 }}>
        {isSuccess ? '✓ ' : 'ⓘ '} {title}
      </T>
      <T size={13} style={{ color: isSuccess ? '#047857' : '#B91C1C' }}>
        {description}
      </T>
    </View>
  );
}

export default function NuevaReservaScreen() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [clienteId, setClienteId] = useState<number>(0);
  const [espacioId, setEspacioId] = useState<number>(1);
  const [entidad, setEntidad] = useState('');

  // Estados vacíos por defecto (sin datos automáticos quemados)
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [anticipo, setAnticipo] = useState('');

  const [disponible, setDisponible] = useState<boolean | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [mensajeResultado, setMensajeResultado] = useState<string | null>(null);
  const [esError, setEsError] = useState(false);

  // HU-06: Sugerencias alternativas
  const [sugerencias, setSugerencias] = useState<any[]>([]);

  useEffect(() => {
    reservasService.listarClientes().then((r) => {
      if (r?.clientes && r.clientes.length > 0) {
        setClientes(r.clientes);
        setClienteId(r.clientes[0].id);
      }
    });

    disponibilidadService.obtenerEspacios().then((esp) => {
      if (esp && esp.length > 0) {
        setEspacios(esp);
        setEspacioId(esp[0].id);
      }
    });
  }, []);

  const clienteSeleccionado = clientes.find((c) => c.id === clienteId);
  const tipoCliente = clienteSeleccionado?.tipo || 'PARTICULAR';

  const onConsultar = async () => {
    if (!fecha || !horaInicio || !horaFin) {
      setEsError(true);
      setMensajeResultado('Por favor selecciona una fecha y escribe hora de inicio y hora de fin.');
      return;
    }

    setConsultando(true);
    setMensajeResultado(null);
    setSugerencias([]);
    try {
      const hIni = horaInicio.length === 5 ? `${horaInicio}:00` : horaInicio;
      const hFin = horaFin.length === 5 ? `${horaFin}:00` : horaFin;

      const res: any = await disponibilidadService.consultar({
        espacio_id: espacioId,
        fecha,
        hora_inicio: hIni,
        hora_fin: hFin,
        tipo: tipoCliente,
      });

      setDisponible(res.disponible);
      if (!res.disponible && res.sugerencias && res.sugerencias.length > 0) {
        setSugerencias(res.sugerencias);
      }
    } catch (err: any) {
      console.error(err);
      setDisponible(false);
    } finally {
      setConsultando(false);
    }
  };

  const onConfirmar = async () => {
    if (!fecha || !horaInicio || !horaFin) {
      setEsError(true);
      setMensajeResultado('Por favor completa la fecha y las horas antes de confirmar.');
      return;
    }

    setConfirmando(true);
    setMensajeResultado(null);
    setEsError(false);
    try {
      const anticipoNum = parseFloat(anticipo) || 0;
      const hIni = horaInicio.length === 5 ? `${horaInicio}:00` : horaInicio;
      const hFin = horaFin.length === 5 ? `${horaFin}:00` : horaFin;

      if (anticipoNum > 120000) {
        setEsError(true);
        setMensajeResultado('El anticipo no puede ser superior al costo total del alquiler ($120.000 COP).');
        setConfirmando(false);
        return;
      }

      const res: any = await reservasService.confirmarReserva({
        espacio_id: espacioId,
        cliente_id: clienteId,
        tipo: tipoCliente,
        entidad_organizadora: entidad,
        fecha,
        hora_inicio: hIni,
        hora_fin: hFin,
        anticipo: anticipoNum,
      });

      setEsError(false);
      setMensajeResultado(res.mensaje);
      setDisponible(null);
      setSugerencias([]);
    } catch (err: any) {
      setEsError(true);
      setMensajeResultado(err.message || 'Error al confirmar la reserva.');
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <>
      <TitleBar
        title="Nueva reserva"
        subtitle="Elige cliente, espacio y franja; consulta disponibilidad y confirma la reserva con o sin anticipo."
      />

      <TwoColumns
        main={
          <Card title="Datos de la reserva" style={{ overflow: 'visible' }}>
            {/* Fila 1: zIndex alto para que los desplegables no queden tapados por las filas de abajo */}
            <Row gap={16} style={{ zIndex: 100, elevation: 100, position: 'relative' }}>
              <SelectField
                label="Cliente"
                value={clienteId}
                onChange={(val) => setClienteId(Number(val))}
                options={clientes.map((c) => ({ label: `${c.nombre} (${c.tipo})`, value: c.id }))}
                style={{ flex: 1 }}
              />
              <SelectField
                label="Espacio"
                value={espacioId}
                onChange={(val) => setEspacioId(Number(val))}
                options={espacios.map((e) => ({ label: e.nombre, value: e.id }))}
                style={{ flex: 1 }}
              />
            </Row>

            {/* Fila 2: zIndex intermedio */}
            <View style={{ zIndex: 50, elevation: 50, position: 'relative', marginTop: 14 }}>
              <Field
                label="Entidad organizadora · opcional"
                value={entidad}
                onChangeText={setEntidad}
                placeholder="Nombre del torneo o institución"
              />
            </View>

            {/* Fila 3: DateTimeField con selector de fecha funcional */}
            <Row gap={16} style={{ zIndex: 10, elevation: 10, position: 'relative', marginTop: 14 }}>
              <DateTimeField
                label="Fecha"
                fecha={fecha}
                hora={horaInicio || ''}
                onChange={(nuevaFecha: string, nuevaHora?: string) => {
                  setFecha(nuevaFecha);
                  if (nuevaHora && nuevaHora.trim()) {
                    setHoraInicio(nuevaHora.trim());
                  }
                }}
                style={{ flex: 1.2 }}
              />
              <Field
                label="Hora de inicio"
                value={horaInicio}
                onChangeText={setHoraInicio}
                placeholder="Ej: 14:00"
                style={{ flex: 1 }}
              />
              <Field
                label="Hora de fin"
                value={horaFin}
                onChangeText={setHoraFin}
                placeholder="Ej: 16:00"
                style={{ flex: 1 }}
              />
              <Field
                label="Anticipo · COP"
                value={anticipo}
                onChangeText={setAnticipo}
                placeholder="0"
                style={{ flex: 1 }}
              />
            </Row>
            <T size={12} color="#6B7280" style={{ marginTop: 4, marginBottom: 12 }}>
              El anticipo es opcional: vacío o 0 confirma la reserva dejando constancia del saldo pendiente.
            </T>

            {/* Alerta de disponibilidad */}
            {disponible === true && (
              <AlertBox
                tone="success"
                title="Franja disponible"
                description={`El horario seleccionado (${horaInicio} – ${horaFin}) está libre para reservar.`}
              />
            )}

            {disponible === false && (
              <View style={{ gap: 10 }}>
                <AlertBox
                  tone="danger"
                  title="Franja no disponible"
                  description={`La franja de ${horaInicio || '--:--'} a ${horaFin || '--:--'} se encuentra ocupada o fuera del horario de atención.`}
                />

                {/* HU-06: Sugerencias y aceptación de alternativa */}
                {sugerencias.length > 0 && (
                  <View style={{ padding: 14, backgroundColor: '#FEF3C7', borderRadius: 8, borderWidth: 1, borderColor: '#F59E0B' }}>
                    <T weight="semibold" style={{ color: '#92400E', marginBottom: 8 }}>
                      💡 Alternativas sugeridas disponibles:
                    </T>
                    {sugerencias.map((sug, i) => (
                      <Row key={i} gap={12} style={{ alignItems: 'center', marginBottom: 6 }}>
                        <T size={13} style={{ flex: 1, color: '#78350F' }}>
                          • {sug.descripcion}
                        </T>
                        <Button
                          label="Aceptar alternativa"
                          variant="secondary"
                          onPress={() => {
                            setFecha(sug.fecha);
                            setHoraInicio(sug.hora_inicio.slice(0, 5));
                            setHoraFin(sug.hora_fin.slice(0, 5));
                            setDisponible(true);
                            setSugerencias([]);
                          }}
                        />
                      </Row>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Mensajes de confirmación HU-08 / HU-09 */}
            {mensajeResultado && (
              <AlertBox
                tone={esError ? 'danger' : 'success'}
                title={esError ? 'Notificación' : 'Confirmación de reserva'}
                description={mensajeResultado}
              />
            )}

            <Divider />

            <Row gap={16}>
              <Button
                label={consultando ? 'Consultando...' : 'Consultar disponibilidad'}
                variant="secondary"
                onPress={onConsultar}
              />
              <Button
                label={confirmando ? 'Confirmando...' : 'Confirmar reserva'}
                onPress={onConfirmar}
              />
            </Row>
          </Card>
        }
        aside={
          <Card title="Regla del perfil" badge={<Chip label={tipoCliente} />}>
            <T size={14} weight="semibold" lh={1.45}>
              {tipoCliente === 'ESCUELA_FORMACION' ? 'Lunes a sábado' : 'Sábados y domingos'}
            </T>
            <T size={13} color="#6B7280" lh={1.45}>
              Horario de atención general: lunes a domingo, 06:00 – 22:00.
            </T>
            <Divider />
            <T size={14} weight="semibold">Condiciones de pago:</T>
            <T size={13} color="#6B7280" lh={1.45}>
              • Con anticipo: la reserva queda asegurada inmediatamente.
            </T>
            <T size={13} color="#6B7280" lh={1.45}>
              • Sin anticipo: se confirma dejando constancia del saldo pendiente total.
            </T>
          </Card>
        }
      />
    </>
  );
}