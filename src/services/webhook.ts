import { nanoid } from "nanoid";
import { IWebhookComprobanteDatos, IWebhookResult, TipoConflicto } from "../types/webhook";
import { prismaClient } from "../utils/lib/prisma-client";
import { AppError, HttpCode } from "../utils";
import { ServicioImputacionPago } from "./servicioImputacionPago";
import { ServicioPagoRevision } from "./pagoRevision";

const servicioImputacion = new ServicioImputacionPago();
const servicioRevision = new ServicioPagoRevision();

const scoutSelect = { uuid: true, nombre: true, apellido: true, telefono: true } as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildConcepto(datos: IWebhookComprobanteDatos): string {
  const base = datos.concepto ?? `TRANSFERENCIA ${datos.banco_emisor ?? "DESCONOCIDO"}`;
  return base.toUpperCase().slice(0, 50);
}

function buildFechaPago(datos: IWebhookComprobanteDatos): Date {
  return datos.fecha ? new Date(datos.fecha) : new Date();
}

async function crearPago(scoutId: string, datos: IWebhookComprobanteDatos, rendido = false) {
  return prismaClient.pago.create({
    data: {
      uuid: nanoid(10),
      scoutId,
      concepto: buildConcepto(datos),
      monto: datos.monto!,
      metodoPago: "TRANSFERENCIA",
      fechaPago: buildFechaPago(datos),
      rendido,
    },
  });
}

/**
 * Verifica si el CBU/alias destino está en la lista del ciclo activo.
 * Retorna true si el pago es válido → rendido automático.
 */
async function validarCbu(cbuDestino: string | null | undefined): Promise<boolean> {
  if (!cbuDestino) return false;
  const ciclo = await (prismaClient as any).cicloReglasPago.findFirst({
    where: { activo: true },
    select: { cbusAceptados: true },
  });
  if (!ciclo) return false;
  const cbus: string[] = Array.isArray(ciclo.cbusAceptados)
    ? ciclo.cbusAceptados
    : JSON.parse(ciclo.cbusAceptados ?? "[]");
  return cbus.includes(cbuDestino);
}

/**
 * Dado un conjunto de scoutIds, devuelve el que tiene más obligaciones pendientes.
 */
async function elegirScoutConDeuda(scoutIds: string[]): Promise<string | null> {
  if (scoutIds.length === 0) return null;
  if (scoutIds.length === 1) return scoutIds[0];

  let mejorScout: string | null = null;
  let maxDeuda = -1;

  for (const scoutId of scoutIds) {
    const count = await (prismaClient as any).obligacionPago.count({
      where: { scoutId, estado: { in: ["PENDIENTE", "INCOMPLETO"] } },
    });
    if (count > maxDeuda) {
      maxDeuda = count;
      mejorScout = scoutId;
    }
  }

  return mejorScout;
}

async function crearRevision(
  tipoConflicto: TipoConflicto,
  datos: IWebhookComprobanteDatos,
  extra: Record<string, unknown> = {},
  pagoId?: string | null,
): Promise<IWebhookResult> {
  const revision = await servicioRevision.crearRevision({
    pagoId,
    tipoConflicto,
    conflicto: {
      mensaje: tipoConflicto,
      familiarId: datos.familiarId ?? null,
      scoutIds: datos.scoutIds ?? [],
      metodoResolucion: datos.metodoResolucion ?? "desconocido",
      confianza: datos.confianza ?? null,
      ...extra,
    },
    datosComprobante: datos,
  });

  return {
    pagoId: pagoId ?? null,
    scoutId: null,
    monto: datos.monto,
    concepto: buildConcepto(datos),
    fechaPago: buildFechaPago(datos).toISOString(),
    enRevision: true,
    revisionId: revision.uuid,
  };
}

// ─── Servicio principal ───────────────────────────────────────────────────────

export class WebhookService {
  procesarComprobante = async (datos: IWebhookComprobanteDatos): Promise<IWebhookResult> => {
    if (datos.monto === null) {
      return crearRevision('DATOS_INCOMPLETOS', datos, {
        mensaje: 'El monto no pudo ser extraído del comprobante — requiere revisión manual',
      });
    }

    // ── Validación de CBU/alias destino ──────────────────────────────────────
    // Si el CBU no está en la lista aceptada: pago queda pendiente de revisión.
    const cbuValido = await validarCbu(datos.cbu_alias_destino);
    if (!cbuValido) {
      const scoutIdFallback = datos.scoutId ?? datos.scoutIds?.[0] ?? null;
      let pagoId: string | null = null;

      if (scoutIdFallback) {
        const pago = await crearPago(scoutIdFallback, datos, false);
        pagoId = pago.uuid;
      }

      return crearRevision(
        "CUENTA_INVALIDA",
        datos,
        {
          mensaje: `CBU/alias destino "${datos.cbu_alias_destino ?? "desconocido"}" no está en la lista de cuentas aceptadas`,
          cbuRecibido: datos.cbu_alias_destino ?? null,
        },
        pagoId,
      );
    }

    // CBU válido → todos los pagos se crean como rendido: true
    const rendido = true;

    // ── Caso 1: obligacionId explícita → imputar directamente ────────────────
    if (datos.obligacionId && datos.scoutId) {
      const pago = await crearPago(datos.scoutId, datos, rendido);
      await servicioImputacion.imputarPago(pago.uuid);
      return {
        pagoId: pago.uuid,
        scoutId: datos.scoutId,
        monto: pago.monto,
        concepto: pago.concepto,
        fechaPago: pago.fechaPago.toISOString(),
        enRevision: false,
      };
    }

    // ── Caso 2: scoutId único resuelto ───────────────────────────────────────
    if (datos.scoutId && (!datos.scoutIds || datos.scoutIds.length <= 1)) {
      const scout = await prismaClient.scout.findUnique({
        where: { uuid: datos.scoutId },
        select: scoutSelect,
      });
      if (scout) {
        const pago = await crearPago(scout.uuid, datos, rendido);
        await servicioImputacion.imputarPago(pago.uuid);
        return {
          pagoId: pago.uuid,
          scoutId: scout.uuid,
          monto: pago.monto,
          concepto: pago.concepto,
          fechaPago: pago.fechaPago.toISOString(),
          enRevision: false,
        };
      }
    }

    // ── Caso 3: múltiples scoutIds → elegir por deuda ────────────────────────
    if (datos.scoutIds && datos.scoutIds.length > 1) {
      const scoutIdElegido = await elegirScoutConDeuda(datos.scoutIds);

      if (scoutIdElegido) {
        const sinDeuda = datos.scoutIds.filter(id => id !== scoutIdElegido);
        const pago = await crearPago(scoutIdElegido, datos, rendido);
        await servicioImputacion.imputarPago(pago.uuid);

        if (sinDeuda.length > 0) {
          const otrosConDeuda = await (prismaClient as any).obligacionPago.count({
            where: { scoutId: { in: sinDeuda }, estado: { in: ["PENDIENTE", "INCOMPLETO"] } },
          });
          if (otrosConDeuda > 0) {
            await servicioRevision.crearRevision({
              pagoId: pago.uuid,
              tipoConflicto: "SCOUT_AMBIGUO",
              conflicto: {
                mensaje: "Se resolvió automáticamente al scout con más deuda, pero otros scouts también tenían pendientes",
                familiarId: datos.familiarId ?? null,
                scoutIds: datos.scoutIds,
                scoutElegido: scoutIdElegido,
                metodoResolucion: datos.metodoResolucion ?? "multi-scout",
                confianza: datos.confianza,
              },
              datosComprobante: datos,
            });
          }
        }

        return {
          pagoId: pago.uuid,
          scoutId: scoutIdElegido,
          monto: pago.monto,
          concepto: pago.concepto,
          fechaPago: pago.fechaPago.toISOString(),
          enRevision: false,
        };
      }

      return crearRevision("SCOUT_AMBIGUO", datos, {
        mensaje: "Familiar encontrado con múltiples scouts pero ninguno tiene obligaciones pendientes",
      });
    }

    // ── Caso 4: familiarId con scouts vacíos ────────────────────────────────
    if (datos.familiarId && (!datos.scoutIds || datos.scoutIds.length === 0)) {
      return crearRevision("SIN_SCOUTS_VINCULADOS", datos, {
        mensaje: "Familiar identificado pero sin scouts vinculados en el sistema",
      });
    }

    // ── Caso 5: fallback — buscar por teléfono en scouts ────────────────────
    const normalizePhone = (phone: string) => {
      const digits = phone.replace(/\D/g, "");
      if (digits.startsWith("54")) return digits.slice(2);
      if (digits.startsWith("0")) return digits.slice(1);
      return digits.slice(-10);
    };

    const remitenteSuffix = normalizePhone(datos.whatsapp_remitente);
    const todosLosScouts = await prismaClient.scout.findMany({
      where: { telefono: { not: null } },
      select: scoutSelect,
    });
    const scoutPorTelefono = todosLosScouts.find(
      (s) => normalizePhone(s.telefono!) === remitenteSuffix,
    ) ?? null;

    if (scoutPorTelefono) {
      const pago = await crearPago(scoutPorTelefono.uuid, datos, rendido);
      await servicioImputacion.imputarPago(pago.uuid);
      return {
        pagoId: pago.uuid,
        scoutId: scoutPorTelefono.uuid,
        monto: pago.monto,
        concepto: pago.concepto,
        fechaPago: pago.fechaPago.toISOString(),
        enRevision: false,
      };
    }

    // ── Caso 6: sin identificación ───────────────────────────────────────────
    return crearRevision("SIN_IDENTIFICACION", datos, {
      mensaje: "No se pudo identificar al pagador por ningún método disponible",
    });
  };
}
