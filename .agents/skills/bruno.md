---
name: scout-api-bruno
description: Mapeo completo de endpoints → archivos Bruno. Carga cuando se modifica cualquier route, controller o validator para garantizar que la colección Bruno se mantenga sincronizada.
triggers:
  - "route"
  - "controller"
  - "validator"
  - "endpoint"
  - "ruta"
  - "controlador"
  - "validador"
  - "bruno"
---

# Scout API — Bruno Collection Sync

## Regla OBLIGATORIA

**Toda vez que agregues, modifiques o elimines un endpoint** (route, controller, validator, o body/params/query), DEBÉS actualizar el archivo `.bru` correspondiente ANTES de considerar el trabajo terminado.

La colección Bruno vive en: `scouts/bruno/scout-api/`

---

## Mapeo Endpoint → Archivo Bruno

### Auth — `scouts/bruno/scout-api/Auth/`

| Endpoint | Archivo |
|----------|---------|
| `POST /api/auth` | `01 Login.bru` |
| `GET /api/auth/renew` | `02 Renew Token.bru` |
| `GET /api/auth/me` | `03 Get Me.bru` |
| `GET /api/auth/notifications` | `04 Get Notifications.bru` |
| `GET /api/auth/users` | `05 Get Users.bru` |
| `GET /api/auth/users/:id` | `06 Get User.bru` |
| `POST /api/auth/create` | `07 Register User.bru` |
| `PUT /api/auth/firstLogin` | `08 First Login.bru` |
| `PUT /api/auth/:id` | `09 Modify User.bru` |

### Scout — `scouts/bruno/scout-api/Scout/`

| Endpoint | Archivo |
|----------|---------|
| `GET /api/scout` | `01 Get Scouts.bru` |
| `GET /api/scout/:id` | `02 Get Scout.bru` |
| `GET /api/scout/by-dni/:dni` | `03 Get Scout by DNI.bru` |
| `POST /api/scout` | `04 Create Scout.bru` |
| `POST /api/scout/import` | `05 Import Scouts.bru` |
| `PUT /api/scout/:id` | `06 Update Scout.bru` |
| `DELETE /api/scout/:id` | `07 Delete Scout.bru` |

### Familiar — `scouts/bruno/scout-api/Familiar/`

| Endpoint | Archivo |
|----------|---------|
| `GET /api/familiar` | `01 Get Familiares.bru` |
| `GET /api/familiar/:id` | `02 Get Familiar.bru` |
| `GET /api/familiar/by-dni/:dni` | `03 Get Familiar by DNI.bru` |
| `POST /api/familiar` | `04 Create Familiar.bru` |
| `PUT /api/familiar/relate/:id` | `05 Relate Familiar.bru` |
| `PUT /api/familiar/unrelate/:id` | `06 Unrelate Familiar.bru` |
| `PUT /api/familiar/:id` | `07 Update Familiar.bru` |
| `DELETE /api/familiar/:id` | `08 Delete Familiar.bru` |

### Equipo — `scouts/bruno/scout-api/Equipo/`

| Endpoint | Archivo |
|----------|---------|
| `GET /api/equipo` | `01 Get Equipos.bru` |
| `GET /api/equipo/:id` | `02 Get Equipo.bru` |
| `POST /api/equipo` | `03 Create Equipo.bru` |
| `PUT /api/equipo/:id` | `04 Update Equipo.bru` |
| `DELETE /api/equipo/:id` | `05 Delete Equipo.bru` |

### Entrega — `scouts/bruno/scout-api/Entrega/`

| Endpoint | Archivo |
|----------|---------|
| `GET /api/entrega` | `01 Get Entregas.bru` |
| `GET /api/entrega/:id` | `02 Get Entrega.bru` |
| `POST /api/entrega` | `03 Create Entrega.bru` |
| `PUT /api/entrega/:id` | `04 Update Entrega.bru` |
| `DELETE /api/entrega/:id` | `05 Delete Entrega.bru` |

### Documento — `scouts/bruno/scout-api/Documento/`

| Endpoint | Archivo |
|----------|---------|
| `GET /api/documento` | `01 Get Documentos.bru` |
| `GET /api/documento/:id` | `02 Get Documento.bru` |
| `GET /api/documento/data` | `03 Get Document Data.bru` |
| `POST /api/documento` | `04 Create Documento.bru` |
| `POST /api/documento/fill` | `05 Fill Document.bru` |
| `POST /api/documento/sign` | `06 Sign Document.bru` |
| `POST /api/documento/upload` | `07 Upload Document.bru` |
| `DELETE /api/documento/:id` | `08 Delete Documento.bru` |

### Pago — `scouts/bruno/scout-api/Pago/`

| Endpoint | Archivo |
|----------|---------|
| `GET /api/pago` | `01 Get Pagos.bru` |
| `GET /api/pago/:id` | `02 Get Pago.bru` |
| `POST /api/pago` | `03 Create Pago.bru` |
| `POST /api/pago/import` | `04 Import Pagos CSV.bru` |
| `PUT /api/pago/:id` | `05 Update Pago.bru` |
| `DELETE /api/pago/:id` | `06 Delete Pago.bru` |

### Nómina — `scouts/bruno/scout-api/Nomina/`

| Endpoint | Archivo |
|----------|---------|
| `POST /api/nomina/sync` | `01 Sync Nomina.bru` |

### Webhook — `scouts/bruno/scout-api/Webhook/`

| Endpoint | Archivo |
|----------|---------|
| `POST /api/webhook/comprobante` | `01 Comprobante.bru` |
| `POST /api/webhook/nomina` | `02 Nomina Webhook.bru` |

---

## Formato de archivo `.bru`

```
meta {
  name: Nombre del request
  type: http
  seq: N
}

get {
  url: {{base_url}}/api/recurso
  body: none
  auth: bearer
}

auth:bearer {
  token: {{token}}
}

params:query {
  ~param: valor   ← prefijo ~ = deshabilitado por defecto
}

params:path {
  id: uuid-de-ejemplo
}

body:json {
  {
    "campo": "valor"
  }
}

body:multipart-form {
  archivo: @file()
}
```

### Autenticación según ruta

| Tipo | Configuración en `.bru` |
|------|------------------------|
| JWT (rutas normales) | `auth: bearer` + bloque `auth:bearer { token: {{token}} }` |
| x-api-key (by-dni) | `auth: none` + header `x-api-key: {{api_key}}` |
| Webhook HMAC | `auth: none` + headers `X-Webhook-Source` y `X-Webhook-Secret` |
| Sin auth (login) | `auth: none` sin headers adicionales |

---

## Qué actualizar según el tipo de cambio

| Cambio | Qué actualizar en Bruno |
|--------|------------------------|
| Nuevo campo en body | Agregar al `body:json {}` del `.bru` correspondiente |
| Nuevo query param | Agregar a `params:query {}` (con `~` si es opcional) |
| Nuevo endpoint | Crear nuevo `.bru` con seq N+1 en la carpeta del recurso |
| Endpoint eliminado | Eliminar el `.bru` correspondiente |
| Ruta renombrada | Actualizar la `url:` en el `.bru` |
| Nuevo recurso completo | Crear carpeta, `meta.bru`, y todos los `.bru` del CRUD |

## Nuevo endpoint — secuencia de creación

Si agregás un endpoint nuevo:

1. Identificar a qué recurso pertenece (o crear carpeta nueva)
2. Crear el `.bru` con el `seq` siguiente al último en esa carpeta
3. Completar `meta`, method block, `auth`, y body/params de ejemplo
4. Si es un recurso nuevo, agregar la carpeta y este mapeo al skill
