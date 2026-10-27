export const apiConfig = {
  // Forzar false para que NUNCA use datos simulados
  useMocks: false,
  // URLs base SIN el '/view' al final, porque cada servicio ya le agrega '/view/...'
  disponibilidadUrl:
    process.env.EXPO_PUBLIC_API_DISPONIBILIDAD ||
    'http://localhost/CampoDeportivoRosas/back/ms-disponibilidad/public/index.php',
  reservasUrl:
    process.env.EXPO_PUBLIC_API_RESERVAS ||
    'http://localhost/CampoDeportivoRosas/back/ms-reservas/public/index.php',
};