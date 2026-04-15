import { nanoid } from "nanoid";
import * as XLSX from "xlsx";
import { FuncionType, IPago, IPagoData, MetodosPagoType, ProgresionType, RamasType } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapPago } from "../mappers/pago";
import { mapPartialScout } from "../mappers/scout";

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
	};
};

interface IPagoService {
	insertPago: (pago: IPago) => Promise<IPagoData | null>;
	getPagos: ({ limit, offset, filters }: queryParams) => Promise<IPagoData[]>;
	getPago: (id: string) => Promise<IPagoData | null>;
	updatePago: (id: string, dataUpdated: IPago) => Promise<IPagoData | null>;
	deletePago: (id: string) => Promise<IPagoData | null>;
}

export class PagoService implements IPagoService {
	insertPago = async (pago: IPago) => {
		const responseInsert = await prismaClient.pago.create({
			data: {
				...pago,
				uuid: nanoid(10),
				concepto: pago.concepto.toLocaleUpperCase(),
				scoutId: pago.scoutId,
			},
		});
		return mapPago(responseInsert) as any;
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
			ramas
		} = filters;

		const responseItem = await prismaClient.pago.findMany({
			skip: offset,
			take: limit,
			orderBy: { fechaPago: "desc" },
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
					uuid: scoutId
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
								{
									nombre: {
										contains: nombre,
									},
								},
								{
									apellido: {
										contains: nombre,
									},
								},
							],
						}
					},
					{
						concepto: {
							contains: concepto,
						},
					}
				],
			},
		});
		return responseItem.map(pago => mapPago(pago));
	}; getPago = async (id: string) => {
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
				},
			});

			if (!responseItem) return null;

			const { scout, ...pago } = responseItem;
			return {
				...mapPago(pago),
				scout: mapPartialScout(scout)
			} as any;
		} catch (error) {
			return null;
		}
	};

	updatePago = async (id: string, { scoutId, ...dataUpdated }: IPago) => {
		const responseItem = await prismaClient.pago.update({
			where: { uuid: id },
			data: {
				...dataUpdated,
				scoutId: scoutId,
			},
		});

		return mapPago(responseItem) as any;
	};

	deletePago = async (id: string) => {
		const responseItem = await prismaClient.pago.delete({ where: { uuid: id } });
		return mapPago(responseItem) as any;
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

		const ramaMap: Record<string, string> = {
			Manada: "MANADA",
			Unidad: "SCOUTS",
			Caminantes: "CAMINANTES",
			Rovers: "ROVERS",
		};

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const fila = i + 2; // +2: fila 1 es el header

			const fechaStr = row["Fecha"]?.trim();
			const nombreStr = row["Nombre"]?.trim();
			const ramaStr = row["Rama"]?.trim();
			const conceptoStr = row["Concepto"]?.trim();
			const montoRaw = row["Monto"]?.trim();
			const metodoPagoRaw = row["Metodo de pago"]?.trim();

			// Saltear filas vacías
			if (!fechaStr && !nombreStr && !conceptoStr) continue;

			if (!fechaStr || !nombreStr || !conceptoStr || !montoRaw || !metodoPagoRaw) {
				errors.push({ fila, nombre: nombreStr || "(vacío)", razon: "Faltan campos requeridos" });
				continue;
			}

			// Parsear fecha DD/MM/YYYY o D/M/YYYY
			const dateParts = fechaStr.split("/");
			if (dateParts.length !== 3) {
				errors.push({ fila, nombre: nombreStr, razon: `Fecha inválida: ${fechaStr}` });
				continue;
			}
			const [day, month, year] = dateParts.map(Number);
			const fechaPago = new Date(year, month - 1, day);
			if (isNaN(fechaPago.getTime())) {
				errors.push({ fila, nombre: nombreStr, razon: `Fecha inválida: ${fechaStr}` });
				continue;
			}

			// Parsear monto formato argentino: " $45.000,00" → 45000
			const montoStr = montoRaw.replace(/\s/g, "").replace("$", "").replace(/\./g, "").replace(",", ".");
			const monto = parseFloat(montoStr);
			if (isNaN(monto) || monto <= 0) {
				errors.push({ fila, nombre: nombreStr, razon: `Monto inválido: ${montoRaw}` });
				continue;
			}

			const metodoPago = metodoPagoMap[metodoPagoRaw] ?? "OTRO";

			// Buscar scout: primero por DNI, luego por nombre + rama
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

				const rama = ramaMap[ramaStr] ?? undefined;

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
				await prismaClient.pago.create({
					data: {
						uuid: nanoid(10),
						concepto: conceptoStr.substring(0, 50).toUpperCase(),
						monto,
						metodoPago,
						scoutId: scoutUuid,
						fechaPago,
						rendido: false,
					},
				});
				createdCount++;
			} catch {
				errors.push({ fila, nombre: nombreStr, razon: "Error al insertar el pago" });
			}
		}

		return { created: createdCount, errors };
	};
}
