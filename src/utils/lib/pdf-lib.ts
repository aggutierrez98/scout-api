import { PDFDocument, setFillingRgbColor, StandardFonts } from 'pdf-lib';
import { readFile } from 'fs/promises';
import sharp from 'sharp';
import fileUpload from 'express-fileupload';

export type FillingOptions = {
    fontColor?: string
    fontFamily?: StandardFonts,
    fontSize?: number
}

interface FillFormProperties {
    inputFile: string | Buffer,
    dataObject: { [key: string]: string },
    options?: FillingOptions
}
interface SignProperties {
    inputFile: Buffer,
    signature: fileUpload.UploadedFile,
    options: {
        rotate?: number,
        position: {
            y: number,
            x: number
        }
        scale?: number
        negate?: boolean
    }
}

export const fillPdfForm = async ({ dataObject, inputFile, options: { fontColor, fontFamily, fontSize } = {} }: FillFormProperties) => {

    let file = inputFile;
    if (typeof inputFile === "string") file = await readFile(inputFile)

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


export const signPdf = async ({ signature, inputFile, options: { position: { x, y }, scale = 0.05, rotate = 0, negate = false } }: SignProperties) => {
    if (!signature) throw new Error("No se envio la firma")

    const pdfDoc = await PDFDocument.load(inputFile)
    const page = pdfDoc.getPages()[0];

    const finalImage = await sharp(signature.data)
        .grayscale()
        .threshold(180)
        .negate(negate) // Negar imagen
        .rotate(rotate)  // Rotar imagen los grados correspondientes
        .removeAlpha() // Eliminar fondo
        .toBuffer();

    const signatureImage = await pdfDoc.embedPng(finalImage);

    const { width, height } = signatureImage.scale(scale);

    page.drawImage(signatureImage, { x, y, width, height });
    const signedPdfBytes = await pdfDoc.save();
    return signedPdfBytes
}