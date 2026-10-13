# Campo Deportivo los Rosas

Sistema de reservas del Campo Deportivo los Rosas.

```
CampoDeportivoRosas/
├── back/    Backend PHP (Slim 4 + Eloquent), dos microservicios
│   ├── ms-disponibilidad/   espacios, horarios y bloqueos
│   ├── ms-reservas/         clientes y reservas (llama a ms-disponibilidad)
│   └── sql/                 scripts para crear las bases de datos
└── front/   Frontend Expo + React Native + TypeScript (Expo Router)
```

## 1. Qué instalar

| Programa | Versión | Para qué |
|---|---|---|
| [XAMPP](https://www.apachefriends.org/es/index.html) | con **PHP 8.2 o superior** | Apache (sirve el backend), PHP y MySQL/MariaDB |
| [Composer](https://getcomposer.org/download/) | 2.x | Instala las librerías PHP de cada microservicio |
| [Node.js](https://nodejs.org/es) | 20 LTS o superior (recomendado 22 LTS) | Corre el frontend |
| [Git](https://git-scm.com/) | cualquiera reciente | Clonar el repositorio |

Notas:
- `illuminate/database` 12 exige PHP 8.2+. Si tu XAMPP trae una versión anterior, instala uno más nuevo.
- Al instalar Composer en Windows, cuando pregunte por el PHP, elige `C:\xampp\php\php.exe`.
- Para comprobar: `php -v`, `composer -V`, `node -v`, `npm -v`.

## 2. Ubicar el proyecto en `htdocs`

Las rutas del backend están fijas a `http://localhost/CampoDeportivoRosas/...`
(ver `setBasePath` en `back/*/public/index.php`), así que la carpeta del repo
debe quedar exactamente en:

```
C:\xampp\htdocs\CampoDeportivoRosas
```

```bash
cd C:/xampp/htdocs
git clone https://github.com/JERGYT/CampoDeportivoRosas.git
```

## 3. Activar Apache y MySQL

1. Abre el **XAMPP Control Panel**.
2. Pulsa **Start** en **Apache** y en **MySQL**.
3. Verifica que `http://localhost` abre la página de XAMPP.

No hace falta configurar `.htaccess` ni `mod_rewrite`: las URL incluyen `index.php`.
Las extensiones que usa el proyecto (`pdo_mysql`, `mbstring`, `openssl`) y
`allow_url_fopen` ya vienen activas en el `php.ini` de XAMPP.

## 4. Crear las bases de datos

Las conexiones usan `root` sin contraseña en `localhost` (el valor por defecto de XAMPP).
Si cambiaste la contraseña de MySQL, ajústala en `back/*/app/Config/database.php`.

Opción A, phpMyAdmin: entra a `http://localhost/phpmyadmin`, pestaña **Importar**, e importa
en este orden:

1. `back/sql/01_db_disponibilidad.sql`
2. `back/sql/02_db_reservas.sql`

Opción B, consola:

```bash
C:/xampp/mysql/bin/mysql -u root --default-character-set=utf8mb4 < back/sql/01_db_disponibilidad.sql
C:/xampp/mysql/bin/mysql -u root --default-character-set=utf8mb4 < back/sql/02_db_reservas.sql
```

## 5. Instalar dependencias del backend

La carpeta `vendor/` no se versiona, así que hay que instalarla en cada microservicio:

```bash
cd C:/xampp/htdocs/CampoDeportivoRosas/back/ms-disponibilidad
composer install
cd ../ms-reservas
composer install
```

Prueba rápida en el navegador:

- `http://localhost/CampoDeportivoRosas/back/ms-disponibilidad/public/index.php/view/espacios`
- `http://localhost/CampoDeportivoRosas/back/ms-reservas/public/index.php/view/clientes`

Ambas deben responder JSON. En `back/*.http` hay ejemplos de todas las peticiones
(se pueden ejecutar con la extensión REST Client de VS Code).

### Endpoints

Base: `http://localhost/CampoDeportivoRosas/back/<microservicio>/public/index.php`

| Microservicio | Método | Ruta |
|---|---|---|
| ms-disponibilidad | GET | `/view/espacios` |
| ms-disponibilidad | GET | `/view/consultar` |
| ms-disponibilidad | GET | `/view/cronograma` |
| ms-disponibilidad | POST | `/view/bloquear` |
| ms-reservas | GET | `/view/clientes` |
| ms-reservas | POST | `/view/createcliente` |
| ms-reservas | POST | `/view/validarrecurrencia` |
| ms-reservas | POST | `/view/confirmarreserva` |

## 6. Correr el frontend

```bash
cd C:/xampp/htdocs/CampoDeportivoRosas/front
npm install
copy .env.example .env
npm run web
```

Se abre en `http://localhost:8081`.

**Para conectar el front con el back**, en `front/.env` cambia `EXPO_PUBLIC_USE_MOCKS=true`
por `EXPO_PUBLIC_USE_MOCKS=false`. Las variables son:

- `EXPO_PUBLIC_USE_MOCKS=true` usa datos de prueba y no necesita el backend.
- `EXPO_PUBLIC_USE_MOCKS=false` llama a los microservicios reales (Apache y MySQL encendidos).
- `EXPO_PUBLIC_MS_DISPONIBILIDAD_URL` y `EXPO_PUBLIC_MS_RESERVAS_URL` ya apuntan a XAMPP.

Después de cambiar `.env`, detén `npm run web` (Ctrl+C) y vuelve a iniciarlo.

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| `vendor/autoload.php: No such file` | Falta `composer install` en ese microservicio |
| 404 de Slim en todas las rutas | El repo no está en `htdocs\CampoDeportivoRosas` |
| `SQLSTATE[HY000] [1049] Unknown database` | No se importaron los scripts de `back/sql/` |
| `SQLSTATE[HY000] [2002]` | MySQL está apagado en XAMPP |
| Composer pide PHP >= 8.2 | El PHP de XAMPP es viejo |
| Nombres con tildes raras (`SintÃ©tica`) | Se importó el `.sql` por consola sin `--default-character-set=utf8mb4` |
| El front muestra "No se pudo conectar con el servidor" | Apache apagado o el repo no está en `htdocs` |
| El front sigue mostrando datos de prueba | `EXPO_PUBLIC_USE_MOCKS` sigue en `true` o no reiniciaste `npm run web` |
