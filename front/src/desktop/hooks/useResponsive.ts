import { useWindowDimensions } from 'react-native';

import { layout } from '@/shared/theme/tokens';

/**
 * Medidas adaptables para la versión desktop. Los mockups están a 1600 px; en pantallas
 * más pequeñas (1366, 1280, 1024…) la columna lateral se reduce o pasa debajo del contenido.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const contentWidth = width - layout.sidebarWidth - layout.contentPadding * 2;

  /** Ancho de la columna lateral; null = se apila debajo de la principal. */
  const asideWidth = contentWidth >= 1200 ? layout.asideWidth : contentWidth >= 860 ? 340 : null;

  return {
    width,
    height,
    contentWidth,
    asideWidth,
    /** Pantallas de 1440 px o menos. */
    compact: width < 1440,
    /** Pantallas bajas (≤ 800 px de alto): el menú lateral se compacta. */
    short: height < 800,
  };
}
