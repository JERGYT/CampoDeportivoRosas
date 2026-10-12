import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApiError, reservasService, type TipoCliente } from '@/shared/services';
import { colors, radius } from '@/shared/theme/tokens';

import { TitleBar, TwoColumns } from '../components/composites';
import { Button, Card, Chip, Divider, Field, FieldLabel, FooterNote, Notice, Row, Small, T } from '../components/ui';
import { routes } from '../navigation';

type Perfil = Extract<TipoCliente, 'ESCUELA_FORMACION' | 'CAMPEONATO' | 'PARTICULAR'>;

const PERFILES: { value: Perfil; label: string }[] = [
  { value: 'ESCUELA_FORMACION', label: 'Escuela de Formación' },
  { value: 'CAMPEONATO', label: 'Campeonato' },
  { value: 'PARTICULAR', label: 'Particular' },
];

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Reglas de Reserva::validarDiaPermitido en la rama back. */
const REGLAS: Record<Perfil, { titulo: string; texto: string; habilitados: boolean[]; leyenda: [string, string]; aviso: string }> = {
  ESCUELA_FORMACION: {
    titulo: 'Lunes a sábado',
    texto: 'Este perfil puede reservar de lunes a sábado. Los domingos no están habilitados.',
    habilitados: [true, true, true, true, true, true, false],
    leyenda: ['L–S · Habilitados', 'D · No habilitado'],
    aviso: 'Domingos no habilitados',
  },
  CAMPEONATO: {
    titulo: 'Sábado y domingo',
    texto: 'Este perfil puede reservar sábados y domingos. De lunes a viernes no está habilitado.',
    habilitados: [false, false, false, false, false, true, true],
    leyenda: ['S–D · Habilitados', 'L–V · No habilitados'],
    aviso: 'Lunes a viernes no habilitados',
  },
  PARTICULAR: {
    titulo: 'Sábado y domingo',
    texto: 'Este perfil puede reservar sábados y domingos. De lunes a viernes no está habilitado.',
    habilitados: [false, false, false, false, false, true, true],
    leyenda: ['S–D · Habilitados', 'L–V · No habilitados'],
    aviso: 'Lunes a viernes no habilitados',
  },
};

export default function AgregarClienteScreen() {
  const [nombre, setNombre] = useState('Liga Juvenil Boyacá');
  const [telefono, setTelefono] = useState('3154443322');
  const [correo, setCorreo] = useState('liga@boyaca.example');
  const [tipo, setTipo] = useState<Perfil>('ESCUELA_FORMACION');
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null);

  const regla = REGLAS[tipo];
  const etiqueta = PERFILES.find((p) => p.value === tipo)!.label;
  const otros = tipo === 'ESCUELA_FORMACION'
    ? { titulo: 'Campeonato y Particular', texto: 'Sábado y domingo.' }
    : { titulo: 'Escuela de Formación', texto: 'Lunes a sábado.' };

  // POST /view/createcliente (ms-reservas)
  const guardar = async () => {
    setResultado(null);
    if (!nombre.trim() || !telefono.trim()) {
      setResultado({ ok: false, mensaje: 'Nombre, teléfono y tipo son obligatorios' });
      return;
    }
    setGuardando(true);
    try {
      const r = await reservasService.crearCliente({
        nombre: nombre.trim(),
        telefono: telefono.replace(/\s/g, ''),
        tipo,
        correo: correo.trim() || null,
      });
      setResultado({ ok: true, mensaje: `${r.mensaje} · Cliente #${r.cliente_id}` });
    } catch (e) {
      setResultado({ ok: false, mensaje: e instanceof ApiError ? e.message : 'No se pudo registrar' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <TitleBar title="Agregar cliente" subtitle="Completa los datos de contacto y elige el perfil para sus futuras reservas." />
      <TwoColumns
        main={
          <Card>
            <View style={{ gap: 6 }}>
              <T size={20} weight="semibold" lh={1.45}>
                Datos del cliente
              </T>
              <T color={colors.textMuted} lh={1.45}>
                Revisa la información antes de guardar el cliente.
              </T>
            </View>
            <Divider />
            <Field label="Nombre" value={nombre} onChangeText={setNombre} helper="Nombre de la escuela, organización o persona." />
            <Row gap={16}>
              <Field
                label="Teléfono"
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
                helper="Número de contacto del cliente, sin espacios."
                style={{ flex: 1 }}
              />
              <Field
                label="Correo"
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                helper="Correo de contacto del cliente."
                style={{ flex: 1 }}
              />
            </Row>
            <View style={{ gap: 7 }}>
              <FieldLabel>Tipo de cliente</FieldLabel>
              <Row gap={10}>
                {PERFILES.map((p) => {
                  const sel = p.value === tipo;
                  return (
                    <Pressable key={p.value} onPress={() => setTipo(p.value)} style={[styles.radio, sel && styles.radioSel]}>
                      <View style={[styles.radioDot, sel && { borderColor: colors.navy }]}>
                        {sel ? <View style={styles.radioInner} /> : null}
                      </View>
                      <T weight={sel ? 'semibold' : 'regular'} color={sel ? colors.navy : colors.text}>
                        {p.label}
                      </T>
                    </Pressable>
                  );
                })}
              </Row>
              <Small>El perfil determina los días habilitados para reservar. Consulta la regla a la derecha.</Small>
            </View>
            <View style={styles.infoBox}>
              <T weight="semibold" color={colors.navy} lh={1.45}>
                El registro del cliente no crea una reserva
              </T>
              <T color={colors.navy} lh={1.45}>
                La fecha, el espacio y el horario se eligen por separado desde Reservar.
              </T>
            </View>
            {resultado ? (
              <Notice tone={resultado.ok ? 'success' : 'danger'} title={resultado.ok ? 'Cliente guardado' : 'No se pudo guardar'}>
                {resultado.mensaje}
              </Notice>
            ) : null}
            <Divider />
            <Row gap={12} align="center">
              <View style={{ flex: 1 }}>
                <Small>Verifica los datos de contacto.</Small>
              </View>
              <Button label="Cancelar" variant="secondary" onPress={() => router.navigate(routes.reservas)} />
              <Button label="Guardar cliente" onPress={guardar} loading={guardando} />
            </Row>
          </Card>
        }
        aside={
          <>
            <Card title="Regla del perfil seleccionado">
              <Chip label={etiqueta} />
              <T size={18} weight="semibold" lh={1.45}>
                {regla.titulo}
              </T>
              <T color={colors.textMuted} lh={1.45}>
                {regla.texto}
              </T>
              <Row gap={10}>
                {DIAS.map((d, i) => (
                  <View key={d} style={[styles.day, !regla.habilitados[i] && styles.dayOff]}>
                    <T
                      size={13}
                      weight="semibold"
                      color={regla.habilitados[i] ? colors.navy : colors.textMuted}
                      style={!regla.habilitados[i] ? { textDecorationLine: 'line-through' } : undefined}>
                      {d}
                    </T>
                  </View>
                ))}
              </Row>
              <Row gap={18}>
                <Small>{regla.leyenda[0]}</Small>
                <Small>{regla.leyenda[1]}</Small>
              </Row>
              <Notice title={regla.aviso}>{`Esta regla se aplica a las reservas de ${etiqueta}.`}</Notice>
            </Card>
            <Card title="Otros perfiles">
              <View style={{ gap: 4, marginTop: -6 }}>
                <T weight="semibold" lh={1.45}>
                  {otros.titulo}
                </T>
                <T size={13} color={colors.textMuted} lh={1.45}>
                  {otros.texto}
                </T>
              </View>
              <Divider />
              <T size={13} color={colors.textMuted} lh={1.45}>
                El sábado está disponible para todos los perfiles, sin prioridad. La reserva depende de la disponibilidad del espacio.
              </T>
            </Card>
          </>
        }
      />
      <FooterNote />
    </>
  );
}

const styles = StyleSheet.create({
  radio: {
    flex: 1,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  radioSel: { backgroundColor: colors.chip, borderColor: colors.navy },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.navy },
  infoBox: { backgroundColor: colors.chip, borderRadius: radius.field, padding: 16, gap: 2 },
  day: {
    width: 44,
    height: 40,
    borderRadius: radius.field,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOff: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
});
