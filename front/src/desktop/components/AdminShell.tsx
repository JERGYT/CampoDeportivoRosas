import { usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Notificaciones from '@/assets/figma/notificaciones.svg';
import { colors, layout } from '@/shared/theme/tokens';

import { screenMeta } from '../navigation';
import { Sidebar } from './Sidebar';
import { T } from './ui';

/**
 * Estructura de todas las pantallas de administración:
 * menú azul fijo a la izquierda + encabezado y contenido con scroll solo a la derecha.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = screenMeta[pathname] ?? { breadcrumb: 'Administración', active: [] };

  return (
    <View style={styles.root}>
      <Sidebar active={meta.active} />
      <View style={styles.main}>
        <View style={styles.header}>
          <T size={13} color={colors.textMuted} numberOfLines={1} style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
            {meta.breadcrumb}
          </T>
          <View style={{ width: 20, height: 20 }}>
            <Notificaciones width={20} height={15} color={colors.textMuted} />
          </View>
        </View>
        {/* key: cada pantalla abre desde arriba */}
        <ScrollView key={pathname} style={{ flex: 1 }} contentContainerStyle={styles.content}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  main: { flex: 1, minWidth: 0 },
  header: {
    height: layout.headerHeight,
    paddingHorizontal: layout.contentPadding,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: { padding: layout.contentPadding, gap: 22 },
});
