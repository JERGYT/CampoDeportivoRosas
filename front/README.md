# Campo Deportivo los Rosas · Frontend

Frontend en **React Native + Expo (Expo Router, TypeScript)** del sistema de reservas del
Campo Deportivo los Rosas. Hoy está construida la versión **desktop** a partir de los
mockups de Figma; la versión **móvil** queda preparada como estructura (`src/mobile/`).

## Cómo correrlo

```bash
cd front
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run web               # abre http://localhost:8081
```

## Estructura

```
front/
  .env.example              URL de los microservicios y modo de datos de prueba
  assets/figma/             imágenes e íconos exportados de Figma
  docs/mockups/desktop/     PNG de referencia de las 11 pantallas desktop
  src/
    app/                    rutas (Expo Router); cada archivo solo apunta a una pantalla
      login.tsx
      (admin)/              pantallas con menú lateral fijo y scroll solo a la derecha
    desktop/
      components/           sistema de diseño (ui.tsx), menú lateral, encabezado
      screens/              una pantalla por mockup
      data/demo.ts          datos de ejemplo de procesos que el back aún no expone
      navigation.ts         rutas, migas de pan y menú activo por pantalla
    mobile/                 versión móvil (pendiente)
    shared/
      services/             conexión con la rama back (ver abajo)
      theme/tokens.ts       colores, fuentes y medidas del diseño
      utils/format.ts       moneda COP, fechas y horas
```

## Pantallas y navegación

| Ruta | Mockup | Lleva a |
|---|---|---|
| `/login` | Acceso | Ingresar al panel → Gestión de reservas |
| `/reservas` | Gestión de reservas | Agregar cliente, Validar y entregar, Iniciar cancelación… |
| `/clientes/nuevo` | Agregar cliente | Guardar cliente (`POST createcliente`), Cancelar |
| `/entrega` | Entrega | Registrar entrega → Recepción |
| `/recepcion` | Recepción | Con incidencias → Daños · Sin novedades → Liquidación |
| `/danos` | Daños | Registrar valoración → Liquidación |
| `/liquidacion` | Liquidación | Ver reserva completada → Gestión |
| `/cancelacion` | Cancelación | Confirmar cancelación → Cancelación completada |
| `/cancelacion/completada` | Cancelación completada | Gestionar devolución, Consultar franja liberada |
| `/devolucion` | Devolución | Ver auditoría de cancelación |
| `/reportes` | Reportes | — |
| `/reservas/nueva` | *(sin mockup desktop)* | Botón **Reservar** del menú |
| `/espacios` | *(sin mockup desktop)* | Menú **Espacios** |

Las dos últimas no tienen mockup desktop; se construyeron con el mismo sistema de diseño
para que todos los endpoints del back tengan una pantalla que los use.

## Conexión con la rama `back`

Toda la comunicación está en `src/shared/services/`:

| Archivo | Microservicio | Endpoints |
|---|---|---|
| `disponibilidad.ts` | ms-disponibilidad | `GET /view/espacios`, `GET /view/consultar`, `GET /view/cronograma`, `POST /view/bloquear` |
| `reservas.ts` | ms-reservas | `GET /view/clientes`, `POST /view/createcliente`, `POST /view/validarrecurrencia`, `POST /view/confirmarreserva` |

- `types.ts` usa **exactamente los mismos nombres de campos** que devuelven los controladores PHP.
- `http.ts` convierte las respuestas `{ status: "error", mensaje }` (400, 409, 500) en `ApiError`.
- `mocks/db.ts` replica las semillas SQL y las reglas del back (horario 06:00–22:00, cruces,
  días permitidos por tipo de cliente) para trabajar sin el back encendido.

Para conectar con el back real, en `.env`:

```
EXPO_PUBLIC_MS_DISPONIBILIDAD_URL=http://localhost/CampoDeportivoRosas/back/ms-disponibilidad/public/index.php
EXPO_PUBLIC_MS_RESERVAS_URL=http://localhost/CampoDeportivoRosas/back/ms-reservas/public/index.php
EXPO_PUBLIC_USE_MOCKS=false
```

y reiniciar `npm run web`. No hay que cambiar ninguna pantalla.

Los procesos de entrega, recepción, daños, liquidación, cancelación, devolución, reportes y el
listado de reservas aún no tienen endpoint en el back; usan `src/desktop/data/demo.ts`. Cuando
existan, se agrega su función al servicio correspondiente con el mismo patrón.
