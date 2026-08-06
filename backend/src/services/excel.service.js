import XLSX from 'xlsx';
import fs from 'fs';

export const processExcelFile = async (filePath) => {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            throw new Error('Excel file is empty');
        }

        const headers = Object.keys(data[0]);

        return {
            headers: headers,
            data: data,
            rowCount: data.length
        };
    } catch (error) {
        throw new Error(`Failed to process Excel file: ${error.message}`);
    }
};

export const mapExcelData = (excelData, mapping) => {
    return excelData.map(row => {
        const mappedRow = {};
        for (const [targetField, sourceColumn] of Object.entries(mapping)) {
            mappedRow[targetField] = row[sourceColumn] || '';
        }
        return mappedRow;
    });
};