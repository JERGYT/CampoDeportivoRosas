/**
 * Componentes base del sistema de diseño desktop (tarjetas, campos, botones, etiquetas,
 * mensajes, tablas, historial y pasos), replicados de los mockups de Figma.
 */
import { CircleCheck, Info } from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius } from '@/shared/theme/tokens';

// ───────────── Texto ─────────────

type Weight = 'regular' | 'semibold' | 'bold';

interface TProps {
  children: ReactNode;
  size?: number;
  weight?: Weight;
  color?: string;
  /** Interlineado relativo (Figma usa 1.45 en casi todo el texto). */
  lh?: number;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export function T({ children, size = 14, weight = 'regular', color = colors.text, lh, style, numberOfLines }: TProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: fonts[weight], fontSize: size, color }, lh ? { lineHeight: Math.round(size * lh) } : null, style]}>
      {children}
    </Text>
  );
}

// ───────────── Estructura ─────────────

/**
 * Fila horizontal. Por defecto pasa a la línea siguiente cuando no cabe (pantallas pequeñas);
 * los campos tienen un ancho mínimo para que nunca se descuadren.
 */
export function Row({
  children,
  gap = 16,
  style,
  align = 'flex-start',
  wrap = true,
}: {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  align?: ViewStyle['alignItems'];
  wrap?: boolean;
}) {
  return <View style={[{ flexDirection: 'row', gap, alignItems: align, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

export function Col({ children, gap = 22, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

/** Título de página (30 px) con su descripción. */
export function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ gap: 6 }}>
      <T size={30} weight="semibold" lh={1.45}>
        {title}
      </T>
      <T color={colors.textMuted} lh={1.45}>
        {subtitle}
      </T>
    </View>
  );
}

export function Divider({ color = colors.border }: { color?: string }) {
  return <View style={{ height: 1, backgroundColor: color, alignSelf: 'stretch' }} />;
}

export function Card({ title, badge, children, style, gap = 18 }: { title?: string; badge?: ReactNode; children?: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return (
    <View style={[styles.card, { gap }, style]}>
      {title ? (
        <Row gap={12} align="center" wrap={false}>
          <T size={20} weight="semibold" lh={1.45} style={{ flex: 1, minWidth: 0 }}>
            {title}
          </T>
          {badge}
        </Row>
      ) : null}
      {children}
    </View>
  );
}

// ───────────── Etiquetas ─────────────

type Tone = 'neutral' | 'success' | 'danger';
const toneColors: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.chip, fg: colors.navy },
  success: { bg: colors.successBg, fg: colors.successText },
  danger: { bg: colors.dangerBg, fg: colors.dangerText },
};

export function Chip({ label, tone = 'neutral', dot, onPress }: { label: string; tone?: Tone; dot?: 'filled' | 'outline'; onPress?: () => void }) {
  const c = toneColors[tone];
  const content = (
    <>
      {dot ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: dot === 'filled' ? c.fg : 'transparent',
            borderWidth: dot === 'outline' ? 1.4 : 0,
            borderColor: c.fg,
          }}
        />
      ) : null}
      <T size={12} weight="semibold" color={c.fg}>
        {label}
      </T>
    </>
  );
  const style = [styles.chip, { backgroundColor: c.bg }];
  return onPress ? (
    <Pressable onPress={onPress} style={style}>
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}

// ───────────── Botones ─────────────

type ButtonVariant = 'primary' | 'secondary' | 'disabled';

export function Button({
  label,
  variant = 'primary',
  onPress,
  loading,
  style,
}: {
  label: string;
  variant?: ButtonVariant;
  onPress?: () => void;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const disabled = variant === 'disabled' || loading;
  const bg = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.surface : colors.disabledBg;
  const fg = variant === 'primary' ? colors.white : variant === 'secondary' ? colors.text : colors.textMuted;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}>
      {loading ? <ActivityIndicator size="small" color={fg} style={{ marginRight: 8 }} /> : null}
      <T weight="semibold" color={fg} style={{ flexShrink: 1 }}>
        {label}
      </T>
    </Pressable>
  );
}

// ───────────── Campos ─────────────

/** Ancho mínimo de un campo antes de pasar a la siguiente línea. */
const FIELD_MIN = 180;

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <T size={13} weight="semibold" lh={1.45}>
      {children}
    </T>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  helper,
  multiline,
  style,
  keyboardType,
}: {
  label?: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  helper?: string;
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={[{ gap: 7, minWidth: FIELD_MIN }, style]}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={!!onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && { minHeight: 92, textAlignVertical: 'top' }]}
      />
      {helper ? (
        <T size={12} color={colors.textMuted} lh={1.45}>
          {helper}
        </T>
      ) : null}
    </View>
  );
}

export interface SelectOption<V extends string | number> {
  label: string;
  value: V;
}

/** Campo desplegable con el mismo aspecto de "Valor ⌄" del mockup. */
export function SelectField<V extends string | number>({
  label,
  value,
  options,
  onChange,
  style,
}: {
  label?: string;
  value: V;
  options: SelectOption<V>[];
  onChange: (v: V) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? '';
  return (
    <View style={[{ gap: 7, minWidth: FIELD_MIN, zIndex: open ? 50 : 1 }, style]}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <View>
        <Pressable onPress={() => setOpen((o) => !o)} style={styles.input}>
          <T lh={1.45} numberOfLines={1}>{`${current} ⌄`}</T>
        </Pressable>
        {open ? (
          <View style={styles.dropdown}>
            {options.map((o) => (
              <Pressable
                key={String(o.value)}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={(state) => [styles.option, ((state as { hovered?: boolean }).hovered || o.value === value) && { backgroundColor: colors.chip }]}>
                <T lh={1.45}>{o.label}</T>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ───────────── Mensajes ─────────────

const noticeTones = {
  info: { bg: colors.chip, fg: colors.navy },
  success: { bg: colors.successBg, fg: colors.successText },
  danger: { bg: colors.dangerBg, fg: colors.dangerText },
} as const;

export function Notice({
  tone = 'info',
  title,
  children,
  style,
}: {
  tone?: keyof typeof noticeTones;
  title: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const c = noticeTones[tone];
  const Icon = tone === 'success' ? CircleCheck : Info;
  return (
    <View style={[styles.notice, { backgroundColor: c.bg }, style]}>
      <Icon size={18} color={c.fg} strokeWidth={1.6} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <T weight="semibold" color={c.fg} lh={1.45}>
          {title}
        </T>
        {children ? (
          <T size={13} color={c.fg} lh={1.45}>
            {children}
          </T>
        ) : null}
      </View>
    </View>
  );
}

// ───────────── Datos clave–valor ─────────────

export function DataRow({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <Row gap={16} align="center" wrap={false}>
      <T size={big ? 16 : 14} color={colors.textMuted} lh={1.45} style={{ flex: 1, minWidth: 0 }}>
        {label}
      </T>
      <T
        size={big ? 26 : 14}
        weight="semibold"
        color={big ? colors.amountStrong : colors.text}
        style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </T>
    </Row>
  );
}

export function Small({ children, color = colors.textMuted }: { children: ReactNode; color?: string }) {
  return (
    <T size={12} color={color} lh={1.45}>
      {children}
    </T>
  );
}

// ───────────── Tabla ─────────────

export interface Column {
  title: string;
  /** Ancho de referencia en px (del mockup); se escala con el ancho de la tabla. */
  width?: number;
  flex?: number;
}

export function Table({
  columns,
  rows,
  selected,
  onSelect,
  boldFirst = true,
}: {
  columns: Column[];
  rows: (string | string[])[][];
  selected?: number;
  onSelect?: (index: number) => void;
  boldFirst?: boolean;
}) {
  // Columnas proporcionales: los anchos del mockup (px) se reparten en proporción al ancho
  // disponible; una columna flexible equivale a ~200 px. Así ninguna columna colapsa.
  const cellStyle = (c: Column): ViewStyle => ({ flexGrow: c.width ?? (c.flex ?? 1) * 200, flexShrink: 1, flexBasis: 0, minWidth: 0 });
  return (
    <View style={{ alignSelf: 'stretch' }}>
      <View style={[styles.tr, { backgroundColor: colors.chip }]}>
        {columns.map((c) => (
          <View key={c.title} style={cellStyle(c)}>
            <T size={12} weight="semibold" lh={1.45}>
              {c.title}
            </T>
          </View>
        ))}
      </View>
      {rows.map((r, i) => {
        const Wrapper = onSelect ? Pressable : View;
        return (
          <Wrapper
            key={i}
            onPress={onSelect ? () => onSelect(i) : undefined}
            style={[styles.tr, { backgroundColor: i % 2 === 0 ? colors.white : colors.surface }, selected === i && styles.trSelected]}>
            {r.map((cell, j) => (
              <View key={j} style={cellStyle(columns[j])}>
                {(Array.isArray(cell) ? cell : [cell]).map((line, k) => (
                  <T key={k} weight={boldFirst && j === 0 ? 'semibold' : 'regular'} lh={1.45}>
                    {line}
                  </T>
                ))}
              </View>
            ))}
          </Wrapper>
        );
      })}
    </View>
  );
}

// ───────────── Historial ─────────────

export function Timeline({ events }: { events: { title: string; detail: string }[] }) {
  return (
    <View style={{ gap: 18 }}>
      {events.map((e) => (
        <Row key={e.title} gap={12}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 5 }} />
          <View style={{ flex: 1, gap: 4 }}>
            <T weight="semibold" lh={1.45}>
              {e.title}
            </T>
            <Small>{e.detail}</Small>
          </View>
        </Row>
      ))}
    </View>
  );
}

// ───────────── Pasos del proceso ─────────────

export interface Step {
  label: string;
  status?: string;
  onPress?: () => void;
}

export function Stepper({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <View style={[styles.card, { flexDirection: 'row', flexWrap: 'wrap', columnGap: 28, rowGap: 12, paddingVertical: 18, paddingHorizontal: 18, alignItems: 'center' }]}>
      {steps.map((s, i) => {
        const active = i === current;
        return (
          <Pressable key={s.label} onPress={s.onPress} disabled={!s.onPress} style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
            <View style={[styles.stepDot, { backgroundColor: active ? colors.primary : colors.chip }]}>
              <T size={12} weight="semibold" color={active ? colors.white : colors.navy}>
                {i + 1}
              </T>
            </View>
            <View>
              <T size={13} weight={active ? 'semibold' : 'regular'} color={active ? colors.text : colors.textMuted} lh={1.25}>
                {s.label}
              </T>
              {s.status ? (
                <T size={13} weight={active ? 'semibold' : 'regular'} color={active ? colors.text : colors.textMuted} lh={1.25}>
                  {s.status}
                </T>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  button: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: radius.field,
  },
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
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  option: { paddingHorizontal: 12, paddingVertical: 9 },
  notice: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.field },
  tr: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // La fila seleccionada no cambia de color en el mockup; se deja el estilo para ajustarlo si se requiere.
  trSelected: {},
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
