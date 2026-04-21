# Crons del sistema

Todos los crons se registran en `src/crons/index.ts` y se inicializan desde `Server.ts` a través de `loadCrons()`.  
La librería utilizada es `node-cron` v3, que soporta IANA timezones de forma nativa.

---

## Estructura

```
src/crons/
├── index.ts            — Registro de todos los crons de notificaciones
├── helpers.ts          — Utilidades de fecha/hora en timezone Argentina
├── cumpleaños.ts       — Cron de cumpleaños (scouts y familiares)
├── eventosReminder.ts  — Cron de recordatorios de eventos
└── cuotaMensual.ts     — Cron de cuota mensual impaga
```

El cron de sincronización de nómina vive directamente en `Server.ts` ya que utiliza `timezone: "UTC"` y pertenece a otro dominio.

---

## Cron 1 — Cumpleaños

**Archivo:** `src/crons/cumpleaños.ts`  
**Schedule:** `0 9 * * *` — todos los días a las 9:00 AM Argentina  
**Timezone:** `America/Argentina/Buenos_Aires`  
**Tipo de aviso:** `CUMPLEAÑOS`

### Comportamiento

1. Obtiene el día/mes actual en horario Argentina (UTC-3).
2. Consulta todos los **Scouts** activos y todos los **Familiares** cuya `fechaNacimiento` coincida con hoy (mes y día) usando `strftime('%m-%d', fechaNacimiento)` en SQLite.
3. Obtiene todos los usuarios activos del sistema.
4. Por cada persona con cumpleaños, crea un `Aviso` dirigido a **todos** los usuarios con:
   - `tipo: "CUMPLEAÑOS"`
   - `referenciaId`: UUID del Scout o Familiar
   - `referenciaTipo`: `"scout"` o `"familiar"`

### Nota para el frontend

El frontend puede usar `referenciaTipo` + `referenciaId` para comparar con el scout/familiar del usuario en sesión y cambiar el mensaje a "¡Feliz cumpleaños!" cuando corresponda.

---

## Cron 2 — Recordatorio de Eventos

**Archivo:** `src/crons/eventosReminder.ts`  
**Schedule:** `0 9 * * *` — todos los días a las 9:00 AM Argentina  
**Timezone:** `America/Argentina/Buenos_Aires`  
**Tipo de aviso:** `EVENTO`

### Comportamiento

El cron ejecuta dos lógicas en cada corrida:

#### 2a. Recordatorio día siguiente a la creación

- Busca eventos `activo = true` cuya `fechaCreacion` cayó **ayer** (en timezone Argentina).
- Resuelve los usuarios destinatarios de los participantes actuales del evento:
  - `JOVEN_PROTAGONISTA` → usuarios de sus **familiares** vinculados.
  - `EDUCADOR` → el **usuario** con ese `scoutId`.
- Envía un aviso: *"Recordatorio: estás anotado en el evento X"*.

#### 2b. Recordatorios N días antes del evento

Los intervalos fijos son: **1, 3, 5, 7 y 14 días antes** de `fechaHoraInicio`.

- Por cada intervalo, busca eventos cuyo `fechaHoraInicio` cae en ese día target (en timezone Argentina).
- Resuelve destinatarios con la misma lógica que 2a.
- Envía un aviso con el texto correspondiente: *"El evento X es mañana / en N días. ¡No te olvides!"*

### Nota

Los participantes se resuelven en el momento de ejecución del cron, no al momento de creación del evento. La notificación inmediata al agregar un participante la maneja `EventoService.addParticipantes()` por separado.

---

## Cron 3 — Cuota Mensual

**Archivo:** `src/crons/cuotaMensual.ts`  
**Schedule:** `0 10 * * 6` — todos los **sábados** a las 10:00 AM Argentina  
**Timezone:** `America/Argentina/Buenos_Aires`  
**Tipo de aviso:** `PAGO_PENDIENTE`

### Comportamiento

1. Determina el mes actual en Argentina. El concepto a buscar es: `"CUOTA DE GRUPO DE [MES]"` (en mayúsculas, ej: `CUOTA DE GRUPO DE ABRIL`).
2. Obtiene todos los **familiares con usuario activo** y sus scouts vinculados.
3. Para cada familiar, verifica si alguno de sus scouts tiene un `Pago` registrado en el mes actual con concepto que contenga la cadena del paso 1.
4. Si **ninguno** pagó → envía un aviso `PAGO_PENDIENTE` al usuario del familiar.
5. Incluye un chequeo anti-duplicado: si ya se envió un aviso `PAGO_PENDIENTE` al mismo usuario hoy, se omite (previene reenvíos por reinicios del proceso).

### Cadencia mensual efectiva

El cron corre todos los sábados. El primer sábado del mes será la primera corrida; los sábados siguientes reenvían si el pago sigue sin registrarse. Al comienzo del mes siguiente, el concepto cambia y el ciclo reinicia.

---

## Cron 4 — Sync de Nómina (existente)

**Archivo:** `Server.ts`  
**Schedule:** `0 10 * * *` — todos los días a las 7:00 AM Argentina (10:00 UTC)  
**Timezone:** `UTC`  
**Descripción:** Sincronización diaria con cruz-del-sur, una hora después del export diario de esa plataforma (6:00 AM).

---

## Helpers de fecha (`src/crons/helpers.ts`)

| Función | Descripción |
|---------|-------------|
| `nowArgentina()` | Devuelve un `Date` cuyas componentes UTC representan la hora actual en Argentina (UTC-3) |
| `startOfDayArg(date)` | 00:00:00 Argentina del día `date`, expresado en UTC |
| `endOfDayArg(date)` | 23:59:59.999 Argentina del día `date`, expresado en UTC |
| `addDaysArg(date, n)` | Suma N días a `date` (en timezone Argentina) |
| `MESES_ES` | Array de nombres de meses en español, en mayúsculas |

---

## Tipos de aviso (`VALID_TIPOS_AVISO`)

| Tipo | Usado en |
|------|----------|
| `CUMPLEAÑOS` | Cron de cumpleaños |
| `EVENTO` | Cron de recordatorio de eventos |
| `PAGO_PENDIENTE` | Cron de cuota mensual |
| `CUSTOM` | Avisos manuales |

## Tipos de referencia (`VALID_REFERENCIA_TIPOS`)

| Tipo | Descripción |
|------|-------------|
| `scout` | Referencia a un Scout (ej: cumpleaños de scout) |
| `familiar` | Referencia a un Familiar (ej: cumpleaños de familiar) |
| `pago` | Referencia a un Pago |
| `evento` | Referencia a un Evento |
