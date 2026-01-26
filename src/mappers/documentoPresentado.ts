import { DocumentoPresentado, Documento } from "@prisma/client";

export const mapDocumentoPresentado = <T extends DocumentoPresentado>(documentoPresentado: T) => {
    const { uuid, ...rest } = documentoPresentado;
    return {
        ...rest,
        id: uuid,
    };
};

export const mapDocumentoDefinicion = <T extends Documento>(documento: T) => {
    const { uuid, ...rest } = documento;
    return {
        ...rest,
        id: uuid,
    };
};
