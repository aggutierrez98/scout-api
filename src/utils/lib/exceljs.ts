import xlsx from 'xlsx';

export const readXlsxBuffer = (file: Buffer) => {
    const workbook = xlsx.read(file, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    return jsonData
}