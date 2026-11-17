import { router } from 'expo-router';
import { CalendarX, ChartNoAxesCombined, ClipboardCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import SimboloAgenda from '@/assets/figma/simbolo-agenda.svg';
import SimboloClientes from '@/assets/figma/simbolo-clientes.svg';
import SimboloEspacios from '@/assets/figma/simbolo-espacios.svg';
import SimboloPagos from '@/assets/figma/simbolo-pagos.svg';
import { colors, layout, radius } from '@/shared/theme/tokens';

import { authService } from '../../shared/services/auth';
import { useResponsive } from '../hooks/useResponsive';
import { navTargets, routes, type NavKey } from '../navigation';
import { Brand } from './Brand';
import { Button, T } from './ui';

const items: { key: NavKey; label: string; soloAdmin?: boolean; icon: (color: string) => ReactNode }[] = [
  {
    key: 'agenda',
    label: 'Agenda y reservas',
    icon: (c) => <SimboloAgenda width={18} height={16.2} color={c} style={{ position: 'absolute', top: 1.8, left: 0 }} />,
  },
  {
    key: 'clientes',
    label: 'Clientes',
    icon: (c) => <SimboloClientes width={17.2} height={18} color={c} style={{ position: 'absolute', top: 0, left: 2.7 }} />,
  },
  {
    key: 'espacios',
    label: 'Espacios y horarios',
    icon: (c) => <SimboloEspacios width={18} height={18} color={c} />,
  },
  {
    key: 'pagos',
    label: 'Pagos',
    soloAdmin: true,
    icon: (c) => <SimboloPagos width={18} height={18} color={c} />,
  },
  {
    key: 'reserva',
    label: 'Reserva',
    icon: (c) => <ClipboardCheck size={18} color={c} strokeWidth={1.6} />,
  },
  {
    key: 'cancelaciones',
    label: 'Cancelaciones',
    soloAdmin: true,
    icon: (c) => <CalendarX size={18} color={c} strokeWidth={1.6} />,
  },
  {
    key: 'reportes',
    label: 'Reportes',
    soloAdmin: true,
    icon: (c) => <ChartNoAxesCombined size={18} color={c} strokeWidth={1.6} />,
  },
];

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 0 || !partes[0]) return 'US';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

/** Menú lateral azul: fijo, no se desplaza con el contenido. */
export function Sidebar({ active }: { active: NavKey[] }) {
  const { short } = useResponsive();
  const sesion = authService.getSesion();
  const esAdmin = sesion.rol === 'ADMINISTRADOR';

  const itemsVisibles = items.filter((item) => !item.soloAdmin || esAdmin);
  const iniciales = obtenerIniciales(sesion.nombre);
  const etiquetaRol = esAdmin ? 'Administradora' : 'Operario';

  const onCerrarSesion = () => {
    authService.cerrarSesion();
    router.replace(routes.login);
  };

  return (
    
    <ScrollView
      style={styles.sidebar}
      contentContainerStyle={[styles.sidebarContent, short && { gap: 20, paddingVertical: 20 }]}
      showsVerticalScrollIndicator={false}>
      <Brand />
      <Button label="Reservar" onPress={() => router.push(routes.nuevaReserva)} style={{ alignSelf: 'stretch' }} />
      <View style={{ gap: short ? 4 : 10 }}>
        {itemsVisibles.map((item) => {
          const isActive = active.includes(item.key);
          const color = isActive ? colors.white : colors.navMuted;
          return (
            <Pressable
              key={item.key}
              onPress={() => router.navigate(navTargets[item.key])}
              style={(state) => [
                styles.item,
                short && { paddingVertical: 10 },
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

      <View style={{ marginTop: 'auto', gap: short ? 14 : 20 }}>
        <T size={12} color={colors.navMuted}>
          ¿Necesitas ayuda?
        </T>
        <T size={13} weight="semibold" color={colors.white}>
          Centro de soporte ↗
        </T>
        <View style={{ height: 1, backgroundColor: colors.navActive }} />
        <Pressable
          onPress={onCerrarSesion}
          style={(state) => [
            styles.userCard,
            (state as { hovered?: boolean }).hovered && { backgroundColor: colors.navActive },
          ]}>
          <View style={styles.avatar}>
            <T size={12} weight="semibold" color={colors.white}>
              {iniciales}
            </T>
          </View>
          <View style={{ gap: 2, flex: 1 }}>
            <T size={12} weight="semibold" color={colors.white}>
              {sesion.nombre}
            </T>
            <T size={11} color={colors.navMuted}>
              {etiquetaRol} · Salir
            </T>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: layout.sidebarWidth,
    flexGrow: 0,
    height: '100%',
    backgroundColor: colors.navy,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 },
    zIndex: 3,
  },
  sidebarContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 30, gap: 32 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 13,
    borderRadius: radius.field,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
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