import { readFile } from "fs/promises";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

type DocxTemplateInput = string | Buffer;

export const renderDocxTemplate = async <T extends object>(template: DocxTemplateInput, data: T): Promise<Buffer> => {
	const templateBinary = Buffer.isBuffer(template)
		? template.toString("binary")
		: await readFile(template, "binary");
	const zip = new PizZip(templateBinary);
	const doc = new Docxtemplater(zip, {
		paragraphLoop: true,
		linebreaks: true,
	});

	doc.render(data);

	return doc.getZip().generate({
		type: "nodebuffer",
		compression: "DEFLATE",
	});
};
