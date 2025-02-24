import { resolve } from "path";
import { FillingOptions, fillPdfForm } from "../../lib/pdf-lib";
import { nanoid } from "nanoid";
import { unlink, writeFile } from "fs/promises";

interface PdfData { [key: string]: string }

export interface BaseConstructorProps {
    documentName: string,
    fillingOptions?: FillingOptions,
    data?: any
}

export abstract class PdfDocument {
    protected documentName: string
    protected _uploadId: string
    protected dirPath: string
    protected options: FillingOptions
    protected abstract data: any
    protected abstract uploadFolder: string

    constructor({ documentName, fillingOptions }: BaseConstructorProps) {
        this.dirPath = resolve("src/public/docs")
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

    async fill(): Promise<Buffer> {
        const mappedData = this.mapData();

        const { fontColor, fontFamily, fontSize } = this.options

        const pdfBytes = await fillPdfForm(
            {
                inputFile: `${this.dirPath}/${this.documentName}.pdf`,
                dataObject: mappedData,
                options: { fontColor, fontFamily, fontSize }
            });

        return Buffer.from(pdfBytes)
    }

    async save(bytes: string): Promise<string> {
        const savePath = `${this.dirPath}${this.uploadFolder}/${this.fileName}.pdf`
        await writeFile(savePath, bytes)
        return savePath
    }

    async delete() {
        await unlink(`${this.dirPath}${this.uploadFolder}/${this.fileName}.pdf`)
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

}
