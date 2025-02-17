import { resolve } from "path";
import { FillingOptions, fillPdfForm } from "../../lib/pdf-lib";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";



interface PdfData { [key: string]: string }

export interface BaseConstructorProps {
    documentName: string,
    fillingOptions?: FillingOptions,
}

export abstract class PdfDocument {
    protected documentName: string
    protected dirPath: string
    protected options: FillingOptions
    protected abstract data: any

    constructor({ documentName, fillingOptions }: BaseConstructorProps) {
        this.dirPath = resolve("src/public/docs")
        this.documentName = documentName.split(" ").join("_")
        this.options = fillingOptions || {
            fontColor: "#000",
            fontSize: 15,
        }
    }

    //TODO: Agregar para modificar (tachar texto en caso de ser necesario)

    abstract getData(params: any): Promise<void>;

    abstract mapData(): PdfData;

    async fill(): Promise<string> {
        const mappedData = this.mapData();

        const { fontColor, fontFamily, fontSize } = this.options
        const idCompletition = nanoid()
        const fileNameBase = `${this.dirPath}/${this.documentName}`

        const pdfBytes = await fillPdfForm(
            {
                inputFile: `${fileNameBase}.pdf`,
                dataObject: mappedData,
                options: { fontColor, fontFamily, fontSize }
            });

        const outputFile = `${fileNameBase}_${idCompletition}.pdf`
        await writeFile(outputFile, pdfBytes)
        return outputFile
    }
}
