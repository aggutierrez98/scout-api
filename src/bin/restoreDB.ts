import { PrismaClient, Progresion, Funcion, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import ProgressBar from "progress";
import { parseDMYtoDate } from "../utils";
import { ReligionType, ScoutXLSX } from "../types";

const prisma = new PrismaClient();

const insertScouts = async () => {
	const file = XLSX.readFile("dbdata/scouts.xlsx");
	const sheet = file.Sheets[file.SheetNames[0]];
	const data: ScoutXLSX[] = XLSX.utils.sheet_to_json(sheet);

	console.log("");
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

		const progresionActual = scoutXLSX.Progresion?.toUpperCase() as Progresion;
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

	await prisma.scout.deleteMany();

	console.log(`-> Cargando ${scouts.length} scouts a la bd...`);
	await prisma.$queryRaw`ALTER TABLE Scout AUTO_INCREMENT = 1`;
	const result = await prisma.scout.createMany({
		data: scouts,
		skipDuplicates: true,
	});

	console.log(`-> Se cararon exitosamente ${result.count} scouts a la bd!`);
};

const insertDocumentos = async () => {
	const file = XLSX.readFile("dbdata/documentos.csv");
	const sheet = file.Sheets[file.SheetNames[0]];
	const data = XLSX.utils.sheet_to_json(sheet);
	const documentosData: Prisma.DocumentoCreateManyInput[] = data.map(
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		(doc: any) => ({ ...doc, vence: doc.vence === 1 }),
	);

	await prisma.documento.deleteMany();

	console.log(`\n-> Cargando ${documentosData.length} documentos a la bd...`);
	await prisma.$queryRaw`ALTER TABLE Documento AUTO_INCREMENT = 1`;
	const result = await prisma.documento.createMany({
		data: documentosData,
		skipDuplicates: true,
	});

	console.log(`-> Se cararon exitosamente ${result.count} documentos a la bd!`);
};

const insertPatrullas = async () => {
	const file = XLSX.readFile("dbdata/patrullas.csv");
	const sheet = file.Sheets[file.SheetNames[0]];
	const patrullasData: Prisma.PatrullaCreateManyInput[] =
		XLSX.utils.sheet_to_json(sheet);

	await prisma.patrulla.deleteMany();

	console.log(`-> Cargando ${patrullasData.length} patrullas a la bd...`);
	await prisma.$queryRaw`ALTER TABLE Patrulla AUTO_INCREMENT = 1`;
	const result = await prisma.patrulla.createMany({
		data: patrullasData,
		skipDuplicates: true,
	});

	console.log(`-> Se cararon exitosamente ${result.count} patrullas a la bd!`);
};

const insertData = async () => {
	try {
		console.time("Tiempo de ejecucion");
		console.log(
			"------------ INICIANDO SCRIPT DE DUMP BASE DE DATOS SCOUTS -------------\n",
		);

		await insertPatrullas();
		await insertDocumentos();
		await insertScouts();

		console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
		console.timeEnd("Tiempo de ejecucion");
	} catch (error) {
		console.log("Error en el script: ", (error as Error).message);
	} finally {
		await prisma.$disconnect();
	}
};

insertData();
