import { PDFDocument, setFillingRgbColor, StandardFonts } from 'pdf-lib';
import { readFile } from 'fs/promises';

export type FillingOptions = {
    fontColor?: string
    fontFamily?: StandardFonts,
    fontSize?: number
}

interface Properties {
    inputFile: string,
    dataObject: { [key: string]: string },
    options?: FillingOptions
}

export const fillPdfForm = async ({ dataObject, inputFile, options: { fontColor, fontFamily, fontSize } = {} }: Properties) => {
    const file = await readFile(inputFile)
    const pdfDoc = await PDFDocument.load(file)
    const form = pdfDoc.getForm()
    let fontSelected
    if (fontFamily) fontSelected = await pdfDoc.embedFont(fontFamily);

    for (const key in dataObject) {
        let textField
        if (Object.prototype.hasOwnProperty.call(dataObject, key)) {
            try {
                textField = form.getTextField(key);
            } catch (error) {
                console.error(error);
                continue
            }
            if (fontColor) {
                const da = textField.acroField.getDefaultAppearance() ?? '';
                const newDa = da + '\n' + setFillingRgbColor(0, 0, 0).toString();
                textField.acroField.setDefaultAppearance(newDa);
            }
            if (fontSelected) textField.updateAppearances(fontSelected)
            if (fontSize) textField.setFontSize(fontSize)

            textField.setText(dataObject[key] || "")
        }
    }

    return await pdfDoc.save()

}
