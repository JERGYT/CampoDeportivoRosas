/**
 * Tokens del sistema de diseño (tomados de los mockups de Figma "Campo Deportivo los Rosas").
 * Compartidos entre la versión desktop y la futura versión móvil.
 */
export const colors = {
  primary: '#D73220',
  navy: '#110036',
  navActive: '#2C1C4D',
  navMuted: '#C6BBD7',
  background: '#F9ECE5',
  surface: '#FFFCF9',
  white: '#FFFFFF',
  border: '#E7DAD3',
  text: '#291E30',
  textMuted: '#766975',
  chip: '#EEE8F5',
  amountStrong: '#68150A',
  successBg: '#EDF3EC',
  successText: '#41624B',
  dangerBg: '#FCE1D8',
  dangerText: '#68150A',
  disabledBg: '#F0EBE8',
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const radius = {
  field: 9,
  card: 16,
  pill: 100,
  emblem: 14,
} as const;

export const layout = {
  sidebarWidth: 216,
  headerHeight: 76,
  contentPadding: 32,
  asideWidth: 420,
} as const;
