import fileUpload from "express-fileupload"
import { IDocumentoData, PDFDocumentsEnum, TipoEventoType } from "../../../types"
import { AutorizacionRetiro, RetiroData } from "./AutorizacionRetiro"
import { CaratulaLegajo } from "./CaratulaLegajo"
import { AutorizacionUsoImagen } from "./AutorizacionUsoImagen"
import { AutorizacionIngresoMenores } from "./AutorizacionIngresoMenores"
import { AutorizacionSalidasCercanas } from "./AutorizacionSalidasCercanas"
import { AutorizacionEventos } from "./AutorizacionEventos"

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
}

export type PdfModelFunc = (data: FillDocumentoData) => any;
export const PDFDocumentInstantiator: Record<PDFDocumentsEnum, PdfModelFunc> = {
    [PDFDocumentsEnum.CaratulaLegajo]: ({ docData, scoutId, documentoFilled }: FillDocumentoData) => {
        return new CaratulaLegajo({
            documentName: docData.nombre,
            fileUploadId: docData.fileUploadId!,
            documentoFilled: documentoFilled?.data,
            scoutId,
        });
    },
    [PDFDocumentsEnum.AutorizacionUsoImagen]: ({ docData, signature, theme, cicloActividades, scoutId, familiarId, documentoFilled }: FillDocumentoData) => {
        return new AutorizacionUsoImagen({
            documentName: docData.nombre,
            fileUploadId: docData.fileUploadId!,
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
            fileUploadId: docData.fileUploadId!,
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
            fileUploadId: docData.fileUploadId!,
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
            fileUploadId: docData.fileUploadId!,
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
            fileUploadId: docData.fileUploadId!,
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
};