export const apiConfig = {
  // Forzar false para que NUNCA use datos simulados
  useMocks: false,
  /**
   * Endpoints del Sprint 2 (alternativas, anticipo, constancia de saldo). El back aún no los
   * expone: mientras sea false se usan los mocks tipados de mocks/sprint2.ts. Cuando existan,
   * poner EXPO_PUBLIC_SPRINT2_API=true en front/.env.
   */
  sprint2Api: process.env.EXPO_PUBLIC_SPRINT2_API === 'true',
  // URLs base SIN el '/view' al final, porque cada servicio ya le agrega '/view/...'
  disponibilidadUrl:
    process.env.EXPO_PUBLIC_API_DISPONIBILIDAD ||
    'http://localhost/CampoDeportivoRosas/back/ms-disponibilidad/public/index.php',
  reservasUrl:
    process.env.EXPO_PUBLIC_API_RESERVAS ||
    'http://localhost/CampoDeportivoRosas/back/ms-reservas/public/index.php',
};
