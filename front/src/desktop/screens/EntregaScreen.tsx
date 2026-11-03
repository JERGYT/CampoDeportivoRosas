import { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, SelectField, T, Divider, Chip, Row } from '../components/ui';
import { reservasService } from '../../shared/services/reservas';
import { routes } from '../navigation';

export default function EntregaScreen() {
  const params = useLocalSearchParams();
  const [reservas, setReservas] = useState<any[]>([]);
  const [reservaId, setReservaId] = useState<number>(Number(params.id) || 0);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(true);
  const [check3, setCheck3] = useState(true);
  const [check4, setCheck4] = useState(true);

  useEffect(() => {
    reservasService.listarReservas().then((res: any) => {
      if (res?.reservas && res.reservas.length > 0) {
        setReservas(res.reservas);
        const idBuscado = Number(params.id) || res.reservas[0].id;
        setReservaId(idBuscado);
      }
    });
  }, [params.id]);

  const reserva = reservas.find((r) => Number(r.id) === Number(reservaId)) || reservas[0];
  const estadoLimpio = (reserva?.estado && reserva.estado.trim() !== '') ? reserva.estado.toUpperCase() : 'CONFIRMADA';
  const estadoValido = estadoLimpio === 'CONFIRMADA';

  const onConfirmarEntrega = async () => {
    if (!reserva?.id) return;

    if (!check1 || !check2 || !check3 || !check4) {
      setError(true);
      setMensaje('Debes marcar todas las casillas del checklist de implementos.');
      return;
    }

    setCargando(true);
    setError(false);
    try {
      const res = await reservasService.entregar({ reserva_id: Number(reserva.id) });
      setMensaje(res.mensaje || 'Espacio entregado con éxito.');
      
      setTimeout(() => {
        router.push(routes.reservas as any);
      }, 1000);
    } catch (err: any) {
      setError(true);
      setMensaje(err.message || 'Error al procesar la entrega.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <TitleBar
        title="Entrega de espacio e implementos"
        subtitle="Valida el estado de la reserva y constata los implementos antes de habilitar el ingreso al espacio."
      /> 

      <TwoColumns
        main={
          <Card title="Validación y entrega física">
            <SelectField
              label="Seleccionar Reserva para Entrega"
              value={reservaId}
              onChange={(val) => setReservaId(Number(val))}
              options={reservas.map((r) => ({
                label: `R-${String(r.id).padStart(4, '0')} · ${r.cliente?.nombre || 'Cliente'} (${r.fecha} ${r.hora_inicio?.slice(0, 5)}) · Estado: ${(r.estado && r.estado.trim() !== '') ? r.estado : 'CONFIRMADA'}`,
                value: r.id,
              }))}
            />

            {/* Alerta de validación de estado */}
            <View
              style={{
                padding: 12,
                borderRadius: 8,
                marginVertical: 12,
                backgroundColor: estadoValido ? '#ECFDF5' : '#FEF2F2',
                borderColor: estadoValido ? '#10B981' : '#EF4444',
                borderWidth: 1,
              }}
            >
              <T weight="semibold" style={{ color: estadoValido ? '#065F46' : '#991B1B' }}>
                {estadoValido
                  ? `✓ Reserva lista para entrega (Estado: ${estadoLimpio})`
                  : `✕ Esta reserva ya se encuentra en estado "${estadoLimpio}".`}
              </T>
            </View>

            <Divider />

            <T weight="semibold" size={15} style={{ marginBottom: 10 }}>
              Checklist de entrega e implementos:
            </T>

            {[
              { val: check1, set: setCheck1, text: 'Espacio deportivo delimitado, aseado y libre de obstáculos.' },
              { val: check2, set: setCheck2, text: 'Iluminación, redes y arcos/pistas en condiciones operativas.' },
              { val: check3, set: setCheck3, text: 'Implementos deportivos completos entregados al cliente.' },
              { val: check4, set: setCheck4, text: 'Cliente informado del horario y normas de uso responsable.' },
            ].map((item, idx) => (
              <Pressable key={idx} onPress={() => item.set(!item.val)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: item.val ? '#059669' : '#9CA3AF',
                    backgroundColor: item.val ? '#059669' : '#FFFFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10,
                  }}
                >
                  {item.val ? <T style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</T> : null}
                </View>
                <T size={13} style={{ flex: 1, color: '#374151' }}>{item.text}</T>
              </Pressable>
            ))}

            {mensaje && (
              <View style={{ padding: 12, backgroundColor: error ? '#FEE2E2' : '#D1FAE5', borderRadius: 6, marginVertical: 10 }}>
                <T style={{ color: error ? '#991B1B' : '#065F46' }}>{mensaje}</T>
              </View>
            )}

            <Divider />

            <Row gap={16}>
              <Button
                label={cargando ? 'Registrando...' : 'Confirmar entrega y habilitar espacio'}
                variant={!estadoValido || cargando ? 'disabled' : 'primary'}
                loading={cargando}
                onPress={() => {
                  if (estadoValido && !cargando) {
                    onConfirmarEntrega();
                  }
                }}
              />
              <Button
                label="Volver a Reservas"
                variant="secondary"
                onPress={() => {
                  router.push(routes.reservas as any);
                }}
              />
            </Row>
          </Card>
        }
        aside={
          <Card title="Resumen de la reserva" badge={<Chip label={reserva?.estado || '---'} />}>
            <T size={16} weight="semibold">{reserva?.cliente?.nombre || 'Cliente'}</T>
            <T size={13} color="#6B7280">{reserva?.fecha} · {reserva?.hora_inicio?.slice(0, 5)} - {reserva?.hora_fin?.slice(0, 5)}</T>
            <Divider />
            <T size={13} color="#4B5563">Anticipo registrado: ${Number(reserva?.anticipo || 0).toLocaleString('es-CO')}</T>
            <T size={13} color="#4B5563">Saldo pendiente: ${(120000 - Number(reserva?.anticipo || 0)).toLocaleString('es-CO')}</T>
          </Card>
        }
      />
    </>
  );
}