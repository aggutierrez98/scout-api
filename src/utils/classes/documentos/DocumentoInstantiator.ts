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
}

export type PdfModelFunc = (data: FillDocumentoData) => any;
export const PDFDocumentInstantiator: Record<PDFDocumentsEnum, PdfModelFunc> = {
    [PDFDocumentsEnum.CaratulaLegajo]: ({ docData, scoutId }: FillDocumentoData) => {
        return new CaratulaLegajo({
            documentName: docData.nombre,
            fileUploadId: docData.fileUploadId!,
            scoutId,
        });
    },
    [PDFDocumentsEnum.AutorizacionUsoImagen]: ({ docData, signature, theme, cicloActividades, scoutId, familiarId }: FillDocumentoData) => {
        return new AutorizacionUsoImagen({
            documentName: docData.nombre,
            fileUploadId: docData.fileUploadId!,
            cicloActividades: cicloActividades!,
            scoutId,
            familiarId: familiarId!,
            data: {
                signature,
                theme,
            },
        });
    },
    [PDFDocumentsEnum.AutorizacionRetiro]: ({ docData, signature, theme, retiroData, scoutId, familiarId }: FillDocumentoData) => {
        return new AutorizacionRetiro({
            documentName: docData.nombre,
            fileUploadId: docData.fileUploadId!,
            scoutId,
            familiarId: familiarId!,
            retiroData: retiroData!,
            data: {
                theme,
                signature,
            },
        });
    },
    [PDFDocumentsEnum.AutorizacionIngresoMenores]: ({ docData, signature, theme, scoutId, familiarId, aclaraciones }: FillDocumentoData) => {
        return new AutorizacionIngresoMenores({
            documentName: docData.nombre,
            fileUploadId: docData.fileUploadId!,
            scoutId,
            familiarId: familiarId!,
            aclaraciones: aclaraciones!,
            data: {
                signature,
                theme,
            },
        });
    },
    [PDFDocumentsEnum.AutorizacionSalidasCercanas]: ({ docData, signature, theme, scoutId, familiarId, cicloActividades = "2025", rangoDistanciaPermiso = "5 Kilometros" }: FillDocumentoData) => {
        return new AutorizacionSalidasCercanas({
            documentName: docData.nombre,
            fileUploadId: docData.fileUploadId!,
            scoutId,
            familiarId: familiarId!,
            cicloActividades,
            rangoDistanciaPermiso,
            data: {
                signature,
                theme,
            },
        });
    },
    [PDFDocumentsEnum.AutorizacionEventos]: ({ docData, signature, theme, scoutId, familiarId, fechaEventoComienzo, fechaEventoFin, lugarEvento, tipoEvento }: FillDocumentoData) => {
        return new AutorizacionEventos({
            documentName: docData.nombre,
            fileUploadId: docData.fileUploadId!,
            scoutId,
            familiarId: familiarId!,
            fechaEventoComienzo: new Date(fechaEventoComienzo!),
            fechaEventoFin: new Date(fechaEventoFin!),
            lugarEvento: lugarEvento!,
            tipoEvento: tipoEvento!,
            data: {
                signature,
                theme,
            },
        });
    },
};