import { nanoid } from "nanoid";
import * as XLSX from "xlsx";
import { FuncionType, IPago, IPagoData, MetodosPagoType, PDFDocumentsEnum, ProgresionType, RamasType } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapPago } from "../mappers/pago";
import { mapPartialScout } from "../mappers/scout";
import { ReciboPago } from "../utils/classes/documentos/ReciboPago";
import { getFileInS3 } from "../utils/lib/s3.util";
import logger from "../utils/classes/Logger";
import { ServicioImputacionPago } from "./servicioImputacionPago";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { normalizeText } from "../utils/helpers/text";

type queryParams = {
	limit?: number;
	offset?: number;
	filters?: {
		nombre?: string;
		scoutId?: string
		tiempoDesde?: Date;
		tiempoHasta?: Date;
		concepto?: string;
		rendido?: string;
		metodoPago?: MetodosPagoType
		funcion?: FuncionType[];
		ramas?: RamasType[];
		equipos?: string[];
		funciones?: FuncionType[];
		progresiones?: ProgresionType[]
		familiarId?: string;
	};
};

interface IPagoService {
	insertPago: (pago: IPago) => Promise<IPagoData | null>;
	getPagos: ({ limit, offset, filters }: queryParams) => Promise<IPagoData[]>;
	getPago: (id: string) => Promise<IPagoData | null>;
	updatePago: (id: string, dataUpdated: IPago) => Promise<IPagoData | null>;
	deletePago: (id: string) => Promise<IPagoData | null>;
	deletePagos: (ids: string[]) => Promise<{ deletedCount: number }>;
}

export class PagoService implements IPagoService {
	private servicioImputacionPago = new ServicioImputacionPago();
	insertPago = async (pago: IPago) => {
		const responseInsert = await prismaClient.pago.create({
			data: {
				...pago,
				uuid: nanoid(10),
				concepto: pago.concepto.toLocaleUpperCase(),
				scoutId: pago.scoutId,
				rendido: pago.metodoPago === "TRANSFERENCIA",
			},
		});

		this.generateRecibo({
			pagoUuid: responseInsert.uuid,
			scoutId: responseInsert.scoutId,
			monto: responseInsert.monto,
			concepto: responseInsert.concepto,
			fechaPago: responseInsert.fechaPago,
		}).catch(err => logger.error(`Error generando recibo para pago ${responseInsert.uuid}: ${err}`));

		this.servicioImputacionPago.imputarPago(responseInsert.uuid)
			.catch((err) => logger.error(`Error imputando pago ${responseInsert.uuid}: ${err}`));

		return mapPago(responseInsert) as any;
	};

	private generateRecibo = async ({
		pagoUuid,
		scoutId,
		monto,
		concepto,
		fechaPago,
	}: {
		pagoUuid: string;
		scoutId: string;
		monto: number;
		concepto: string;
		fechaPago: Date;
	}) => {
		// Obtener próximo número de recibo de forma atómica
		const lastRecibo = await prismaClient.reciboPago.findFirst({
			orderBy: { numeroRecibo: 'desc' },
			select: { numeroRecibo: true },
		});
		const numeroRecibo = (lastRecibo?.numeroRecibo ?? 0) + 1;

		// Buscar primer familiar del scout
		const scoutConFamiliar = await prismaClient.scout.findUnique({
			where: { uuid: scoutId },
			select: {
				familiarScout: {
					include: { familiar: { select: { uuid: true } } },
					take: 1,
				},
			},
		});
		const familiarId = scoutConFamiliar?.familiarScout[0]?.familiar?.uuid;

		// Buscar plantilla del documento ReciboPago
		const documento = await prismaClient.documento.findFirst({
			where: { nombre: PDFDocumentsEnum.ReciboPago },
			select: { nombre: true, googleDriveFileId: true },
		});

		if (!documento?.googleDriveFileId || !familiarId) {
			// Crear el registro sin PDF si faltan datos requeridos
			await prismaClient.reciboPago.create({
				data: { uuid: nanoid(10), numeroRecibo, pagoId: pagoUuid },
			});
			return;
		}

		// Crear registro primero para reservar el numeroRecibo
		const reciboRecord = await prismaClient.reciboPago.create({
			data: { uuid: nanoid(10), numeroRecibo, pagoId: pagoUuid },
		});

		// Generar PDF y subir a S3
		const recibo = new ReciboPago({
			documentName: documento.nombre,
			googleDriveFileId: documento.googleDriveFileId,
			familiarId,
			fechaPago,
			pago: { monto, concepto },
			numeroRecibo,
		});

		await recibo.getData();
		await recibo.fill({});
		await recibo.sign({});
		await recibo.upload();

		await prismaClient.reciboPago.update({
			where: { uuid: reciboRecord.uuid },
			data: { uploadPath: recibo.uploadPath },
		});
	};

	getPagos = async ({ limit = 15, offset = 0, filters = {} }: queryParams) => {
		const {
			nombre = "",
			concepto = "",
			scoutId,
			equipos,
			metodoPago,
			rendido,
			tiempoDesde,
			tiempoHasta,
			funciones,
			progresiones,
			ramas,
			familiarId,
		} = filters;

		const nombreNorm = normalizeText(nombre);
		const conceptoNorm = normalizeText(concepto);

		const responseItem = await prismaClient.pago.findMany({
			skip: offset,
			take: limit,
			orderBy: { fechaPago: "desc" },
			include: {
				scout: {
					select: {
						id: true,
						uuid: true,
						nombre: true,
						apellido: true,
						dni: true,
						funcion: true,
						fechaNacimiento: true,
						sexo: true,
						telefono: true,
					},
				},
			},
			where: {
				metodoPago: metodoPago || undefined,
				scout: {
					equipo: {
						uuid: equipos ? { in: equipos } : undefined,
					},
					progresionActual: {
						in: progresiones,
					},
					funcion: {
						in: funciones,
					},
					rama: {
						in: ramas,
					},
					uuid: scoutId,
					familiarScout: familiarId
						? { some: { familiarId } }
						: undefined,
				},
				rendido: rendido ? rendido === "true" ? true : false : undefined,
				fechaPago: {
					lte: tiempoHasta,
					gte: tiempoDesde,
				},
				OR: [
					{
						scout: {
							OR: [
								{ nombreNormalizado: { contains: nombreNorm } },
								{ apellidoNormalizado: { contains: nombreNorm } },
							],
						}
					},
					{
						concepto: {
							contains: conceptoNorm,
						},
					}
				],
			},
		});
		return responseItem.map(({ scout, ...pago }) => ({
			...mapPago(pago),
			scout: mapPartialScout(scout),
		}));
	};

	getPago = async (id: string) => {
		try {
			const responseItem = await prismaClient.pago.findUnique({
				where: { uuid: id },
				include: {
					scout: {
						select: {
							id: true,
							uuid: true,
							nombre: true,
							apellido: true,
							dni: true,
							funcion: true,
							fechaNacimiento: true,
							sexo: true,
							telefono: true,
						},
					},
					reciboPago: {
						select: {
							numeroRecibo: true,
							uploadPath: true,
							fechaCreacion: true,
						},
					},
				},
			});

			if (!responseItem) return null;

			const { scout, reciboPago, ...pago } = responseItem;

			let fileUrl: string | null = null;
			if (reciboPago?.uploadPath) {
				fileUrl = (await getFileInS3(reciboPago.uploadPath)) ?? null;
			}

			return {
				...mapPago(pago),
				scout: mapPartialScout(scout),
				reciboPago: reciboPago
					? { ...reciboPago, fileUrl }
					: null,
			} as any;
		} catch (error) {
			return null;
		}
	};

	updatePago = async (id: string, { scoutId, ...dataUpdated }: IPago) => {
		const responseItem = await prismaClient.pago.update({
			where: { uuid: id },
			data: { ...dataUpdated, scoutId },
			include: {
				scout: {
					select: {
						id: true, uuid: true, nombre: true, apellido: true,
						dni: true, funcion: true, fechaNacimiento: true,
						sexo: true, telefono: true,
					},
				},
			},
		});

		const { scout, ...pago } = responseItem;
		return { ...mapPago(pago), scout: mapPartialScout(scout) } as any;
	};

	deletePago = async (id: string) => {
		const responseItem = await prismaClient.pago.delete({ where: { uuid: id } });
		return mapPago(responseItem) as any;
	};

	deletePagos = async (ids: string[]) => {
		const uniqueIds = [...new Set(ids)];
		return prismaClient.$transaction(async (tx) => {
			const existingCount = await tx.pago.count({
				where: { uuid: { in: uniqueIds } },
			});

			if (existingCount !== uniqueIds.length) {
				throw new AppError({
					name: "NOT_FOUND",
					httpCode: HttpCode.NOT_FOUND,
					description: "Uno o más pagos no existen",
				});
			}

			const { count } = await tx.pago.deleteMany({
				where: { uuid: { in: uniqueIds } },
			});

			return { deletedCount: count };
		});
	};

	importPagos = async (csvBuffer: Buffer): Promise<{ created: number; errors: Array<{ fila: number; nombre: string; razon: string }> }> => {
		const workbook = XLSX.read(csvBuffer, { type: "buffer" });
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });

		let createdCount = 0;
		const errors: Array<{ fila: number; nombre: string; razon: string }> = [];

		const metodoPagoMap: Record<string, string> = {
			Transferencia: "TRANSFERENCIA",
			Efectivo: "EFECTIVO",
		};

		const ramaMap: Record<string, RamasType> = {
			Manada: "MANADA",
			Unidad: "SCOUTS",
			Caminantes: "CAMINANTES",
			Rovers: "ROVERS",
		};

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const fila = i + 2;

			const fechaStr = row["Fecha"]?.trim();
			const nombreStr = row["Nombre"]?.trim();
			const ramaStr = row["Rama"]?.trim();
			const conceptoStr = row["Concepto"]?.trim();
			const montoRaw = row["Monto"]?.trim();
			const metodoPagoRaw = row["Metodo de pago"]?.trim();

			if (!fechaStr && !nombreStr && !conceptoStr) continue;

			if (!fechaStr || !nombreStr || !conceptoStr || !montoRaw || !metodoPagoRaw) {
				errors.push({ fila, nombre: nombreStr || "(vacío)", razon: "Faltan campos requeridos" });
				continue;
			}

			const dateParts = fechaStr.split("/");
			if (dateParts.length !== 3) {
				errors.push({ fila, nombre: nombreStr, razon: `Fecha inválida: ${fechaStr}` });
				continue;
			}
			const [day, month, rawYear] = dateParts.map(Number);
			const year = rawYear < 100 ? 2000 + rawYear : rawYear;
			const fechaPago = new Date(year, month - 1, day);
			if (isNaN(fechaPago.getTime())) {
				errors.push({ fila, nombre: nombreStr, razon: `Fecha inválida: ${fechaStr}` });
				continue;
			}

			const montoStr = montoRaw.replace(/\s/g, "").replace("$", "").replace(/\./g, "").replace(",", ".");
			const monto = parseFloat(montoStr);
			if (isNaN(monto) || monto <= 0) {
				errors.push({ fila, nombre: nombreStr, razon: `Monto inválido: ${montoRaw}` });
				continue;
			}

			const metodoPago = metodoPagoMap[metodoPagoRaw] ?? "OTRO";

			let scoutUuid: string | null = null;

			const dniMatch = nombreStr.match(/\(DNI:\s*(\d+)\)/);
			if (dniMatch) {
				const scout = await prismaClient.scout.findUnique({
					where: { dni: dniMatch[1] },
					select: { uuid: true },
				});
				scoutUuid = scout?.uuid ?? null;
			}

			if (!scoutUuid) {
				const cleanName = nombreStr.replace(/\s*\(DNI:.*?\)/, "").trim();
				let apellido = "";
				let primerNombre = "";

				if (cleanName.includes(",")) {
					const [last, rest] = cleanName.split(",");
					apellido = last.trim();
					primerNombre = rest?.trim().split(" ")[0] ?? "";
				} else {
					const parts = cleanName.split(" ");
					primerNombre = parts[0];
					apellido = parts[1] ?? "";
				}

				const rama = ramaStr ? ramaMap[ramaStr] : undefined;

				const scout = await prismaClient.scout.findFirst({
					where: {
						apellido: { contains: apellido },
						nombre: { contains: primerNombre },
						...(rama ? { rama } : {}),
					},
					select: { uuid: true },
				});
				scoutUuid = scout?.uuid ?? null;
			}

			if (!scoutUuid) {
				errors.push({ fila, nombre: nombreStr, razon: "Scout no encontrado" });
				continue;
			}

			try {
				const pagoCreado = await prismaClient.pago.create({
					data: {
						uuid: nanoid(10),
						concepto: conceptoStr.substring(0, 50).toUpperCase(),
						monto,
						metodoPago,
						scoutId: scoutUuid,
						fechaPago,
						rendido: metodoPago === "TRANSFERENCIA",
					},
				});
				await this.servicioImputacionPago.imputarPago(pagoCreado.uuid).catch((err) => {
					logger.error(`Error imputando pago importado ${pagoCreado.uuid}: ${err}`);
				});
				createdCount++;
			} catch {
				errors.push({ fila, nombre: nombreStr, razon: "Error al insertar el pago" });
			}
		}

		return { created: createdCount, errors };
	};
}
