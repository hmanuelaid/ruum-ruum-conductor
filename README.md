# RuumRuum Conductor

Aplicacion web para conductores de Ruum-Ruum by MoviliaX. Permite registrar el perfil del conductor, cargar documentos, consultar viajes ofertados, aceptar o rechazar traslados, ejecutar el flujo operativo del viaje, subir evidencia, revisar ganancias y levantar tickets de soporte.

El mismo repo tambien incluye vistas admin ligeras usadas por roles internos para revisar usuarios, conductores, documentos y pagos relacionados con la operacion del conductor.

## Stack

- Next.js App Router
- React
- Supabase Auth, Database y Storage
- Zustand para estado de UI
- Upstash Redis para rate limiting en endpoints sensibles
- ESLint, TypeScript y pruebas estaticas/smoke de seguridad

## Requisitos

- Node.js 22 recomendado para coincidir con CI/deployment
- npm
- Proyecto Supabase con Auth habilitado
- Supabase Storage con buckets privados:
  - `documents`
  - `trip-evidence`
- Migraciones aplicadas desde el repo central `ruum-ruum-database`

## Variables de entorno

Copia `.env.example` como `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
UPSTASH_REDIS_REST_URL=https://tu-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=tu-token-upstash
```

Variables:

- `NEXT_PUBLIC_SUPABASE_URL`: URL publica del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon key de Supabase usada por cliente, proxy y route handlers.
- `UPSTASH_REDIS_REST_URL`: REST URL de Upstash Redis para rate limiting distribuido.
- `UPSTASH_REDIS_REST_TOKEN`: token REST de Upstash Redis.

Notas:

- Si Upstash no esta configurado, `lib/rateLimit.ts` usa fallback en memoria para desarrollo local.
- No guardes service-role keys en variables expuestas al navegador.
- Los buckets de documentos y evidencia deben permanecer privados.

## Instalacion

```bash
npm ci
npm run dev
```

La app local corre en `http://localhost:3000`.

## Roles

La app maneja dos contextos:

- `driver`: conductor autenticado con perfil en `drivers`. Puede completar onboarding, cargar documentos, configurar disponibilidad, aceptar/rechazar viajes y actualizar el flujo operativo de sus traslados asignados.
- `admin`: usuario interno con acceso administrativo. Puede revisar recursos operativos del conductor segun las validaciones de `lib/auth-guards.ts` y los guards de API.

Las APIs centralizan auth en `lib/api-auth.ts`. Las rutas que requieren conductor usan `driverId` como identidad operativa.

## Flujo de onboarding

1. Registro: el conductor crea cuenta con Supabase Auth.
2. Perfil: se crea o actualiza el registro en `drivers`.
3. Documentos: el conductor carga documentos al bucket privado `documents`.
4. Validacion: el estado queda pendiente para revision operativa.
5. Activacion: un conductor validado puede ponerse disponible y aceptar traslados.

Los documentos se guardan como objetos privados y se sirven mediante signed URLs.

## Supabase

Las migraciones ya no viven en este repo. Deben aplicarse desde:

```text
../ruum-ruum-database/supabase/migrations
```

Para este app son relevantes, entre otras:

- RLS y politicas para rutas admin/conductor.
- Contrato de documentos y normalizacion de estados.
- Storage privado para `documents`, `trip-evidence` y `evidence`.
- Politicas de ofertas de viaje.
- Columnas de preferencias, cuenta bancaria y soporte del conductor.

## Comandos

```bash
npm run dev          # servidor local
npm run lint         # eslint
npm run typecheck    # TypeScript sin emitir archivos
npm test             # pruebas de seguridad + smoke routes
npm run test:security
npm run test:smoke
npm run build        # build de produccion
npm run audit:prod   # npm audit sin dev dependencies
```

## Seguridad

- `middleware.ts` protege rutas privadas con Supabase server-side y redirige a `/login` o `/sin-acceso`.
- `lib/api-auth.ts` centraliza sesion, rol admin y `driverId`.
- Rate limiting:
  - `app/api/documents/upload/route.ts`: preset `upload`, clave `driverId + IP`.
  - `app/api/trips/[id]/aceptar/route.ts`: preset `trips`, clave `driverId + IP`.
  - `app/api/trips/[id]/rechazar/route.ts`: preset `trips`, clave `driverId + IP`.
- `lib/driver-availability.ts` registra fallos al actualizar `availability_status` con contexto, `driverId` y `tripId`.
- Los uploads validan tipo/tamano y escriben en buckets privados.
- El conductor no puede subir documentos para otro owner salvo que sea admin.
- Los cambios de estado de viaje validan transiciones y evidencia requerida.

## Checklist antes de despliegue

- Migraciones aplicadas desde `ruum-ruum-database`.
- Buckets `documents` y `trip-evidence` privados.
- Variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas.
- Variables `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` configuradas para rate limiting real.
- `@ruum/types` incluido desde `packages/ruum-types` en el checkout del repo.
- `npm ci` instala sin errores.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` y `npm run audit:prod` revisados.
- Probar login, onboarding, upload de documentos, aceptar/rechazar viaje y cierre de viaje en el ambiente destino.
