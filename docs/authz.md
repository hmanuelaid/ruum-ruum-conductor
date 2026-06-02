# Autorizacion de rutas y RLS

## Rutas protegidas

El middleware valida la sesion con `supabase.auth.getUser()` antes de renderizar rutas sensibles.

Rutas admin:

- `/conductores`
- `/usuarios`
- `/pagos`
- `/documentos`

Rutas conductor:

- `/panel`
- `/viajes`
- `/ganancias`
- `/docs`
- `/soporte`

## Fuente de permisos

Admin:

- `user.app_metadata.role` o `user.app_metadata.type` con valor `admin`, `administrator`, `super_admin`, `superadmin` u `owner`.
- O una fila en `app_users` que coincida por `id = auth.uid()` o por `email`, con `type` admin.

Conductor:

- `user.app_metadata.role` o `user.app_metadata.type` con valor `driver` o `conductor`.
- O una fila en `drivers` con `auth_id = auth.uid()`.

## RLS versionado

La migracion `supabase/migrations/20260602000000_authz_rls.sql` habilita RLS para las tablas usadas por las rutas admin/conductor y agrega politicas base para:

- Administradores sobre `app_users`, `drivers`, `documents`, `payments`, `trips` y `trip_evidence`.
- Conductores sobre su propio perfil, documentos, viajes asignados y evidencia de esos viajes.

Antes de aplicarla en Supabase, confirmar que los nombres de columnas coinciden con el proyecto real, especialmente `app_users.type`, `drivers.auth_id`, `documents.owner_id`, `trips.driver_id` y `trip_evidence.driver_id`.

El contrato de `documents.status`, storage privado y signed URLs esta descrito en `docs/documents.md` y versionado en:

- `supabase/migrations/20260602001000_document_contract.sql`
- `supabase/migrations/20260602002000_private_storage_policies.sql`
- `supabase/migrations/20260602003000_driver_profile_creation_policy.sql`

## Smoke tests recomendados

Sin cookies de sesion:

- `GET /conductores` debe redirigir a `/login`.
- `GET /usuarios` debe redirigir a `/login`.
- `GET /pagos` debe redirigir a `/login`.
- `GET /documentos` debe redirigir a `/login`.
- `GET /panel` debe redirigir a `/login`.

Con usuario conductor sin rol admin:

- `GET /panel` debe responder 200.
- `GET /conductores` debe redirigir a `/sin-acceso`.

Con usuario admin:

- `GET /conductores` debe responder 200.
- `GET /usuarios` debe responder 200.
- `GET /pagos` debe responder 200.
- `GET /documentos` debe responder 200.
