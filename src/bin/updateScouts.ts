import { PrismaClient, Progresion, Funcion, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import ProgressBar from "progress";
import { VALID_RELATIONSHIPS, excelDateToJSDate, parseDMYtoDate } from "../utils";
import { RelacionFamiliarType, ReligionType, ScoutXLSX } from "../types";
import { nanoid } from "nanoid";
const prisma = new PrismaClient();

const insertScouts = async () => {
	try {
		console.time("Tiempo de ejecucion");
		console.log(
			"------------ INICIANDO SCRIPT DE ACTUALIZACION SCOUTS -------------\n",
		);

		const file = XLSX.readFile("dbdata/scouts.xlsx");
		const sheet = file.Sheets[file.SheetNames[0]];
		const data: ScoutXLSX[] = XLSX.utils.sheet_to_json(sheet);

		const bar = new ProgressBar(
			"-> Leyendo scouts desde xlsx: [:bar] :percent - Tiempo restante: :etas",
			{
				total: data.length,
				width: 30,
			},
		);

		const scouts: Prisma.ScoutCreateManyInput[] = [];
		for (const scoutXLSX of data) {
			const [apellido, nombre] = scoutXLSX.Nombre.split(", ");

			let fechaNacimiento = new Date();
			if (typeof scoutXLSX["Fecha Nacimiento"] === "number") {
				fechaNacimiento = excelDateToJSDate(scoutXLSX["Fecha Nacimiento"])
			}
			if (typeof scoutXLSX["Fecha Nacimiento"] === "string") {
				fechaNacimiento = parseDMYtoDate(scoutXLSX["Fecha Nacimiento"])
			}

			const sexo = scoutXLSX.Sexo === "Masculino" ? "M" : "F";
			const funcion: Funcion =
				scoutXLSX.Funcion === "Scout"
					? "JOVEN"
					: scoutXLSX.Funcion === "Jefe"
						? "JEFE"
						: scoutXLSX.Funcion === "Sub-Jefe"
							? "SUBJEFE"
							: scoutXLSX.Funcion === "Ayudante"
								? "AYUDANTE"
								: "COLABORADOR";

			const progresionActual =
				scoutXLSX.Progresion?.toUpperCase() as Progresion;
			const religion = scoutXLSX.Religion?.toUpperCase() as ReligionType;

			const patrullaId = (
				await prisma.patrulla.findFirst({
					where: { nombre: scoutXLSX.Patrulla },
				})
			)?.uuid;

			const id = nanoid(10)

			console.log({ id })

			scouts.push({
				uuid: id,
				nombre,
				apellido,
				fechaNacimiento,
				progresionActual,
				patrullaId,
				funcion: funcion,
				sexo,
				religion,
				dni: scoutXLSX.Documento,
				localidad: scoutXLSX.Localidad,
				direccion: scoutXLSX.Calle,
				telefono: scoutXLSX.Telefono,
				mail: scoutXLSX.Email,
			});

			const familiaresData = Object.keys(scoutXLSX)
				//@ts-ignore
				.filter((key) => VALID_RELATIONSHIPS.includes(key.toLocaleUpperCase()))
				//@ts-ignore
				.map((key) => ({ relacion: key as RelacionFamiliarType, name: scoutXLSX[key] as string }));

			if (familiaresData.length) {
				const familiares: Prisma.FamiliarScoutCreateManyInput[] = [];

				for (const { name, relacion } of familiaresData) {

					const [nombre, apellido] = name.split(" ")

					const familiarId = (
						await prisma.familiar.findFirst({
							where: {
								nombre: {
									contains: nombre
								},
								apellido: {
									contains: apellido
								},
							},
						})
					)?.uuid;

					if (!familiarId) {
						console.log(`El familiar con nombre: ${nombre} no existe en la bd`);
						continue;
					}

					familiares.push({
						familiarId,
						relacion: relacion.toLocaleUpperCase() as RelacionFamiliarType,
						scoutId: id
					})

					console.log(`\n-> Cargando ${familiares.length} familiares a la bd...`);
					// await prisma.$queryRaw`ALTER TABLE familarScout AUTO_INCREMENT = 1`;
					const result = await prisma.familiarScout.createMany({
						data: familiares,
						skipDuplicates: true,
					});

					console.log(`\n-> Se cargaron exitosamente ${result.count} familiares para el scout ${id} a la bd!\n`);
				}
			}

			bar.tick(1);
		}

		console.log(`\n-> Cargando ${scouts.length} scouts a la bd...`);
		await prisma.$queryRaw`ALTER TABLE Scout AUTO_INCREMENT = 1`;
		const result = await prisma.scout.createMany({
			data: scouts,
			skipDuplicates: true,
		});

		console.log(`\n-> Se cararon exitosamente ${result.count} scouts a la bd!`);
		console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
		console.timeEnd("Tiempo de ejecucion");
	} catch (error) {
		console.log("Error en el script: ", (error as Error).message);
	} finally {
		await prisma.$disconnect();
	}
};

insertScouts();
