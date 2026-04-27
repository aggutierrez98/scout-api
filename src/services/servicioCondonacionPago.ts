import { nanoid } from "nanoid";
import { IPerdonarObligacionInput } from "../types";
import { AppError, HttpCode } from "../utils";
import { prismaClient } from "../utils/lib/prisma-client";
import { ServicioObligacionesPago } from "./servicioObligacionesPago";

export class ServicioCondonacionPago {
	private servicioObligaciones = new ServicioObligacionesPago();

	perdonarObligacion = async ({
		obligacionId,
		input,
		userId,
	}: {
		obligacionId: string;
		input: IPerdonarObligacionInput;
		userId: string;
	}) => {
		return (prismaClient as any).$transaction(async (tx: any) => {
			const obligacion = await tx.obligacionPago.findUnique({
				where: { uuid: obligacionId },
				include: {
					imputaciones: {
						select: { montoImputado: true },
					},
				},
			});

			if (!obligacion) {
				throw new AppError({
					name: "OBLIGACION_NO_ENCONTRADA",
					httpCode: HttpCode.NOT_FOUND,
					description: "No existe la obligación de pago solicitada",
				});
			}

			const montoImputado = (obligacion.imputaciones ?? []).reduce(
				(acc: number, item: any) => acc + item.montoImputado,
				0,
			);
			const pendiente = Number((obligacion.montoEsperado - obligacion.montoCondonado - montoImputado).toFixed(2));

			if (pendiente <= 0) {
				throw new AppError({
					name: "OBLIGACION_SIN_SALDO",
					httpCode: HttpCode.BAD_REQUEST,
					description: "La obligación ya no tiene saldo pendiente",
				});
			}

			const montoCondonado = Number((input.montoCondonado ?? pendiente).toFixed(2));
			if (montoCondonado <= 0) {
				throw new AppError({
					name: "MONTO_CONDONACION_INVALIDO",
					httpCode: HttpCode.BAD_REQUEST,
					description: "El monto condonado debe ser mayor a cero",
				});
			}
			if (montoCondonado > pendiente) {
				throw new AppError({
					name: "MONTO_CONDONACION_EXCEDIDO",
					httpCode: HttpCode.BAD_REQUEST,
					description: "El monto condonado no puede superar el saldo pendiente",
				});
			}

			const condonacion = await tx.condonacionPago.create({
				data: {
					uuid: nanoid(10),
					obligacionId,
					montoCondonado,
					motivo: input.motivo,
					condonadoPorUserId: userId,
				},
				include: {
					condonadoPorUser: {
						select: {
							uuid: true,
							username: true,
						},
					},
				},
			});

			await tx.obligacionPago.update({
				where: { uuid: obligacionId },
				data: {
					montoCondonado: { increment: montoCondonado },
				},
			});
			await this.servicioObligaciones.recalcularEstadoObligacion(obligacionId, tx);

			return {
				id: condonacion.uuid,
				obligacionId,
				montoCondonado: condonacion.montoCondonado,
				motivo: condonacion.motivo,
				fecha: condonacion.fecha,
				condonadoPor: condonacion.condonadoPorUser
					? {
						id: condonacion.condonadoPorUser.uuid,
						username: condonacion.condonadoPorUser.username,
					}
					: null,
			};
		});
	};
}
