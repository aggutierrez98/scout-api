import { Familiar, Scout } from "@prisma/client";
import { StandardFonts } from "pdf-lib";
import { BaseConstructorProps, PdfDocument } from "./PdfDocument";
import { prismaClient } from "../../lib/prisma-client";
import { AppError, HttpCode } from "../AppError";
import { SecretsManager } from "../SecretsManager";

const datosGrupo = SecretsManager.getInstance().getDatosGrupo();

interface ConstructorProps extends BaseConstructorProps {
    scoutId?: string
    familiarId?: string
}

interface Data {
    scoutId?: string
    familiarId?: string
    scout?: Scout
    familiar?: Familiar
}

const BLANK_HEALTH_FIELDS = [
    "vacunas_quintuple_fecha",
    "vacunas_triple_bacteriana_celular_fecha",
    "vacunas_triple_bacteriana_acelular_fecha",
    "vacunas_doble_bacteriana_fecha",
    "vacunas_no_tiene_mencionadas",
    "vacunas_no_sabe_no_contesta",
    "salud_medicacion_respuesta",
    "salud_enfermedad_cronica_respuesta",
    "salud_tratamiento_respuesta",
    "salud_cud_respuesta",
    "salud_alergia_respuesta",
    "salud_anticoagulado_respuesta",
    "salud_regimen_dietario_respuesta",
    "salud_panico_ansiedad_respuesta",
    "salud_panico_ansiedad_frecuencia",
    "salud_diagnostico_salud_mental_respuesta",
    "salud_diagnostico_salud_mental_recibe_tratamiento",
    "salud_miedos_fobias_respuesta",
    "control_medico_fecha",
    "antecedentes_hemorragias_nasales",
    "antecedentes_sangrado_encias",
    "antecedentes_dolor_cabeza",
    "antecedentes_presion_alta",
    "antecedentes_presion_baja",
    "antecedentes_transfusiones",
    "antecedentes_convulsiones",
    "antecedentes_cirugias_ultimo_anio",
    "antecedentes_internaciones_ultimo_anio",
    "antecedentes_realiza_actividad_fisica",
    "antecedentes_actividad_fisica_sin_restricciones",
    "antecedentes_no_especificacion",
    "datos_grupo_sanguineo",
    "datos_factor_rh",
    "datos_peso_kg",
    "datos_talla_m",
    "contacto_educador_indicaciones",
    "obra_social_prepaga",
    "obra_social_credencial_numero",
    "obra_social_tel_emergencia",
    "responsable_firma",
    "responsable_fecha_dia",
    "responsable_fecha_mes",
    "responsable_fecha_anio",
] as const;

const getBlankHealthFields = () => BLANK_HEALTH_FIELDS.reduce<Record<string, string>>((acc, fieldName) => ({
    ...acc,
    [fieldName]: "",
}), {});

const splitDate = (date: Date) => {
    const [day, month, year] = date.toLocaleDateString("es-AR").split("/");
    return { day, month, year };
};

const getResponsablePhones = ({
    familiarTelefono,
    scoutTelefono,
}: {
    familiarTelefono?: string | null
    scoutTelefono?: string | null
}) => {
    const telefonoEmergencia1 = familiarTelefono || scoutTelefono || "";
    const telefonoEmergencia2 = scoutTelefono && scoutTelefono !== telefonoEmergencia1
        ? scoutTelefono
        : "";

    return { telefonoEmergencia1, telefonoEmergencia2 };
};

export class DeclaracionJuradaSalud extends PdfDocument {
    data: Data

    constructor({ scoutId, familiarId, data, ...props }: ConstructorProps) {
        super(props)
        this.data = { scoutId, familiarId, ...data }
        this.options = {
            fontColor: "#000000",
            fontFamily: StandardFonts.Helvetica,
        }
    }

    async getData() {
        const familiar = await prismaClient.familiar.findUnique({
            where: {
                uuid: this.data.familiarId,
            },
            include: {
                padreScout: {
                    where: {
                        scoutId: {
                            equals: this.data.scoutId,
                        },
                    },
                    include: {
                        scout: true,
                    },
                },
            },
        });

        const scout = familiar?.padreScout[0]?.scout;

        if (!familiar || !scout) throw new AppError({
            name: "NOT_FOUND",
            httpCode: HttpCode.BAD_REQUEST,
            description: "No se encontraron datos del familiar o del scout para completar la declaración jurada de salud",
        });

        this.data = {
            ...this.data,
            familiar,
            scout,
        };
    }

    mapData() {
        const scout = this.data.scout!;
        const familiar = this.data.familiar!;
        const fechaNacimientoScout = splitDate(scout.fechaNacimiento);
        const { telefonoEmergencia1, telefonoEmergencia2 } = getResponsablePhones({
            familiarTelefono: familiar.telefono,
            scoutTelefono: scout.telefono,
        });
        const nombreResponsable = `${familiar.nombre} ${familiar.apellido}`;
        const domicilioScout = [scout.direccion, scout.localidad].filter(Boolean).join("\n");

        return {
            ...getBlankHealthFields(),
            personal_apellido: scout.apellido,
            personal_nombre: scout.nombre,
            personal_fecha_nacimiento_dia: fechaNacimientoScout.day,
            personal_fecha_nacimiento_mes: fechaNacimientoScout.month,
            personal_fecha_nacimiento_anio: fechaNacimientoScout.year,
            personal_dni: scout.dni,
            personal_numero_zona: datosGrupo.zona,
            personal_numero_distrito: datosGrupo.distrito,
            personal_numero_grupo: datosGrupo.numero,
            personal_domicilio: domicilioScout,
            personal_tel_emergencia_1: telefonoEmergencia1,
            personal_tel_emergencia_2: telefonoEmergencia2,
            responsable_nombre: nombreResponsable,
            responsable_aclaracion: nombreResponsable,
            responsable_dni: familiar.dni,
        };
    }

    get uploadFolder() {
        return `${this.data.scoutId || ""}/`
    }

    async sign() { }
}
