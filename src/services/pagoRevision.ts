import { nanoid } from "nanoid";
import { IWebhookComprobanteDatos, TipoConflicto } from "../types/webhook";
import { prismaClient } from "../utils/lib/prisma-client";
import { AppError, HttpCode } from "../utils";
import { ServicioImputacionPago } from "./servicioImputacionPago";

interface ConflictoDetalle {
  familiarId?: string | null;
  scoutIds?: string[];
  mensaje: string;
  metodoResolucion?: string;
  confianza?: string | null;
  [key: string]: unknown;
}

export class ServicioPagoRevision {
  private servicioImputacion = new ServicioImputacionPago();

  crearRevision = async ({
    pagoId,
    tipoConflicto,
    conflicto,
    datosComprobante,
  }: {
    pagoId?: string | null;
    tipoConflicto: TipoConflicto;
    conflicto: ConflictoDetalle;
    datosComprobante: IWebhookComprobanteDatos;
  }) => {
    return (prismaClient as any).pagoRevision.create({
      data: {
        uuid: nanoid(10),
        pagoId: pagoId ?? null,
        tipoConflicto,
        conflicto,
        datosComprobante,
      },
    });
  };

  listarPendientes = async ({
    offset = 0,
    limit = 20,
    tipoConflicto,
  }: {
    offset?: number;
    limit?: number;
    tipoConflicto?: TipoConflicto;
  } = {}) => {
    const where: any = { estado: "PENDIENTE" };
    if (tipoConflicto) where.tipoConflicto = tipoConflicto;

    const [items, total] = await Promise.all([
      (prismaClient as any).pagoRevision.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { fechaCreacion: "asc" },
        include: {
          pago: {
            select: { uuid: true, monto: true, concepto: true, fechaPago: true },
          },
        },
      }),
      (prismaClient as any).pagoRevision.count({ where }),
    ]);

    return { items, total };
  };

  obtenerRevision = async (revisionId: string) => {
    const item = await (prismaClient as any).pagoRevision.findUnique({
      where: { uuid: revisionId },
      include: {
        pago: {
          select: { uuid: true, monto: true, concepto: true, fechaPago: true, scoutId: true },
        },
      },
    });
    if (!item) return null;
    return item;
  };

  resolverManualmente = async ({
    revisionId,
    scoutId,
    userId,
  }: {
    revisionId: string;
    scoutId: string;
    userId: string;
  }) => {
    const revision = await (prismaClient as any).pagoRevision.findUnique({
      where: { uuid: revisionId },
      include: { pago: true },
    });

    if (!revision) {
      throw new AppError({
        name: "REVISION_NO_ENCONTRADA",
        httpCode: HttpCode.NOT_FOUND,
        description: "No se encontró la revisión solicitada",
      });
    }

    if (revision.estado === "RESUELTO") {
      throw new AppError({
        name: "REVISION_YA_RESUELTA",
        httpCode: HttpCode.UNPROCESSABLE_ENTITY,
        description: "Esta revisión ya fue resuelta",
      });
    }

    const datos = revision.datosComprobante as IWebhookComprobanteDatos;
    let pagoId: string | null = revision.pagoId;

    if (datos.monto === null) {
      throw new AppError({
        name: 'MONTO_NO_DISPONIBLE',
        httpCode: HttpCode.UNPROCESSABLE_ENTITY,
        description: 'El monto del comprobante no fue extraído automáticamente. Registrá el pago manualmente.',
      });
    }

    // Si el pago existe pero sin scout (huérfano), asignarlo
    if (revision.pago) {
      await prismaClient.pago.update({
        where: { uuid: revision.pago.uuid },
        data: { scoutId },
      });
      pagoId = revision.pago.uuid;
    } else {
      // Crear el pago ahora que sabemos el scout
      const concepto = datos.concepto ?? `TRANSFERENCIA ${datos.banco_emisor ?? "DESCONOCIDO"}`;
      const nuevoPago = await prismaClient.pago.create({
        data: {
          uuid: nanoid(10),
          scoutId,
          concepto: concepto.toUpperCase().slice(0, 50),
          monto: datos.monto!,
          metodoPago: "TRANSFERENCIA",
          fechaPago: datos.fecha ? new Date(datos.fecha) : new Date(),
          rendido: false,
        },
      });
      pagoId = nuevoPago.uuid;
    }

    // Imputar el pago a obligaciones
    await this.servicioImputacion.imputarPago(pagoId!);

    // Marcar la revisión como resuelta
    await (prismaClient as any).pagoRevision.update({
      where: { uuid: revisionId },
      data: {
        estado: "RESUELTO",
        fechaResolucion: new Date(),
        resueltoPorId: userId,
        pagoId,
      },
    });

    return { revisionId, pagoId, scoutId };
  };

  /**
   * Acepta un pago de cuenta inválida: marca rendido:true en el pago existente
   * y lo imputa a obligaciones. Solo aplica a revisiones CUENTA_INVALIDA.
   */
  aceptarRevision = async ({ revisionId, userId }: { revisionId: string; userId: string }) => {
    const revision = await (prismaClient as any).pagoRevision.findUnique({
      where: { uuid: revisionId },
      include: { pago: true },
    });

    if (!revision) {
      throw new AppError({ name: "REVISION_NO_ENCONTRADA", httpCode: HttpCode.NOT_FOUND, description: "No se encontró la revisión" });
    }
    if (revision.estado !== "PENDIENTE") {
      throw new AppError({ name: "REVISION_YA_RESUELTA", httpCode: HttpCode.UNPROCESSABLE_ENTITY, description: "Esta revisión ya fue procesada" });
    }
    if (revision.tipoConflicto !== "CUENTA_INVALIDA") {
      throw new AppError({ name: "ACCION_INVALIDA", httpCode: HttpCode.BAD_REQUEST, description: "Solo se puede aceptar revisiones de tipo CUENTA_INVALIDA" });
    }

    const datos = revision.datosComprobante as IWebhookComprobanteDatos;
    let pagoId: string | null = revision.pagoId;

    if (revision.pago) {
      // Marcar como rendido el pago existente
      await prismaClient.pago.update({
        where: { uuid: revision.pago.uuid },
        data: { rendido: true },
      });
      pagoId = revision.pago.uuid;
    } else {
      // No había pago todavía (scout desconocido) — no se puede aceptar sin scout
      throw new AppError({ name: "SIN_PAGO_ASOCIADO", httpCode: HttpCode.UNPROCESSABLE_ENTITY, description: "Esta revisión no tiene pago asociado. Usá 'Resolver' para asignar un scout primero." });
    }

    // Imputar a obligaciones
    await this.servicioImputacion.imputarPago(pagoId!);

    await (prismaClient as any).pagoRevision.update({
      where: { uuid: revisionId },
      data: { estado: "RESUELTO", fechaResolucion: new Date(), resueltoPorId: userId },
    });

    return { revisionId, pagoId, accion: "ACEPTADO" };
  };

  /**
   * Rechaza un pago de cuenta inválida: elimina el pago y marca la revisión
   * como RECHAZADO. Solo aplica a revisiones CUENTA_INVALIDA.
   */
  rechazarRevision = async ({ revisionId, userId }: { revisionId: string; userId: string }) => {
    const revision = await (prismaClient as any).pagoRevision.findUnique({
      where: { uuid: revisionId },
      include: { pago: { include: { imputaciones: true, condonaciones: true } } },
    });

    if (!revision) {
      throw new AppError({ name: "REVISION_NO_ENCONTRADA", httpCode: HttpCode.NOT_FOUND, description: "No se encontró la revisión" });
    }
    if (revision.estado !== "PENDIENTE") {
      throw new AppError({ name: "REVISION_YA_RESUELTA", httpCode: HttpCode.UNPROCESSABLE_ENTITY, description: "Esta revisión ya fue procesada" });
    }
    if (revision.tipoConflicto !== "CUENTA_INVALIDA") {
      throw new AppError({ name: "ACCION_INVALIDA", httpCode: HttpCode.BAD_REQUEST, description: "Solo se puede rechazar revisiones de tipo CUENTA_INVALIDA" });
    }

    // Eliminar el pago asociado si existe (y sus imputaciones/condonaciones)
    if (revision.pago) {
      await (prismaClient as any).imputacionPago.deleteMany({ where: { pagoId: revision.pago.uuid } });
      await prismaClient.pago.delete({ where: { uuid: revision.pago.uuid } });
    }

    await (prismaClient as any).pagoRevision.update({
      where: { uuid: revisionId },
      data: { estado: "RECHAZADO", fechaResolucion: new Date(), resueltoPorId: userId, pagoId: null },
    });

    return { revisionId, accion: "RECHAZADO" };
  };
}

