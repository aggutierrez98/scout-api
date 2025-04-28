import { resolve } from "path";
import { FillingOptions, fillPdfForm, StraighThroughLine } from "../../lib/pdf-lib";
import { nanoid } from "nanoid";
import { getPDFFile } from "../../helpers/googleDriveApi";
import { uploadToS3 } from "../../lib/s3.util";



interface PdfData { [key: string]: string | StraighThroughLine[] | boolean }

export interface BaseConstructorProps {
    documentName: string,
    fileUploadId: string,
    fillingOptions?: FillingOptions,
    documentoFilled?: Buffer
    data?: any
}

export abstract class PdfDocument {
    protected documentName: string
    protected fileUploadId: string
    protected _uploadId: string
    protected dirPath: string
    protected options: FillingOptions
    protected buffer: Buffer
    protected abstract data: any
    protected abstract uploadFolder: string

    constructor({ documentName, fileUploadId, fillingOptions, documentoFilled }: BaseConstructorProps) {
        this.dirPath = resolve("src/public/docs")
        this.fileUploadId = fileUploadId
        this.documentName = documentName.split(" ").join("_")
        this.options = fillingOptions || {
            fontColor: "#000",
            fontSize: 15,
        }
        this._uploadId = nanoid()
        this.buffer = documentoFilled || Buffer.from([])
    }

    abstract getData(): Promise<void>;

    abstract mapData(): PdfData;

    abstract sign({ returnBase64 }: { returnBase64?: boolean }): Promise<void | string>;

    async fill({ returnBase64 }: { returnBase64?: boolean }): Promise<void | string> {

        const data = await getPDFFile(this.fileUploadId)
        if (!data) return

        const mappedData = this.mapData();

        const { fontColor, fontFamily, fontSize } = this.options

        const pdfBytes = await fillPdfForm(
            {
                inputFile: data,
                dataObject: mappedData,
                options: { fontColor, fontFamily, fontSize },
                returnBase64: !!returnBase64
            });

        if (returnBase64) return pdfBytes as string
        this.buffer = Buffer.from(pdfBytes)
    }


    async upload(): Promise<void> {
        await uploadToS3(this.dataBuffer, this.uploadPath)
    }

    get fileName() {
        return `${this.documentName}_${this.uploadId}.pdf`
    }

    get uploadId() {
        return this._uploadId
    }

    get uploadPath() {
        return `${this.uploadFolder}${this.fileName}`
    }

    get dataBuffer() {
        return this.buffer
    }

}
