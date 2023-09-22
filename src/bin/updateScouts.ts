import { PrismaClient, Progresion, Funcion, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import ProgressBar from "progress";
import { parseDMYtoDate } from "../utils";
import { ReligionType, ScoutXLSX } from "../types";
const prisma = new PrismaClient();

const insertScouts = async () => {
	try {
		console.time("Tiempo de ejecucion");
		console.log(
			"------------ INICIANDO SCRIPT DE ACTUALIZACION SCOUTS -------------\n",
		);

		const file = XLSX.readFile("scouts.xlsx");
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
			const fechaNacimiento = parseDMYtoDate(scoutXLSX["Fecha Nacimiento"]);
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
			)?.id;

			scouts.push({
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

			bar.tick(1);
		}

		console.log(`\n-> Cargando ${scouts.length} scouts a la bd...`);
		await prisma.$queryRaw`ALTER TABLE scouts AUTO_INCREMENT = 1`;
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
