import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';

function sanitizeText(text) {
    if (!text) return '';
    return text
        .normalize('NFKD')
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
        .replace(/[^\x20-\x7E]/g, (char) => {
            const replacements = {
                '–': '-', '—': '-', '‘': "'", '’': "'",
                '“': '"', '”': '"', '…': '...', '•': '*',
                '™': '(TM)', '®': '(R)', '©': '(C)',
                'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
                'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a',
                'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o',
                'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
                'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
                'ñ': 'n', 'ç': 'c'
            };
            return replacements[char] || '';
        })
        .trim();
}

function hexToRgb(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return { r, g, b };
}

async function getFont(pdfDoc, fontFamily = 'Helvetica') {
    switch (fontFamily.toLowerCase()) {
        case 'helvetica':
            return await pdfDoc.embedFont(StandardFonts.Helvetica);
        case 'helvetica-bold':
            return await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        case 'times-roman':
        case 'georgia':
            return await pdfDoc.embedFont(StandardFonts.TimesRoman);
        case 'courier':
            return await pdfDoc.embedFont(StandardFonts.Courier);
        default:
            return await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
}

/**
 * Calculate actual coordinates based on PDF dimensions
 */
function calculateActualCoordinates(x, y, pageWidth, pageHeight, displayWidth, displayHeight) {
    // If we know the display dimensions, scale the coordinates
    if (displayWidth && displayHeight) {
        const scaleX = pageWidth / displayWidth;
        const scaleY = pageHeight / displayHeight;
        return {
            x: x * scaleX,
            y: pageHeight - (y * scaleY) // Flip Y coordinate
        };
    }
    
    // Default: use coordinates as-is, but flip Y for pdf-lib
    return {
        x: x,
        y: pageHeight - y
    };
}

// async function generateSingleCertificate(templatePath, data, fields, outputPath) {
//     try {
//         const templateBytes = fs.readFileSync(templatePath);
//         const pdfDoc = await PDFDocument.load(templateBytes);
//         const page = pdfDoc.getPages()[0];
//         const { width, height } = page.getSize();
        
//         console.log(`PDF Dimensions: ${width} x ${height}`);
        
//         for (const field of fields) {
//             const fieldName = field.name;
//             let value = data[fieldName];
            
//             if (!value) continue;
//             value = sanitizeText(String(value));
//             if (!value) continue;
            
//             const font = await getFont(pdfDoc, field.fontFamily || 'Helvetica');
//             const { r, g, b } = hexToRgb(field.color || '#000000');
            
//             // Calculate actual position
//             // Use coordinates as-is from frontend, but flip Y axis
//             let x = field.x;
//             let y = height - field.y; // PDF uses bottom-left origin
            
//             // Handle alignment
//             const textWidth = font.widthOfTextAtSize(value, field.fontSize);
            
//             if (field.align === 'center') {
//                 x = field.x - (textWidth / 2);
//             } else if (field.align === 'right') {
//                 x = field.x - textWidth;
//             }
            
//             console.log(`Drawing "${field.name}" at (${x}, ${y}) with value: "${value}"`);
            
//             let finalFont = font;
//             if (field.bold) {
//                 finalFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//             }
            
//             page.drawText(value, {
//                 x: x,
//                 y: y,
//                 size: field.fontSize,
//                 font: finalFont,
//                 color: rgb(r, g, b),
//             });
//         }
        
//         const pdfBytes = await pdfDoc.save();
//         fs.writeFileSync(outputPath, pdfBytes);
//         return outputPath;
        
//     } catch (error) {
//         console.error('Error generating certificate:', error);
//         throw error;
//     }
// }

// Rest of the functions (generateCertificates, processCertificateGeneration) remain the same

// async function generateSingleCertificate(templatePath, data, fields, outputPath) {
//     try {
//         const templateBytes = fs.readFileSync(templatePath);
//         const pdfDoc = await PDFDocument.load(templateBytes);
//         const page = pdfDoc.getPages()[0];
//         const { width: pdfWidth, height: pdfHeight } = page.getSize();
        
//         console.log(`PDF Dimensions: ${pdfWidth} x ${pdfHeight}`);
        
//         // IMPORTANT: You need to know the display dimensions from your frontend
//         // The coordinates (291, 436) were set on a displayed image of a certain size
//         // Let's assume your frontend displayed the PDF at a scale where width was ~600px
//         // You need to store the display dimensions when saving fields
        
//         // For now, let's calculate the scale based on typical display size
//         // You should modify this to use the actual stored display dimensions
//         const displayWidth = 600; // Typical width your frontend uses
//         const displayHeight = 800; // Typical height
        
//         const scaleX = pdfWidth / displayWidth;
//         const scaleY = pdfHeight / displayHeight;
        
//         for (const field of fields) {
//             const fieldName = field.name;
//             let value = data[fieldName];
            
//             if (!value) continue;
//             value = sanitizeText(String(value));
//             if (!value) continue;
            
//             const font = await getFont(pdfDoc, field.fontFamily || 'Helvetica');
//             const { r, g, b } = hexToRgb(field.color || '#000000');
            
//             // Scale the coordinates from display size to actual PDF size
//             let x = field.x * scaleX;
//             let y = pdfHeight - (field.y * scaleY); // Flip Y axis and scale
            
//             // Handle alignment
//             const textWidth = font.widthOfTextAtSize(value, field.fontSize);
            
//             if (field.align === 'center') {
//                 x = x - (textWidth / 2);
//             } else if (field.align === 'right') {
//                 x = x - textWidth;
//             }
            
//             console.log(`Field "${field.name}":`);
//             console.log(`  Original: (${field.x}, ${field.y})`);
//             console.log(`  Scaled: (${x}, ${y})`);
//             console.log(`  Text: "${value}"`);
            
//             let finalFont = font;
//             if (field.bold) {
//                 finalFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//             }
            
//             page.drawText(value, {
//                 x: x,
//                 y: y,
//                 size: field.fontSize,
//                 font: finalFont,
//                 color: rgb(r, g, b),
//             });
//         }
        
//         const pdfBytes = await pdfDoc.save();
//         fs.writeFileSync(outputPath, pdfBytes);
//         return outputPath;
        
//     } catch (error) {
//         console.error('Error generating certificate:', error);
//         throw error;
//     }
// }

async function generateSingleCertificate(templatePath, data, fields, outputPath) {
    try {
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        const page = pdfDoc.getPages()[0];
        const { width: actualPdfWidth, height: actualPdfHeight } = page.getSize();
        
        console.log(`Actual PDF Dimensions: ${actualPdfWidth} x ${actualPdfHeight}`);
        
        for (const field of fields) {
            const fieldName = field.name;
            let value = data[fieldName];
            
            if (!value) continue;
            value = sanitizeText(String(value));
            if (!value) continue;
            
            // Get the stored PDF dimensions from when the field was created
            const storedPdfWidth = field.pdfWidth || actualPdfWidth;
            const storedPdfHeight = field.pdfHeight || actualPdfHeight;
            
            // Calculate scale factors
            const scaleX = actualPdfWidth / storedPdfWidth;
            const scaleY = actualPdfHeight / storedPdfHeight;
            
            // Scale the coordinates
            let x = field.x * scaleX;
            let y = actualPdfHeight - (field.y * scaleY); // Flip Y and scale
            
            console.log(`Field "${field.name}":`);
            console.log(`  Stored at: (${field.x}, ${field.y}) on ${storedPdfWidth}x${storedPdfHeight}`);
            console.log(`  Actual PDF: ${actualPdfWidth}x${actualPdfHeight}`);
            console.log(`  Scale: ${scaleX}, ${scaleY}`);
            console.log(`  Calculated position: (${x}, ${y})`);
            
            const font = await getFont(pdfDoc, field.fontFamily || 'Helvetica');
            const { r, g, b } = hexToRgb(field.color || '#000000');
            
            // Handle alignment
            const textWidth = font.widthOfTextAtSize(value, field.fontSize);
            
            if (field.align === 'center') {
                x = x - (textWidth / 2);
            } else if (field.align === 'right') {
                x = x - textWidth;
            }
            
            let finalFont = font;
            if (field.bold) {
                finalFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            }
            
            page.drawText(value, {
                x: x,
                y: y,
                size: field.fontSize,
                font: finalFont,
                color: rgb(r, g, b),
            });
        }
        
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputPath, pdfBytes);
        return outputPath;
        
    } catch (error) {
        console.error('Error generating certificate:', error);
        throw error;
    }
}


export async function generateCertificates({
    templatePath,
    dataRows,
    fields,
    outputDir
}) {
    const batchId = uuidv4();
    const tempDir = path.join(outputDir, 'temp', batchId);
    const certificatesDir = path.join(tempDir, 'certificates');
    
    if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true });
    }
    
    const generatedFiles = [];
    
    try {
        console.log(`Generating ${dataRows.length} certificates...`);
        
        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const outputPath = path.join(certificatesDir, `certificate_${i + 1}.pdf`);
            
            await generateSingleCertificate(templatePath, row, fields, outputPath);
            generatedFiles.push(outputPath);
            
            if ((i + 1) % 10 === 0) {
                console.log(`Generated ${i + 1}/${dataRows.length} certificates`);
            }
        }
        
        const zipPath = path.join(tempDir, `certificates_${batchId}.zip`);
        
        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            output.on('close', () => {
                console.log(`ZIP created: ${zipPath} (${archive.pointer()} bytes)`);
                resolve();
            });
            
            archive.on('error', (err) => {
                console.error('Archive error:', err);
                reject(err);
            });
            
            archive.pipe(output);
            
            for (const file of generatedFiles) {
                archive.file(file, { name: path.basename(file) });
            }
            
            archive.finalize();
        });
        
        for (const file of generatedFiles) {
            fs.unlinkSync(file);
        }
        fs.rmdirSync(certificatesDir);
        
        return zipPath;
        
    } catch (error) {
        console.error('Error generating certificates:', error);
        throw error;
    }
}

export async function processCertificateGeneration({
    excelData,
    templatePath,
    fields,
    fieldMapping
}) {
    const reverseMapping = {};
    for (const [templateField, excelColumn] of Object.entries(fieldMapping)) {
        if (excelColumn) {
            reverseMapping[excelColumn] = templateField;
        }
    }
    
    console.log('Reverse mapping:', reverseMapping);
    
    const mappedData = excelData.map(row => {
        const mappedRow = {};
        for (const [excelColumn, templateField] of Object.entries(reverseMapping)) {
            const value = row[excelColumn];
            mappedRow[templateField] = value ? sanitizeText(String(value)) : '';
        }
        return mappedRow;
    });
    
    const outputDir = process.cwd();
    const zipPath = await generateCertificates({
        templatePath,
        dataRows: mappedData,
        fields,
        outputDir
    });
    
    return zipPath;
}