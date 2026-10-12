import { router } from 'expo-router';
import { CalendarX, ChartNoAxesCombined, ClipboardCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import SimboloAgenda from '@/assets/figma/simbolo-agenda.svg';
import SimboloClientes from '@/assets/figma/simbolo-clientes.svg';
import SimboloEspacios from '@/assets/figma/simbolo-espacios.svg';
import SimboloPagos from '@/assets/figma/simbolo-pagos.svg';
import { colors, layout, radius } from '@/shared/theme/tokens';

import { navTargets, routes, type NavKey } from '../navigation';
import { Brand } from './Brand';
import { Button, T } from './ui';

const items: { key: NavKey; label: string; icon: (color: string) => ReactNode }[] = [
  {
    key: 'agenda',
    label: 'Agenda y reservas',
    icon: (c) => <SimboloAgenda width={18} height={16.2} color={c} style={{ position: 'absolute', top: 1.8, left: 0 }} />,
  },
  {
    key: 'clientes',
    label: 'Clientes',
    icon: (c) => <SimboloClientes width={7.2} height={8} color={c} style={{ position: 'absolute', top: 0, left: 2.7 }} />,
  },
  { key: 'espacios', label: 'Espacios', icon: (c) => <SimboloEspacios width={18} height={18} color={c} /> },
  { key: 'pagos', label: 'Pagos', icon: (c) => <SimboloPagos width={18} height={18} color={c} /> },
  { key: 'reserva', label: 'Reserva', icon: (c) => <ClipboardCheck size={18} color={c} strokeWidth={1.6} /> },
  { key: 'cancelaciones', label: 'Cancelaciones', icon: (c) => <CalendarX size={18} color={c} strokeWidth={1.6} /> },
  { key: 'reportes', label: 'Reportes · Futuro', icon: (c) => <ChartNoAxesCombined size={18} color={c} strokeWidth={1.6} /> },
];

/** Menú lateral azul: fijo, no se desplaza con el contenido. */
export function Sidebar({ active }: { active: NavKey[] }) {
  return (
    <View style={styles.sidebar}>
      <Brand />
      <Button label="Reservar" onPress={() => router.push(routes.nuevaReserva)} style={{ alignSelf: 'stretch' }} />
      <View style={{ gap: 10 }}>
        {items.map((item) => {
          const isActive = active.includes(item.key);
          const color = isActive ? colors.white : colors.navMuted;
          return (
            <Pressable
              key={item.key}
              onPress={() => router.navigate(navTargets[item.key])}
              style={(state) => [
                styles.item,
                (isActive || (state as { hovered?: boolean }).hovered) && { backgroundColor: colors.navActive },
              ]}>
              <View style={{ width: 18, height: 18 }}>{item.icon(color)}</View>
              <T size={12} color={color}>
                {item.label}
              </T>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 'auto', gap: 20 }}>
        <T size={12} color={colors.navMuted}>
          ¿Necesitas ayuda?
        </T>
        <T size={13} weight="semibold" color={colors.white}>
          Centro de soporte ↗
        </T>
        <View style={{ height: 1, backgroundColor: colors.navActive }} />
        <Pressable onPress={() => router.replace(routes.login)} style={{ flexDirection: 'row', gap: 10 }}>
          <View style={styles.avatar}>
            <T size={12} color={colors.white}>
              AM
            </T>
          </View>
          <View style={{ gap: 4 }}>
            <T size={12} weight="semibold" color={colors.white}>
              Ana Martínez
            </T>
            <T size={11} color={colors.navMuted}>
              Administradora
            </T>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: layout.sidebarWidth,
    height: '100%',
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 32,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 },
    zIndex: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 13,
    borderRadius: radius.field,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.navActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
