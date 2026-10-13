/**
 * Configuración de conexión con la rama back (microservicios PHP Slim).
 * Los valores se leen de .env (ver .env.example). Las variables EXPO_PUBLIC_* quedan
 * disponibles en el bundle en tiempo de compilación.
 */
export const apiConfig = {
  disponibilidadUrl:
    process.env.EXPO_PUBLIC_MS_DISPONIBILIDAD_URL ??
    'http://localhost/CampoDeportivoRosas/back/ms-disponibilidad/public/index.php',
  reservasUrl:
    process.env.EXPO_PUBLIC_MS_RESERVAS_URL ??
    'http://localhost/CampoDeportivoRosas/back/ms-reservas/public/index.php',
  /** true mientras el back no esté corriendo: los servicios responden con datos de prueba. */
  useMocks: (process.env.EXPO_PUBLIC_USE_MOCKS ?? 'true') !== 'false',
};
