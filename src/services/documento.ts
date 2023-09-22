import { PrismaClient } from "@prisma/client";
import {
	FuncionType,
	IDocumento,
	IDocumentoData,
	ProgresionType,
	SexoType,
} from "../types";

const prisma = new PrismaClient();
const DocumentoModel = prisma.documentoPresentado;

type getQueryParams = {
	limit?: number;
	offset?: number;
	filters: {
		documento?: string;
		patrulla?: string;
		nombre?: string;
		funcion?: FuncionType[];
		sexo?: SexoType;
		progresion?: ProgresionType[];
	};
};

interface IDocumentoService {
	insertDocumento: (documento: IDocumento) => Promise<IDocumentoData | null>;
	getDocumentos: (params: getQueryParams) => Promise<IDocumentoData[]>;
	getDocumento: (id: string) => Promise<IDocumentoData | null>;
	deleteDocumento: (id: string) => Promise<IDocumentoData | null>;
}

export class DocumentoService implements IDocumentoService {
	insertDocumento = async (documento: IDocumento) => {
		const responseInsert = await DocumentoModel.create({
			data: {
				...documento,
				documentoId: Number(documento.documentoId),
				scoutId: Number(documento.scoutId),
			},
			include: {
				documento: {
					select: {
						nombre: true,
						vence: true,
					},
				},
				scout: {
					select: {
						nombre: true,
						apellido: true,
					},
				},
			},
		});
		return responseInsert;
	};
	getDocumentos = async ({
		limit = 10,
		offset = 0,
		filters = {},
	}: getQueryParams) => {
		const {
			funcion,
			progresion,
			nombre: nombreQuery,
			patrulla,
			sexo,
			documento,
		} = filters;
		const [nombre, apellido] = nombreQuery?.split(" ") || [];

		const responseItem = await DocumentoModel.findMany({
			skip: offset,
			take: limit,
			orderBy: { fechaPresentacion: "desc" },
			include: {
				documento: {
					select: {
						nombre: true,
						vence: true,
					},
				},
				scout: {
					select: {
						nombre: true,
						apellido: true,
					},
				},
			},
			where: {
				OR: [
					{
						scout: {
							OR: [
								{
									nombre: {
										search: nombre,
									},
								},
								{
									apellido: {
										search: apellido,
									},
								},
								{
									patrulla: {
										id: patrulla ? Number(patrulla) : undefined,
									},
								},
								{
									funcion: {
										in: funcion,
									},
								},
								{
									progresionActual: {
										in: progresion,
									},
								},
								{
									sexo,
								},
							],
						},
					},
					{
						documento: {
							id: documento ? Number(documento) : undefined,
						},
					},
				],
			},
		});
		return responseItem;
	};
	getDocumento = async (id: string) => {
		try {
			const responseItem = await DocumentoModel.findUnique({
				where: { id: Number(id) },
				include: {
					documento: {
						select: {
							nombre: true,
							vence: true,
						},
					},
					scout: {
						select: {
							nombre: true,
							apellido: true,
						},
					},
				},
			});

			return responseItem;
		} catch (error) {
			return null;
		}
	};
	deleteDocumento = async (id: string) => {
		const responseItem = await DocumentoModel.delete({
			where: { id: Number(id) },
			include: {
				documento: {
					select: {
						nombre: true,
						vence: true,
					},
				},
				scout: {
					select: {
						nombre: true,
						apellido: true,
					},
				},
			},
		});
		return responseItem;
	};
}
