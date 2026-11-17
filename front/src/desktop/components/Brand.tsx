import { View } from 'react-native';

import Flor from '@/assets/figma/flor.svg';
import { colors, radius } from '@/shared/theme/tokens';

import { T } from './ui';

export function Brand({ dark = false, centered = false }: { dark?: boolean; centered?: boolean }) {
  const titleColor = dark ? '#0F172A' : colors.white;
  const subColor = dark ? '#64748B' : colors.navMuted;

  return (
    <View style={{ gap: 10, alignItems: centered ? 'center' : 'flex-start' }}>
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: radius.emblem,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Flor width={26} height={26} color={colors.white} />
      </View>
      <T size={21} weight="bold" color={titleColor} style={centered ? { textAlign: 'center' } : undefined}>
        los Rosas
      </T>
      <View style={centered ? { alignItems: 'center' } : undefined}>
        <T size={11} color={subColor} lh={1.4} style={centered ? { textAlign: 'center' } : undefined}>
          CAMPO DEPORTIVO
        </T>
        <T size={11} color={subColor} lh={1.4} style={centered ? { textAlign: 'center' } : undefined}>
          Administración
        </T>
      </View>
    </View>
  );
}
