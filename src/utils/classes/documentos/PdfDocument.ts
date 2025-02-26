import { resolve } from "path";
import { FillingOptions, fillPdfForm } from "../../lib/pdf-lib";
import { nanoid } from "nanoid";
import { unlink, writeFile } from "fs/promises";
import { getPDFFile } from "../../helpers/googleDriveApi";
import { uploadToS3 } from "../../lib/s3.util";

interface PdfData { [key: string]: string }

export interface BaseConstructorProps {
    documentName: string,
    fileUploadId: string,
    fillingOptions?: FillingOptions,
    data?: any
}

export abstract class PdfDocument {
    protected documentName: string
    protected fileUploadId: string
    protected _uploadId: string
    protected dirPath: string
    protected options: FillingOptions
    protected buffer: Buffer = Buffer.from([])
    protected abstract data: any
    protected abstract uploadFolder: string

    constructor({ documentName, fileUploadId, fillingOptions }: BaseConstructorProps) {
        this.dirPath = resolve("src/public/docs")
        this.fileUploadId = fileUploadId
        this.documentName = documentName.split(" ").join("_")
        this.options = fillingOptions || {
            fontColor: "#000",
            fontSize: 15,
        }
        this._uploadId = nanoid()
    }

    //TODO: Agregar seleccionar unica opcion en forms (tachar texto en caso de ser necesario)

    abstract getData(): Promise<void>;

    abstract mapData(): PdfData;

    abstract sign(): Promise<void>;

    async fill(): Promise<void> {
        const data = await getPDFFile(this.fileUploadId)
        if (!data) return

        const mappedData = this.mapData();

        const { fontColor, fontFamily, fontSize } = this.options

        const pdfBytes = await fillPdfForm(
            {
                inputFile: data,
                dataObject: mappedData,
                options: { fontColor, fontFamily, fontSize }
            });

        this.buffer = Buffer.from(pdfBytes)
    }


    async upload(): Promise<void> {
        await uploadToS3(this.dataBuffer, this.uploadPath)
    }

    async delete() {
        // await unlink(`${this.dirPath}${this.uploadFolder}/${this.fileName}.pdf`)
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
