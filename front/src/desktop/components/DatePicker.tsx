/**
 * Selectores de fecha con calendario: una fecha, un rango, fecha + hora y varias fechas.
 * Todas las fechas viajan como texto "YYYY-MM-DD" (el formato DATE del back) y se calculan
 * en UTC para no depender de la zona horaria del equipo.
 */
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius } from '@/shared/theme/tokens';
import { formatFecha } from '@/shared/utils/format';

import { Button, FieldLabel, Row, T } from './ui';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const FIELD_MIN = 180;

const pad = (n: number) => String(n).padStart(2, '0');
const isoDe = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const esIso = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Fecha de hoy en el equipo, como "YYYY-MM-DD". */
export function hoyIso(): string {
  const d = new Date();
  return isoDe(d.getFullYear(), d.getMonth(), d.getDate());
}

type Marca = 'unico' | 'inicio' | 'fin' | 'entre' | null;

/** Cuadrícula mensual (lunes primero) con navegación entre meses. */
function Calendario({ inicial, marca, onPick }: { inicial: string; marca: (iso: string) => Marca; onPick: (iso: string) => void }) {
  const base = esIso(inicial) ? inicial : hoyIso();
  const [mes, setMes] = useState({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 });
  const hoy = hoyIso();

  const primerDia = (new Date(Date.UTC(mes.y, mes.m, 1)).getUTCDay() + 6) % 7; // 0 = lunes
  const diasMes = new Date(Date.UTC(mes.y, mes.m + 1, 0)).getUTCDate();
  const celdas: (number | null)[] = [...Array(primerDia).fill(null), ...Array.from({ length: diasMes }, (_, i) => i + 1)];
  while (celdas.length % 7) celdas.push(null);

  const mover = (delta: number) =>
    setMes(({ y, m }) => {
      const t = m + delta;
      return { y: y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
    });

  return (
    <View style={{ gap: 10 }}>
      <Row align="center" wrap={false}>
        <Pressable accessibilityLabel="Mes anterior" onPress={() => mover(-1)} style={styles.nav}>
          <ChevronLeft size={18} color={colors.text} />
        </Pressable>
        <T weight="semibold" style={{ flex: 1, textAlign: 'center' }}>{`${MESES[mes.m]} ${mes.y}`}</T>
        <Pressable accessibilityLabel="Mes siguiente" onPress={() => mover(1)} style={styles.nav}>
          <ChevronRight size={18} color={colors.text} />
        </Pressable>
      </Row>
      <View style={styles.grid}>
        {DIAS.map((d) => (
          <View key={d} style={styles.cell}>
            <T size={12} weight="semibold" color={colors.textMuted}>
              {d}
            </T>
          </View>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <View key={`v${i}`} style={styles.cell} />;
          const iso = isoDe(mes.y, mes.m, dia);
          const m = marca(iso);
          const fuerte = m === 'unico' || m === 'inicio' || m === 'fin';
          return (
            <View key={iso} style={[styles.cell, m === 'entre' && { backgroundColor: colors.chip }, m === 'inicio' && styles.rangoIni, m === 'fin' && styles.rangoFin]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={formatFecha(iso)}
                onPress={() => onPick(iso)}
                style={(s) => [
                  styles.day,
                  (s as { hovered?: boolean }).hovered && !fuerte && { backgroundColor: colors.chip },
                  iso === hoy && !fuerte && { borderWidth: 1, borderColor: colors.primary },
                  fuerte && { backgroundColor: colors.primary },
                ]}>
                <T size={13} weight={fuerte ? 'semibold' : 'regular'} color={fuerte ? colors.white : colors.text}>
                  {dia}
                </T>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Ventana flotante centrada que contiene el calendario. */
function Ventana({ visible, onClose, titulo, children }: { visible: boolean; onClose: () => void; titulo: string; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* El panel detiene el toque para que no cierre la ventana. */}
        <Pressable style={styles.panel} onPress={() => {}}>
          <T size={16} weight="semibold">
            {titulo}
          </T>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Caja con el aspecto de los demás campos que abre el calendario. */
function Disparador({ label, texto, vacio, onPress, helper, style }: { label?: string; texto: string; vacio: boolean; onPress: () => void; helper?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: 7, minWidth: FIELD_MIN }, style]}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={label ?? 'Elegir fecha'} onPress={onPress} style={styles.input}>
        <Row gap={8} align="center" wrap={false}>
          <T lh={1.45} numberOfLines={1} color={vacio ? colors.textMuted : colors.text} style={{ flex: 1 }}>
            {texto}
          </T>
          <CalendarDays size={16} color={colors.textMuted} />
        </Row>
      </Pressable>
      {helper ? (
        <T size={12} color={colors.textMuted} lh={1.45}>
          {helper}
        </T>
      ) : null}
    </View>
  );
}

/** Una sola fecha. */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Elegir fecha',
  helper,
  style,
}: {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  helper?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Disparador label={label} texto={esIso(value) ? formatFecha(value) : placeholder} vacio={!esIso(value)} onPress={() => setOpen(true)} helper={helper} style={style} />
      <Ventana visible={open} onClose={() => setOpen(false)} titulo={label ?? 'Elegir fecha'}>
        <Calendario
          inicial={value}
          marca={(iso) => (iso === value ? 'unico' : null)}
          onPick={(iso) => {
            onChange(iso);
            setOpen(false);
          }}
        />
        <Row gap={10}>
          <Button label="Hoy" variant="secondary" onPress={() => { onChange(hoyIso()); setOpen(false); }} />
          <Button label="Cerrar" variant="secondary" onPress={() => setOpen(false)} />
        </Row>
      </Ventana>
    </>
  );
}

/** Rango de fechas: primer toque marca el inicio, el segundo el fin. Vacío = sin límite. */
export function DateRangeField({
  label,
  desde,
  hasta,
  onChange,
  placeholder = 'Todas las fechas',
  allowClear = true,
  style,
}: {
  label?: string;
  desde: string;
  hasta: string;
  onChange: (desde: string, hasta: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  // Rango en edición dentro del calendario; se aplica al pulsar "Aplicar".
  const [ini, setIni] = useState(desde);
  const [fin, setFin] = useState(hasta);

  const abrir = () => {
    setIni(desde);
    setFin(hasta);
    setOpen(true);
  };
  const pick = (iso: string) => {
    if (!esIso(ini) || esIso(fin)) {
      setIni(iso);
      setFin('');
    } else if (iso < ini) {
      setFin(ini);
      setIni(iso);
    } else {
      setFin(iso);
    }
  };
  const marca = (iso: string): Marca => {
    if (!esIso(ini)) return null;
    if (!esIso(fin)) return iso === ini ? 'unico' : null;
    if (ini === fin) return iso === ini ? 'unico' : null;
    if (iso === ini) return 'inicio';
    if (iso === fin) return 'fin';
    return iso > ini && iso < fin ? 'entre' : null;
  };

  const texto = esIso(desde) ? (esIso(hasta) && hasta !== desde ? `${formatFecha(desde)} – ${formatFecha(hasta)}` : formatFecha(desde)) : placeholder;
  const resumen = esIso(ini)
    ? esIso(fin)
      ? `${formatFecha(ini)} – ${formatFecha(fin)}`
      : `${formatFecha(ini)} · elige la fecha final`
    : 'Elige la fecha inicial';

  return (
    <>
      <Disparador label={label} texto={texto} vacio={!esIso(desde)} onPress={abrir} style={style} />
      <Ventana visible={open} onClose={() => setOpen(false)} titulo={label ?? 'Elegir rango'}>
        <T size={13} color={colors.textMuted}>
          {resumen}
        </T>
        <Calendario inicial={ini || desde} marca={marca} onPick={pick} />
        <Row gap={10}>
          <Button
            label="Aplicar"
            variant={esIso(ini) ? 'primary' : 'disabled'}
            onPress={() => {
              onChange(ini, esIso(fin) ? fin : ini);
              setOpen(false);
            }}
          />
          {allowClear ? (
            <Button
              label="Todas las fechas"
              variant="secondary"
              onPress={() => {
                onChange('', '');
                setOpen(false);
              }}
            />
          ) : null}
          <Button label="Cerrar" variant="secondary" onPress={() => setOpen(false)} />
        </Row>
      </Ventana>
    </>
  );
}

/** Fecha con calendario más hora "HH:MM". */
export function DateTimeField({
  label,
  fecha,
  hora,
  onChange,
  placeholder = 'Elegir fecha y hora',
  style,
}: {
  label?: string;
  fecha: string;
  hora: string;
  onChange: (fecha: string, hora: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(fecha);
  const [h, setH] = useState(hora);
  const texto = esIso(fecha) ? `${formatFecha(fecha)}${hora ? ` · ${hora}` : ''}` : placeholder;
  return (
    <>
      <Disparador
        label={label}
        texto={texto}
        vacio={!esIso(fecha)}
        onPress={() => {
          setF(fecha);
          setH(hora);
          setOpen(true);
        }}
        style={style}
      />
      <Ventana visible={open} onClose={() => setOpen(false)} titulo={label ?? 'Elegir fecha y hora'}>
        <Calendario inicial={f} marca={(iso) => (iso === f ? 'unico' : null)} onPick={setF} />
        <View style={{ gap: 7 }}>
          <FieldLabel>Hora (HH:MM)</FieldLabel>
          <TextInput value={h} onChangeText={setH} placeholder="16:00" placeholderTextColor={colors.textMuted} style={styles.input} />
        </View>
        <Row gap={10}>
          <Button
            label="Aplicar"
            variant={esIso(f) ? 'primary' : 'disabled'}
            onPress={() => {
              onChange(f, h.trim());
              setOpen(false);
            }}
          />
          <Button label="Cerrar" variant="secondary" onPress={() => setOpen(false)} />
        </Row>
      </Ventana>
    </>
  );
}

/** Varias fechas sueltas (reservas recurrentes): cada toque agrega o quita una fecha. */
export function MultiDateField({
  label,
  values,
  onChange,
  helper,
  style,
}: {
  label?: string;
  values: string[];
  onChange: (isos: string[]) => void;
  helper?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (iso: string) => onChange(values.includes(iso) ? values.filter((v) => v !== iso) : [...values, iso].sort());
  const texto = values.length ? `${values.length} ${values.length === 1 ? 'fecha' : 'fechas'} · ${values.map(formatFecha).join(', ')}` : 'Elegir fechas';
  return (
    <>
      <Disparador label={label} texto={texto} vacio={!values.length} onPress={() => setOpen(true)} helper={helper} style={style} />
      <Ventana visible={open} onClose={() => setOpen(false)} titulo={label ?? 'Elegir fechas'}>
        <T size={13} color={colors.textMuted}>
          {values.length ? `${values.length} seleccionadas. Toca una fecha para agregarla o quitarla.` : 'Toca las fechas de cada sesión.'}
        </T>
        <Calendario inicial={values[0] ?? ''} marca={(iso) => (values.includes(iso) ? 'unico' : null)} onPick={toggle} />
        <Row gap={10}>
          <Button label="Listo" onPress={() => setOpen(false)} />
          <Button label="Quitar todas" variant="secondary" onPress={() => onChange([])} />
        </Row>
      </Ventana>
    </>
  );
}

const CELL = 40;

const styles = StyleSheet.create({
  input: {
    minHeight: 46,
    padding: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    justifyContent: 'center',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(17, 0, 54, 0.35)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  panel: {
    width: CELL * 7 + 40,
    maxWidth: '100%',
    gap: 14,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nav: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: CELL * 7, maxWidth: '100%', alignSelf: 'center' },
  cell: { width: `${100 / 7}%`, height: CELL, alignItems: 'center', justifyContent: 'center' },
  day: { width: CELL - 4, height: CELL - 4, borderRadius: (CELL - 4) / 2, alignItems: 'center', justifyContent: 'center' },
  rangoIni: { backgroundColor: colors.chip, borderTopLeftRadius: CELL / 2, borderBottomLeftRadius: CELL / 2 },
  rangoFin: { backgroundColor: colors.chip, borderTopRightRadius: CELL / 2, borderBottomRightRadius: CELL / 2 },
});
