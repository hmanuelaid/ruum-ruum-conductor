# Contrato de documentos

## Estado canonico

La aplicacion usa un solo enum de estado definido en `lib/document-contract.ts`:

- `pendiente_carga`
- `en_revision`
- `aprobado`
- `rechazado`
- `vencido`

Los estados legacy como `pendiente`, `pending`, `review`, `approved`, `rejected` y `expired` se normalizan al leer y se migran con `supabase/migrations/20260602001000_document_contract.sql`.

## Archivo privado

La referencia canonica del archivo en base de datos es `documents.storage_path`.

`documents.url` y `documents.file_url` se conservan como locators legacy o campos de respuesta. Las nuevas escrituras deben guardar `storage_path`; `/api/documents` devuelve `url` como signed URL temporal cuando existe `storage_path`.

Los buckets `documents`, `trip-evidence` y `evidence` deben ser privados. Las policies y columnas de storage estan versionadas en `supabase/migrations/20260602002000_private_storage_policies.sql`.

## Validacion

La UI de conductor, el admin y `/api/documents` deben importar el contrato compartido en lugar de definir estados locales. La migracion agrega un `CHECK` para impedir que se guarden estados fuera del enum canonico.

Las escrituras sensibles de documentos deben pasar por `/api/documents/upload` o `/api/documents`, no por mutaciones directas desde el browser.
