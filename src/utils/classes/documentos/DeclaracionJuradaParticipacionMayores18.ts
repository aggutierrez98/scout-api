import { Scout } from "@prisma/client";
import { StandardFonts } from "pdf-lib";
import { TipoEventoType } from "../../../types";
import { BaseConstructorProps, PdfDocument } from "./PdfDocument";
import { prismaClient } from "../../lib/prisma-client";
import { AppError, HttpCode } from "../AppError";
import { SecretsManager } from "../SecretsManager";
import { StraighThroughLine } from "../../lib/pdf-lib";

const datosGrupo = SecretsManager.getInstance().getDatosGrupo();
const PARTIDO_DOMICILIO = "Tres de febrero";

const EVENT_TYPE_LINES: Record<TipoEventoType, StraighThroughLine> = {
    SALIDA: {
        start: { x: 147.98, y: 556.4 },
        end: { x: 183.53, y: 554.2 },
    },
    ACANTONAMIENTO: {
        start: { x: 193.97, y: 556.4 },
        end: { x: 288.19, y: 554.2 },
    },
    CAMPAMENTO: {
        start: { x: 294.83, y: 556.4 },
        end: { x: 366.49, y: 554.2 },
    },
};

interface ConstructorProps extends BaseConstructorProps {
    scoutId?: string
    fechaEventoComienzo?: Date
    fechaEventoFin?: Date
    lugarEvento?: string
    tipoEvento?: TipoEventoType
    transporteContratadoOpcion?: "SI" | "NO"
    transporteAlternativoDescripcion?: string
    transporteLlegadaDiaHorario?: string
    transporteRetiroDiaHorario?: string
    transporteCelularContacto?: string
    avalAclaracion?: string
    avalDni?: string
    avalFuncionGrupoScout?: string
}

interface Data {
    scoutId?: string
    scout?: Scout
    fechaEventoComienzo?: Date
    fechaEventoFin?: Date
    lugarEvento?: string
    tipoEvento?: TipoEventoType
    transporteContratadoOpcion?: "SI" | "NO"
    transporteAlternativoDescripcion?: string
    transporteLlegadaDiaHorario?: string
    transporteRetiroDiaHorario?: string
    transporteCelularContacto?: string
    avalAclaracion?: string
    avalDni?: string
    avalFuncionGrupoScout?: string
}

const splitDate = (date?: Date) => {
    if (!date) return { day: "", month: "", year: "" };

    const [day = "", month = "", year = ""] = date.toLocaleDateString("es-AR").split("/");
    return { day, month, year };
};

const formatDate = (date?: Date) => date ? date.toLocaleDateString("es-AR") : "";

const splitLugarEvento = (lugarEvento?: string) => {
    if (!lugarEvento) return { line1: "", line2: "" };

    const normalizedLugar = lugarEvento.replace(/\s+/g, " ").trim();
    if (!normalizedLugar) return { line1: "", line2: "" };

    const commaIndex = normalizedLugar.indexOf(",");
    if (commaIndex > 0 && commaIndex < 26) {
        return {
            line1: normalizedLugar.slice(0, commaIndex).trim(),
            line2: normalizedLugar.slice(commaIndex + 1).trim(),
        };
    }

    if (normalizedLugar.length <= 26) {
        return { line1: normalizedLugar, line2: "" };
    }

    const words = normalizedLugar.split(" ");
    const line1Words: string[] = [];
    const line2Words: string[] = [];

    for (const word of words) {
        const nextLine1 = [...line1Words, word].join(" ");
        if (nextLine1.length <= 26 || line1Words.length === 0) {
            line1Words.push(word);
            continue;
        }

        line2Words.push(word);
    }

    return {
        line1: line1Words.join(" "),
        line2: line2Words.join(" "),
    };
};

const getEventTypeStrikeThroughLines = (tipoEvento?: TipoEventoType) => {
    if (!tipoEvento) return [];

    return (Object.keys(EVENT_TYPE_LINES) as TipoEventoType[])
        .filter((eventType) => eventType !== tipoEvento)
        .map((eventType) => EVENT_TYPE_LINES[eventType]);
};

export class DeclaracionJuradaParticipacionMayores18 extends PdfDocument {
    data: Data

    constructor({ scoutId, fechaEventoComienzo, fechaEventoFin, lugarEvento, tipoEvento, transporteContratadoOpcion, transporteAlternativoDescripcion, transporteLlegadaDiaHorario, transporteRetiroDiaHorario, transporteCelularContacto, avalAclaracion, avalDni, avalFuncionGrupoScout, data, ...props }: ConstructorProps) {
        super(props)
        this.data = {
            scoutId,
            fechaEventoComienzo,
            fechaEventoFin,
            lugarEvento,
            tipoEvento,
            transporteContratadoOpcion,
            transporteAlternativoDescripcion,
            transporteLlegadaDiaHorario,
            transporteRetiroDiaHorario,
            transporteCelularContacto,
            avalAclaracion,
            avalDni,
            avalFuncionGrupoScout,
            ...data,
        }
        this.options = {
            fontColor: "#000000",
            fontFamily: StandardFonts.Helvetica,
        }
    }

    async getData() {
        const scout = await prismaClient.scout.findUnique({
            where: {
                uuid: this.data.scoutId,
            },
        });

        if (!scout) throw new AppError({
            name: "NOT_FOUND",
            httpCode: HttpCode.BAD_REQUEST,
            description: "No se encontraron datos del scout para completar la declaración jurada de participación para mayores de 18 años",
        });

        this.data = {
            ...this.data,
            scout,
        };
    }

    mapData() {
        const scout = this.data.scout!;
        const fechaDeclaracion = splitDate(new Date());
        const fechaNacimiento = splitDate(scout.fechaNacimiento);
        const lugarEvento = splitLugarEvento(this.data.lugarEvento);
        const strikeThroughLines = getEventTypeStrikeThroughLines(this.data.tipoEvento);

        return {
            declaracion_localidad: scout.localidad || "",
            declaracion_partido_departamento: PARTIDO_DOMICILIO,
            declaracion_provincia: scout.provincia || "",
            declaracion_fecha_dia: fechaDeclaracion.day,
            declaracion_fecha_mes: fechaDeclaracion.month,
            declaracion_fecha_anio: fechaDeclaracion.year,
            participante_nombre_completo: `${scout.nombre} ${scout.apellido}`.trim(),
            participante_nacionalidad: scout.nacionalidad || "",
            participante_nacimiento_dia: fechaNacimiento.day,
            participante_nacimiento_mes: fechaNacimiento.month,
            participante_nacimiento_anio: fechaNacimiento.year,
            participante_dni: scout.dni,
            participante_telefono: scout.telefono || "",
            participante_domicilio: [scout.direccion, scout.localidad].filter(Boolean).join(", "),
            participacion_desde: formatDate(this.data.fechaEventoComienzo),
            participacion_hasta: formatDate(this.data.fechaEventoFin),
            participacion_lugar_linea_1: lugarEvento.line1,
            participacion_lugar_linea_2: lugarEvento.line2,
            grupo_numero: datosGrupo.numero,
            educadores_nombre: datosGrupo.nombre,
            distrito_numero: datosGrupo.distrito,
            zona_numero: datosGrupo.zona,
            transporte_contratado_opcion: this.data.transporteContratadoOpcion || "",
            transporte_alternativo_descripcion: this.data.transporteAlternativoDescripcion || "",
            transporte_llegada_dia_horario: this.data.transporteLlegadaDiaHorario || "",
            transporte_retiro_dia_horario: this.data.transporteRetiroDiaHorario || "",
            transporte_celular_contacto: this.data.transporteCelularContacto || "",
            aval_aclaracion: this.data.avalAclaracion || "",
            aval_dni: this.data.avalDni || "",
            aval_funcion_grupo_scout: this.data.avalFuncionGrupoScout || "",
            "ST-tipo_evento": strikeThroughLines,
        }
    }

    get uploadFolder() {
        return `${this.data.scoutId || ""}/`
    }

    async sign({ returnBase64 }: { returnBase64?: boolean }) {
        if (returnBase64) return this.buffer.toString("base64");
    }
}
