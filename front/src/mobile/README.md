# Versión móvil (pendiente)

Aquí irá la versión para celulares, construida a partir de los mockups móviles de Figma
(412 px de ancho: Inicio · Elegir espacio, Detalle del espacio, Perfil/fecha/horario,
Reserva recurrente, Resultado de disponibilidad, Cruces de horario, Checkout y Comprobante).

Estructura prevista, igual a la de `src/desktop/`:

```
src/mobile/
  components/   componentes propios de móvil
  screens/      una pantalla por mockup
  navigation.ts rutas y menú móvil
```

Ya se puede reutilizar sin cambios todo lo que está en `src/shared/`:

- `shared/theme/tokens.ts`: colores, fuentes y radios del sistema de diseño.
- `shared/services/`: servicios tipados de `ms-disponibilidad` y `ms-reservas`.
- `shared/utils/format.ts`: formato de moneda, fechas y horas.
