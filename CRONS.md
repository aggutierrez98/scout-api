# Crons del sistema (`scout-api`)

Todos los jobs se registran en:

- `src/crons/index.ts` (notificaciones)
- `Server.ts` (sync diario de nómina)

Timezone principal del negocio: `America/Argentina/Buenos_Aires`.

---

## Resumen de jobs activos

| Job | Schedule | Timezone | Archivo | Dominio |
|---|---|---|---|---|
| Cumpleaños | `0 9 * * *` | `America/Argentina/Buenos_Aires` | `src/crons/cumpleaños.ts` | Notificaciones |
| Recordatorio de eventos | `0 9 * * *` | `America/Argentina/Buenos_Aires` | `src/crons/eventosReminder.ts` | Notificaciones |
| Pagos pendientes | `0 10 * * 6` | `America/Argentina/Buenos_Aires` | `src/crons/cuotaMensual.ts` | Motor de pagos |
| Documentos pendientes | `0 10 * * 6` | `America/Argentina/Buenos_Aires` | `src/crons/documentosPendientes.ts` | Documentación |
| Sync de nómina (pull diario) | `0 10 * * *` | `UTC` (equivale 7:00 ART) | `Server.ts` | Integración cruz-del-sur |

---

## 1) Cumpleaños (`src/crons/cumpleaños.ts`)

- Busca scouts activos y familiares cuyo `fechaNacimiento` coincide con día/mes actual.
- Crea avisos tipo `CUMPLEAÑOS` para usuarios activos del sistema.
- `referenciaTipo`: `scout` o `familiar`.

## 2) Recordatorio de eventos (`src/crons/eventosReminder.ts`)

Ejecuta dos estrategias:

1. **Día siguiente a creación** de evento activo.
2. **Anticipación del evento** para días `[1, 3, 5, 7, 14]` antes de `fechaHoraInicio`.

Destinatarios por participante:

- `JOVEN_PROTAGONISTA` → usuarios de familiares vinculados.
- `EDUCADOR` → usuario con `scoutId` del educador.

Tipo de aviso: `EVENTO`.

## 3) Pagos pendientes (`src/crons/cuotaMensual.ts`)

Cron refactorizado al motor 2026+:

- Fuente: `ServicioPagosPendientes` (`ObligacionPago` con estado pendiente/incompleto).
- Destinatarios:
  1. usuarios de familiares vinculados al scout,
  2. usuario directo del scout (`User.scoutId`).
- Agrupa por usuario y envía resumen con cantidad/monto pendiente.
- Deduplicación diaria por usuario + tipo `PAGO_PENDIENTE`.

## 4) Documentos pendientes (`src/crons/documentosPendientes.ts`)

- Fuente: `DocumentoService.getDocumentosPendientes({ scope: "ALL" })`.
- Considera pendientes faltantes y vencidos anuales.
- Destinatarios: usuarios activos asociados a familiares de scouts con pendientes.
- Tipo de aviso: `DOCUMENTO_PENDIENTE`.
- Deduplicación diaria por usuario + tipo de aviso.

## 5) Sync diario de nómina (`Server.ts`)

- Ejecuta `NominaService.pullAndSync()`.
- Schedule en UTC para sincronizar con export diario de cruz-del-sur.
- Es independiente del módulo `src/crons/index.ts`.

---

## Helpers de fecha

Archivo: `src/crons/helpers.ts`

- `nowArgentina()`
- `startOfDayArg(date)`
- `endOfDayArg(date)`
- `addDaysArg(date, n)`
- `MESES_ES`

Se usan para evitar desfasajes de fecha al evaluar ventanas diarias en ART.
