import { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, SelectField, Field, T, Divider, Chip, Row } from '../components/ui';
import { reservasService } from '../../shared/services/reservas';
import { formatCOP } from '../../shared/utils/format';
import { routes } from '../navigation';

const CATALOGO_DANOS = [
  { id: 'red', concepto: 'Rotura de red / malla deportiva', valor: 40000 },
  { id: 'balon', concepto: 'Balón extraviado o reventado', valor: 50000 },
  { id: 'luz', concepto: 'Daño en luminaria / reflector', valor: 80000 },
  { id: 'aseo', concepto: 'Aseo especial por residuos o botellas', valor: 30000 },
  { id: 'tejo', concepto: 'Pérdida o rotura de implemento de tejo', valor: 25000 },
];

export default function DanosScreen() {
  const params = useLocalSearchParams();
  const [reservas, setReservas] = useState<any[]>([]);
  const [reservaId, setReservaId] = useState<number>(Number(params.id) || 0);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [danoPersonalizado, setDanoPersonalizado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    reservasService.listarReservas().then((res: any) => {
      if (res?.reservas && res.reservas.length > 0) {
        setReservas(res.reservas);
        if (!reservaId) setReservaId(res.reservas[0].id);
      }
    });
  }, []);

  const reserva = reservas.find((r) => r.id === reservaId) || reservas[0];

  const totalCatalogo = seleccionados.reduce((sum, id) => {
    const item = CATALOGO_DANOS.find((c) => c.id === id);
    return sum + (item?.valor || 0);
  }, 0);

  const totalDanos = totalCatalogo + (parseFloat(danoPersonalizado) || 0);

  const onRegistrarDanos = async () => {
    setCargando(true);
    try {
      await reservasService.registrarDanos({
        reserva_id: reserva.id,
        danos: totalDanos,
      });
      router.push(`${routes.liquidacion}?id=${reserva.id}` as any);
    } catch (err: any) {
      setMensaje(err.message || 'Error al registrar los daños.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <TitleBar
        title="Valoración y registro de daños"
        subtitle="Calcula y registra el costo de reparación de daños o reposición de implementos."
      />

      <TwoColumns
        main={
          <Card title="Cálculo de daños al espacio e implementos">
            <SelectField
              label="Reserva a tasar"
              value={reservaId}
              onChange={(val) => setReservaId(Number(val))}
              options={reservas.map((r) => ({
                label: `R-${String(r.id).padStart(4, '0')} · ${r.cliente?.nombre || 'Cliente'} (${r.fecha})`,
                value: r.id,
              }))}
            />

            <Divider />

            <T weight="semibold" size={15} style={{ marginBottom: 12 }}>
              Catálogo de reposición y reparaciones:
            </T>

            {CATALOGO_DANOS.map((d) => {
              const activo = seleccionados.includes(d.id);
              return (
                <Pressable
                  key={d.id}
                  onPress={() => {
                    setSeleccionados(
                      activo ? seleccionados.filter((id) => id !== d.id) : [...seleccionados, d.id]
                    );
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: activo ? '#EF4444' : '#E5E7EB',
                    backgroundColor: activo ? '#FEF2F2' : '#FFFFFF',
                    marginBottom: 8,
                  }}
                >
                  <T size={13} style={{ flex: 1, color: activo ? '#991B1B' : '#374151', fontWeight: activo ? 'bold' : 'normal' }}>
                    {activo ? '✓ ' : '○ '} {d.concepto}
                  </T>
                  <T size={13} weight="semibold" style={{ color: activo ? '#991B1B' : '#4B5563' }}>
                    +{formatCOP(d.valor)}
                  </T>
                </Pressable>
              );
            })}

            <Field
              label="Otro daño o cobro adicional · COP (opcional)"
              value={danoPersonalizado}
              onChangeText={setDanoPersonalizado}
              placeholder="0"
            />

            {mensaje && (
              <View style={{ padding: 12, backgroundColor: '#FEE2E2', borderRadius: 6, marginVertical: 8 }}>
                <T color="#991B1B">{mensaje}</T>
              </View>
            )}

            <Divider />

            <Row gap={16} style={{ alignItems: 'center' }}>
              <Button 
                label={cargando ? 'Registrando...' : 'Registrar daños y continuar a Liquidación>'}
                loading={cargando}
                onPress={() => {
                  onRegistrarDanos();
                }}
              />
            </Row>
          </Card>
        }
        aside={
          <Card title="Liquidación de daños">
            <T size={14} color="#6B7280">Subtotal catálogo:</T>
            <T size={16} weight="semibold">{formatCOP(totalCatalogo)}</T>

            <T size={14} color="#6B7280" style={{ marginTop: 8 }}>Daño adicional:</T>
            <T size={16} weight="semibold">{formatCOP(parseFloat(danoPersonalizado) || 0)}</T>

            <Divider />

            <T size={14} color="#111827" weight="bold">Total cobro por daños:</T>
            <T size={22} weight="bold" color="#DC2626">{formatCOP(totalDanos)}</T>
            <T size={12} color="#6B7280" style={{ marginTop: 4 }}>
              Este valor se sumará al saldo pendiente en el cobro final.
            </T>
          </Card>
        }
      />
    </>
  );
}