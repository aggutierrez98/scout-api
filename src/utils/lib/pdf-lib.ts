import { PDFDocument, setFillingRgbColor, StandardFonts, rgb } from 'pdf-lib';
import { readFile } from 'fs/promises';
import sharp from 'sharp';
import fileUpload from 'express-fileupload';
import { hexToRgb } from '../helpers/hexToRgb';

export type FillingOptions = {
    fontColor?: string
    fontFamily?: StandardFonts,
    fontSize?: number
    strikeThrough?: {
        thickness: number
    }
}

export type StraighThroughLine = { start: { x: number, y: number }, end: { x: number, y: number } }

interface FillFormProperties {
    inputFile: string | Buffer,
    dataObject: { [key: string]: string | StraighThroughLine[] | boolean },
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

export const fillPdfForm = async ({ dataObject, inputFile, options: { fontColor, fontFamily, fontSize, strikeThrough } = {} }: FillFormProperties) => {

    let file = inputFile;
    if (typeof inputFile === "string") file = await readFile(inputFile)

    const pdfDoc = await PDFDocument.load(file)
    const form = pdfDoc.getForm()

    let fontSelected
    if (fontFamily) fontSelected = await pdfDoc.embedFont(fontFamily);

    for (const key in dataObject) {

        if (Object.prototype.hasOwnProperty.call(dataObject, key)) {

            let rgbColor
            if (fontColor) {
                const { r, g, b } = hexToRgb(fontColor)!
                rgbColor = rgb(r, g, b)
            }

            if (key.startsWith("ST-")) {
                const page = pdfDoc.getPage(0)
                const defaultOptions = {
                    thickness: strikeThrough?.thickness,
                    color: rgbColor,
                }

                for (const line of dataObject[key] as StraighThroughLine[]) {
                    page.drawLine({
                        ...defaultOptions,
                        start: line.start,
                        end: line.end
                    });
                }
            }
            else {
                let textField
                try {
                    textField = form.getTextField(key);
                } catch (error) {
                    console.error(error);
                    continue
                }
                if (rgbColor) {
                    const defaultAppareance = textField.acroField.getDefaultAppearance() ?? '';
                    const newDefaultAppareance = defaultAppareance + '\n' + setFillingRgbColor(rgbColor.red, rgbColor.green, rgbColor.blue).toString();
                    textField.acroField.setDefaultAppearance(newDefaultAppareance);
                }
                if (fontSelected) textField.updateAppearances(fontSelected)
                if (fontSize) textField.setFontSize(fontSize)

                if (key.startsWith("Check_")) textField.setFontSize(7)

                textField.setText(dataObject[key] as string || "")
            }
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