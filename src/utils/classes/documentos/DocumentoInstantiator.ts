import fileUpload from "express-fileupload"
import { IDocumentoData, PDFDocumentsEnum, TipoEventoType } from "../../../types"
import { AutorizacionRetiro, RetiroData } from "./AutorizacionRetiro"
import { CaratulaLegajo } from "./CaratulaLegajo"
import { AutorizacionUsoImagen } from "./AutorizacionUsoImagen"
import { AutorizacionIngresoMenores } from "./AutorizacionIngresoMenores"
import { AutorizacionSalidasCercanas } from "./AutorizacionSalidasCercanas"
import { AutorizacionEventos } from "./AutorizacionEventos"
import { ReciboPago } from "./ReciboPago"
import { DeclaracionJuradaSalud } from "./DeclaracionJuradaSalud"
import { DeclaracionJuradaParticipacionMayores18 } from "./DeclaracionJuradaParticipacionMayores18"

export type FillDocumentoData = {
    scoutId: string,
    familiarId?: string,
    documentoId?: string
    docData: IDocumentoData
    cicloActividades?: string,
    rangoDistanciaPermiso?: string,
    aclaraciones?: string
    signature?: fileUpload.UploadedFile,
    theme?: "light" | "dark",
    lugarEvento?: string,
    fechaEventoComienzo?: string
    fechaEventoFin?: string,
    tipoEvento?: TipoEventoType
    retiroData?: RetiroData
    confirmation?: boolean
    documentoFilled?: fileUpload.UploadedFile
    fechaPago?: Date,
    transporteContratadoOpcion?: "SI" | "NO"
    transporteAlternativoDescripcion?: string
    transporteLlegadaDiaHorario?: string
    transporteRetiroDiaHorario?: string
    transporteCelularContacto?: string
    avalAclaracion?: string
    avalDni?: string
    avalFuncionGrupoScout?: string
    saludData?: Record<string, string>
    pago?: {
        monto: number
        concepto: string
    }
    numeroRecibo?: number
}

export type PdfModelFunc = (data: FillDocumentoData) => any;
export const PDFDocumentInstantiator: Record<PDFDocumentsEnum, PdfModelFunc> = {
    [PDFDocumentsEnum.CaratulaLegajo]: ({ docData, scoutId, documentoFilled }: FillDocumentoData) => {
        return new CaratulaLegajo({
            documentName: docData.nombre,
            googleDriveFileId: docData.googleDriveFileId!,
            documentoFilled: documentoFilled?.data,
            scoutId,
        });
    },
    [PDFDocumentsEnum.AutorizacionUsoImagen]: ({ docData, signature, theme, cicloActividades, scoutId, familiarId, documentoFilled }: FillDocumentoData) => {
        return new AutorizacionUsoImagen({
            documentName: docData.nombre,
            googleDriveFileId: docData.googleDriveFileId!,
            cicloActividades: cicloActividades!,
            scoutId,
            familiarId: familiarId!,
            documentoFilled: documentoFilled?.data,
            data: {
                signature,
                theme,
            },
        });
    },
    [PDFDocumentsEnum.AutorizacionRetiro]: ({ docData, signature, theme, retiroData, scoutId, familiarId, documentoFilled }: FillDocumentoData) => {
        return new AutorizacionRetiro({
            documentName: docData.nombre,
            googleDriveFileId: docData.googleDriveFileId!,
            scoutId,
            familiarId: familiarId!,
            retiroData: retiroData!,
            documentoFilled: documentoFilled?.data,
            data: {
                theme,
                signature,
            },
        });
    },
    [PDFDocumentsEnum.AutorizacionIngresoMenores]: ({ docData, signature, theme, scoutId, familiarId, documentoFilled, aclaraciones }: FillDocumentoData) => {
        return new AutorizacionIngresoMenores({
            documentName: docData.nombre,
            googleDriveFileId: docData.googleDriveFileId!,
            scoutId,
            familiarId: familiarId!,
            aclaraciones: aclaraciones!,
            documentoFilled: documentoFilled?.data,
            data: {
                signature,
                theme,
            },
        });
    },
    [PDFDocumentsEnum.AutorizacionSalidasCercanas]: ({ docData, signature, theme, scoutId, familiarId, documentoFilled, cicloActividades = "2025", rangoDistanciaPermiso = "5 Kilometros" }: FillDocumentoData) => {
        return new AutorizacionSalidasCercanas({
            documentName: docData.nombre,
            googleDriveFileId: docData.googleDriveFileId!,
            scoutId,
            familiarId: familiarId!,
            cicloActividades,
            rangoDistanciaPermiso,
            documentoFilled: documentoFilled?.data,
            data: {
                signature,
                theme,
            },
        });
    },
    [PDFDocumentsEnum.AutorizacionEventos]: ({ docData, signature, theme, scoutId, familiarId, documentoFilled, fechaEventoComienzo, fechaEventoFin, lugarEvento, tipoEvento }: FillDocumentoData) => {
        return new AutorizacionEventos({
            documentName: docData.nombre,
            googleDriveFileId: docData.googleDriveFileId!,
            scoutId,
            familiarId: familiarId!,
            fechaEventoComienzo: new Date(fechaEventoComienzo!),
            fechaEventoFin: new Date(fechaEventoFin!),
            lugarEvento: lugarEvento!,
            tipoEvento: tipoEvento!,
            documentoFilled: documentoFilled?.data,
            data: {
                signature,
                theme,
            },
        });
    },
    [PDFDocumentsEnum.DeclaracionJuradaSalud]: ({ docData, scoutId, familiarId, documentoFilled, saludData }: FillDocumentoData) => {
        return new DeclaracionJuradaSalud({
            documentName: docData.nombre,
            googleDriveFileId: docData.googleDriveFileId!,
            scoutId,
            familiarId,
            saludData,
            documentoFilled: documentoFilled?.data,
        });
    },
    [PDFDocumentsEnum.DeclaracionJuradaParticipacionMayores18]: ({ docData, scoutId, documentoFilled, fechaEventoComienzo, fechaEventoFin, lugarEvento, tipoEvento, transporteContratadoOpcion, transporteAlternativoDescripcion, transporteLlegadaDiaHorario, transporteRetiroDiaHorario, transporteCelularContacto, avalAclaracion, avalDni, avalFuncionGrupoScout }: FillDocumentoData) => {
        return new DeclaracionJuradaParticipacionMayores18({
            documentName: docData.nombre,
            googleDriveFileId: docData.googleDriveFileId!,
            scoutId,
            fechaEventoComienzo: fechaEventoComienzo ? new Date(fechaEventoComienzo) : undefined,
            fechaEventoFin: fechaEventoFin ? new Date(fechaEventoFin) : undefined,
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
            documentoFilled: documentoFilled?.data,
        });
    },
    [PDFDocumentsEnum.ReciboPago]: ({ docData, familiarId, documentoFilled, fechaPago, pago, numeroRecibo }: FillDocumentoData) => {
        return new ReciboPago({
            documentName: docData.nombre,
            googleDriveFileId: docData.googleDriveFileId!,
            familiarId: familiarId!,
            fechaPago: new Date(fechaPago!),
            pago: pago!,
            numeroRecibo: numeroRecibo!,
            documentoFilled: documentoFilled?.data,
        });
    },
};

const normalizeDocumentName = (documentName: string) =>
    documentName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

export const resolvePdfDocumentInstantiator = (documentName: string) => {
    const directInstantiator = PDFDocumentInstantiator[documentName as PDFDocumentsEnum];
    if (directInstantiator) return directInstantiator;

    switch (normalizeDocumentName(documentName)) {
        case normalizeDocumentName(PDFDocumentsEnum.DeclaracionJuradaSalud):
        case "declaracion jurada de salud":
        case "declaracion jurada salud":
        case "formulario de informacion de salud":
            return PDFDocumentInstantiator[PDFDocumentsEnum.DeclaracionJuradaSalud];
        case normalizeDocumentName(PDFDocumentsEnum.DeclaracionJuradaParticipacionMayores18):
        case "declaracion jurada para participacion de jovenes mayores de 18 anos en salidas acantonamientos campamentos":
        case "declaracion jurada para participacion para jovenes mayores de 18 anos en salidas acantonamientos campamentos":
        case "declaracion jurada participacion mayores de 18":
        case "declaracion jurada mayores de 18":
            return PDFDocumentInstantiator[PDFDocumentsEnum.DeclaracionJuradaParticipacionMayores18];
        default:
            return null;
    }
};
