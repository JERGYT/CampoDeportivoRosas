import { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, SelectField, T, Divider, Chip, Row } from '../components/ui';
import { reservasService } from '../../shared/services/reservas';
import { routes } from '../navigation';

export default function RecepcionScreen() {
  const params = useLocalSearchParams();
  const [reservas, setReservas] = useState<any[]>([]);
  const [reservaId, setReservaId] = useState<number>(Number(params.id) || 0);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(true);
  const [check3, setCheck3] = useState(true);
  const [hayDanos, setHayDanos] = useState(false);

  useEffect(() => {
    reservasService.listarReservas().then((res: any) => {
      if (res?.reservas && res.reservas.length > 0) {
        setReservas(res.reservas);
        if (!reservaId) setReservaId(res.reservas[0].id);
      }
    });
  }, []);

  const reserva = reservas.find((r) => r.id === reservaId) || reservas[0];

  const onConfirmarRecepcion = async () => {
    setCargando(true);
    try {
      await reservasService.recibir({ reserva_id: reserva.id });
      if (hayDanos) {
        router.push(`${routes.danos}?id=${reserva.id}` as any);
      } else {
        router.push(`${routes.liquidacion}?id=${reserva.id}` as any);
      }
    } catch (err: any) {
      setMensaje(err.message || 'Error al registrar la recepción.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <TitleBar
        title="Recepción del espacio"
        subtitle="Verifica el estado del espacio y de los implementos al finalizar la sesión con checklist."
      />

      <TwoColumns
        main={
          <Card title="Checklist de recepción">
            <SelectField
              label="Seleccionar Reserva en Recepción"
              value={reservaId}
              onChange={(val) => setReservaId(Number(val))}
              options={reservas.map((r) => ({
                label: `R-${String(r.id).padStart(4, '0')} · ${r.cliente?.nombre || 'Cliente'} (${r.fecha}) · Estado: ${r.estado}`,
                value: r.id,
              }))}
            />

            <Divider />

            <T weight="semibold" size={15} style={{ marginBottom: 10 }}>
              Criterios de verificación al desocupar:
            </T>

            {[
              { val: check1, set: setCheck1, text: 'Desalojo de la cancha dentro de la franja horaria pactada.' },
              { val: check2, set: setCheck2, text: 'Devolución completa de los implementos deportivos prestados.' },
              { val: check3, set: setCheck3, text: 'Instalaciones entregadas en condiciones adecuadas de aseo.' },
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

            <Divider />

            <T weight="semibold" size={14} style={{ marginBottom: 8 }}>
              Evaluación de daños / novedades:
            </T>

            <Row gap={12}>
              <Pressable
                onPress={() => setHayDanos(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: !hayDanos ? '#059669' : '#D1D5DB',
                  backgroundColor: !hayDanos ? '#ECFDF5' : '#FFFFFF',
                  alignItems: 'center',
                }}
              >
                <T weight="semibold" style={{ color: !hayDanos ? '#065F46' : '#4B5563' }}>
                  ✓ Todo en buen estado (Sin daños)
                </T>
              </Pressable>

              <Pressable
                onPress={() => setHayDanos(true)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: hayDanos ? '#DC2626' : '#D1D5DB',
                  backgroundColor: hayDanos ? '#FEF2F2' : '#FFFFFF',
                  alignItems: 'center',
                }}
              >
                <T weight="semibold" style={{ color: hayDanos ? '#991B1B' : '#4B5563' }}>
                  ⚠ Presenta daños o faltantes
                </T>
              </Pressable>
            </Row>

            {mensaje && (
              <View style={{ padding: 12, backgroundColor: '#FEE2E2', borderRadius: 6, marginTop: 12 }}>
                <T color="#991B1B">{mensaje}</T>
              </View>
            )}

            <Divider />

            <Row gap={16}>
              <Button
                label={
                  cargando
                    ? 'Procesando...'
                    : hayDanos
                    ? 'Registrar recepción y valorar daños >'
                    : 'Recepción conforme y proceder a liquidar >'
                }
                loading={cargando}
                onPress={() => {
                  onConfirmarRecepcion();
                }}
              />
            </Row>
          </Card>
        }
        aside={
          <Card title="Estado del servicio" badge={<Chip label={reserva?.estado || '---'} />}>
            <T size={16} weight="semibold">{reserva?.cliente?.nombre || 'Cliente'}</T>
            <T size={13} color="#6B7280">{reserva?.fecha}</T>
            <Divider />
            <T size={13} color="#4B5563">• Si no hay daños, la liquidación será directa.</T>
            <T size={13} color="#4B5563">• Si hay daños, se añadirán al saldo pendiente.</T>
          </Card>
        }
      />
    </>
  );
}