import { EstadosType, ProgresionType, ReligionType, ScoutXLSX } from "../../types";
import { excelDateToJSDate, parseDMYtoDate } from "./helpers";
import { prismaClient } from "../lib/prisma-client";
import { getFuncion, getRamaFromNomina } from "./getFuncion";

export const mapXLSXScoutToScoutData = async (scoutData: Partial<ScoutXLSX>) => {
    // El formato del archivo de nómina es siempre "Apellido, Nombre".
    // Usamos límite 2 para manejar apellidos compuestos con coma (e.g. "García, López, Juan")
    // y trimmeamos para eliminar espacios sobrantes en las celdas.
    const separatorIndex = scoutData.Nombre!.indexOf(", ");
    const apellido = separatorIndex >= 0
        ? scoutData.Nombre!.slice(0, separatorIndex).trim()
        : scoutData.Nombre!.trim();
    const nombre = separatorIndex >= 0
        ? scoutData.Nombre!.slice(separatorIndex + 2).trim()
        : "";
    let fechaNacimiento = new Date();
    if (typeof scoutData["Fecha Nacimiento"] === "number") {
        fechaNacimiento = excelDateToJSDate(scoutData["Fecha Nacimiento"])
    }
    if (typeof scoutData["Fecha Nacimiento"] === "string") {
        fechaNacimiento = parseDMYtoDate(scoutData["Fecha Nacimiento"])
    }

    const sexo = scoutData.Sexo === "Masculino" ? "M" : "F";
    const funcion = getFuncion(scoutData.Funcion)
    const rama = getRamaFromNomina(scoutData.Rama)
    const progresionActual = scoutData.Progresion?.toUpperCase() as ProgresionType;
    const religion = scoutData.Religion?.toUpperCase() as ReligionType;
    const estado = scoutData.Estado?.toLocaleUpperCase() as EstadosType
    const dni = String(scoutData.Documento)
    const telefono = String(scoutData.Telefono)

    let equipoId = scoutData.Equipo
    if (scoutData.Equipo) {
        equipoId = (await prismaClient.equipo.findFirst({
            where: {
                nombre: scoutData.Equipo
            },
        }))?.uuid;
    }

    // console.log({
    //     nombre,
    //     apellido,
    //     sexo,
    //     fechaNacimiento,
    //     religion,
    //     dni,
    //     telefono,
    //     progresionActual,
    //     funcion,
    //     rama,
    //     estado,
    //     equipoId,
    //     mail: scoutData.Email,
    //     localidad: scoutData.Localidad ?? "",
    //     nacionalidad: scoutData.Nacionalidad ?? "",
    //     provincia: scoutData.Provincia ?? "",
    //     direccion: scoutData.Calle ?? "",
    // });

    return ({
        nombre,
        apellido,
        sexo,
        fechaNacimiento,
        religion,
        dni,
        telefono,
        progresionActual,
        funcion,
        rama,
        estado,
        equipoId,
        mail: scoutData.Email,
        localidad: scoutData.Localidad ?? "",
        nacionalidad: scoutData.Nacionalidad ?? "",
        provincia: scoutData.Provincia ?? "",
        direccion: scoutData.Calle ?? "",
    });

}