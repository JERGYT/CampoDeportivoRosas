import { View } from 'react-native';

import Flor from '@/assets/figma/flor.svg';
import { colors, radius } from '@/shared/theme/tokens';

import { T } from './ui';

/** Emblema + nombre "los Rosas" (menú lateral y pantalla de acceso). */
export function Brand() {
  return (
    <View style={{ gap: 14 }}>
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
      <T size={21} weight="bold" color={colors.white}>
        los Rosas
      </T>
      <View>
        <T size={11} color={colors.navMuted} lh={1.4}>
          CAMPO DEPORTIVO
        </T>
        <T size={11} color={colors.navMuted} lh={1.4}>
          Administración
        </T>
      </View>
    </View>
  );
}
