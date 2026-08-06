import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import archiver from "archiver";
import { uploadToS3 } from "../lib/s3.js";
import prisma from "../lib/prisma.js";
import { fileURLToPath } from "url";
import fontkit from "@pdf-lib/fontkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Font cache to avoid loading fonts multiple times
// const fontCache = {};

function sanitizeText(text) {
  if (!text) return "";
  return text
    .normalize("NFKD")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/[^\x20-\x7E]/g, (char) => {
      const replacements = {
        "–": "-",
        "—": "-",
        "‘": "'",
        "’": "'",
        "“": '"',
        "”": '"',
        "…": "...",
        "•": "*",
        "™": "(TM)",
        "®": "(R)",
        "©": "(C)",
        é: "e",
        è: "e",
        ê: "e",
        ë: "e",
        á: "a",
        à: "a",
        â: "a",
        ä: "a",
        ó: "o",
        ò: "o",
        ô: "o",
        ö: "o",
        í: "i",
        ì: "i",
        î: "i",
        ï: "i",
        ú: "u",
        ù: "u",
        û: "u",
        ü: "u",
        ñ: "n",
        ç: "c",
      };
      return replacements[char] || "";
    })
    .trim();
}

function hexToRgb(hexColor) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return { r, g, b };
}

// async function getFont(
//   pdfDoc,
//   fontFamily = "Helvetica",
//   fontWeight = "regular",
// ) {
//   // Normalize inputs
//   const normalizedFamily = fontFamily?.toLowerCase() || "helvetica";
//   const normalizedWeight = fontWeight?.toLowerCase() || "regular";
//   const cacheKey = `${normalizedFamily}-${normalizedWeight}`;

//   // Check cache first
//   if (fontCache[cacheKey]) {
//     console.log(`📦 Font cache hit: ${fontFamily} (${fontWeight})`);
//     return fontCache[cacheKey];
//   }

//   console.log(`🔍 Looking for font: "${fontFamily}" (weight: ${fontWeight})`);

//   // Map standard PDF fonts
//   const standardFontMap = {
//     helvetica: {
//       regular: StandardFonts.Helvetica,
//       bold: StandardFonts.HelveticaBold,
//       italic: StandardFonts.HelveticaOblique,
//     },
//     "times-roman": {
//       regular: StandardFonts.TimesRoman,
//       bold: StandardFonts.TimesRomanBold,
//       italic: StandardFonts.TimesRomanItalic,
//     },
//     times: {
//       regular: StandardFonts.TimesRoman,
//       bold: StandardFonts.TimesRomanBold,
//       italic: StandardFonts.TimesRomanItalic,
//     },
//     courier: {
//       regular: StandardFonts.Courier,
//       bold: StandardFonts.CourierBold,
//       italic: StandardFonts.CourierOblique,
//     },
//     georgia: {
//       regular: StandardFonts.TimesRoman,
//       bold: StandardFonts.TimesRomanBold,
//       italic: StandardFonts.TimesRomanItalic,
//     },
//     arial: {
//       regular: StandardFonts.Helvetica,
//       bold: StandardFonts.HelveticaBold,
//       italic: StandardFonts.HelveticaOblique,
//     },
//   };

//   // Check if it's a standard font
//   if (standardFontMap[normalizedFamily]) {
//     const fontObj = standardFontMap[normalizedFamily];
//     const fontKey = fontObj[normalizedWeight] || fontObj.regular;
//     console.log(`📄 Using standard PDF font: ${fontFamily} (${fontWeight})`);
//     const font = await pdfDoc.embedFont(fontKey);
//     fontCache[cacheKey] = font;
//     return font;
//   }

//   // ✅ FIXED: Correct path to fonts directory
//   // Try multiple possible paths
//   const possiblePaths = [
//     path.join(process.cwd(), "fonts"), // backend/fonts
//     path.join(__dirname, "..", "..", "fonts"), // backend/fonts (from src)
//     path.join(__dirname, "..", "fonts"), // backend/src/fonts (old)
//   ];

//   const fontFiles = {
//     lobster: {
//       regular: "Lobster-Regular.ttf",
//       bold: "Lobster-Regular.ttf",
//       italic: "Lobster-Regular.ttf",
//     },
//     "lobster-two": {
//       regular: "LobsterTwo-Regular.ttf",
//       bold: "LobsterTwo-Bold.ttf",
//       italic: "LobsterTwo-Regular.ttf",
//     },
//     "great-vibes": {
//       regular: "GreatVibes-Regular.ttf",
//     },
//     "alex-brush": {
//       regular: "AlexBrush-Regular.ttf",
//     },
//     "dancing-script": {
//       regular: "DancingScript-Regular.ttf",
//     },
//     pacifico: {
//       regular: "Pacifico-Regular.ttf",
//     },
//     roboto: {
//       regular: "Roboto-Regular.ttf",
//       bold: "Roboto-Bold.ttf",
//       italic: "Roboto-Italic.ttf",
//     },
//     "playfair-display": {
//       regular: "PlayfairDisplay-Regular.ttf",
//     },
//     "open-sans": {
//       regular: "OpenSans-Regular.ttf",
//       bold: "OpenSans-Bold.ttf",
//       italic: "OpenSans-Italic.ttf",
//     },
//   };

//   const fontKey = normalizedFamily;
//   const fontFile =
//     fontFiles[fontKey]?.[normalizedWeight] || fontFiles[fontKey]?.regular;

//   if (fontFile) {
//     // Try each possible path
//     for (const basePath of possiblePaths) {
//       const fontPath = path.join(basePath, fontFile);
//       console.log(`🔎 Checking font path: ${fontPath}`);

//       if (fs.existsSync(fontPath)) {
//         try {
//           const stats = fs.statSync(fontPath);
//           console.log(`📄 Font file found: ${fontFile} (${stats.size} bytes)`);

//           const fontBytes = fs.readFileSync(fontPath);
//           const font = await pdfDoc.embedFont(fontBytes);
//           fontCache[cacheKey] = font;
//           console.log(
//             `✅ Successfully loaded custom font: ${fontFamily} (${fontWeight}) from ${fontPath}`,
//           );
//           return font;
//         } catch (error) {
//           console.error(
//             `❌ Error loading font "${fontFamily}" from ${fontFile}:`,
//             error.message,
//           );
//         }
//       }
//     }

//     console.warn(`⚠️ Font file NOT FOUND for: ${fontFamily} (${fontFile})`);
//     console.warn(`   Checked paths:`);
//     for (const basePath of possiblePaths) {
//       console.warn(`   - ${path.join(basePath, fontFile)}`);
//     }

//     // List available fonts in the first valid directory
//     for (const basePath of possiblePaths) {
//       if (fs.existsSync(basePath)) {
//         try {
//           const availableFonts = fs.readdirSync(basePath);
//           console.log(
//             `   Available fonts in ${basePath}: ${availableFonts.join(", ")}`,
//           );
//           break;
//         } catch (listError) {
//           // Ignore
//         }
//       }
//     }
//   } else {
//     console.warn(`⚠️ Font "${fontFamily}" is not configured in fontFiles map`);
//     console.log(
//       `   Available custom fonts: ${Object.keys(fontFiles).join(", ")}`,
//     );
//   }

//   // Fallback to Helvetica
//   console.warn(`⚠️ Using fallback font (Helvetica) for: ${fontFamily}`);
//   const fallbackFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//   fontCache[cacheKey] = fallbackFont;
//   return fallbackFont;
// }


// ✅ Replace getFont to accept a per-doc cache
async function getFont(pdfDoc, fontFamily = "Helvetica", fontWeight = "regular", docFontCache = {}) {
  const normalizedFamily = fontFamily?.toLowerCase() || "helvetica";
  const normalizedWeight = fontWeight?.toLowerCase() || "regular";
  const cacheKey = `${normalizedFamily}-${normalizedWeight}`;

  if (docFontCache[cacheKey]) {
    console.log(`📦 Font cache hit: ${fontFamily} (${fontWeight})`);
    return docFontCache[cacheKey];
  }

  console.log(`🔍 Looking for font: "${fontFamily}" (weight: ${fontWeight})`);

  const standardFontMap = {
    helvetica: {
      regular: StandardFonts.Helvetica,
      bold: StandardFonts.HelveticaBold,
      italic: StandardFonts.HelveticaOblique,
    },
    "times-roman": {
      regular: StandardFonts.TimesRoman,
      bold: StandardFonts.TimesRomanBold,
      italic: StandardFonts.TimesRomanItalic,
    },
    times: {
      regular: StandardFonts.TimesRoman,
      bold: StandardFonts.TimesRomanBold,
      italic: StandardFonts.TimesRomanItalic,
    },
    courier: {
      regular: StandardFonts.Courier,
      bold: StandardFonts.CourierBold,
      italic: StandardFonts.CourierOblique,
    },
    georgia: {
      regular: StandardFonts.TimesRoman,
      bold: StandardFonts.TimesRomanBold,
      italic: StandardFonts.TimesRomanItalic,
    },
    arial: {
      regular: StandardFonts.Helvetica,
      bold: StandardFonts.HelveticaBold,
      italic: StandardFonts.HelveticaOblique,
    },
  };

  if (standardFontMap[normalizedFamily]) {
    const fontObj = standardFontMap[normalizedFamily];
    const fontKey = fontObj[normalizedWeight] || fontObj.regular;
    console.log(`📄 Using standard PDF font: ${fontFamily} (${fontWeight})`);
    const font = await pdfDoc.embedFont(fontKey);
    docFontCache[cacheKey] = font;  // store in doc-scoped cache
    return font;
  }

  const possiblePaths = [
    path.join(process.cwd(), "fonts"),
    path.join(__dirname, "..", "..", "fonts"),
    path.join(__dirname, "..", "fonts"),
  ];

  const fontFiles = {
    lobster:           { regular: "Lobster-Regular.ttf" },
    "lobster-two":     { regular: "LobsterTwo-Regular.ttf", bold: "LobsterTwo-Bold.ttf" },
    "great-vibes":     { regular: "GreatVibes-Regular.ttf" },
    "alex-brush":      { regular: "AlexBrush-Regular.ttf" },
    "dancing-script":  { regular: "DancingScript-Regular.ttf" },
    pacifico:          { regular: "Pacifico-Regular.ttf" },
    roboto:            { regular: "Roboto-Regular.ttf", bold: "Roboto-Bold.ttf", italic: "Roboto-Italic.ttf" },
    "playfair-display":{ regular: "PlayfairDisplay-Regular.ttf" },
    "open-sans":       { regular: "OpenSans-Regular.ttf", bold: "OpenSans-Bold.ttf", italic: "OpenSans-Italic.ttf" },
  };

  const fontFile = fontFiles[normalizedFamily]?.[normalizedWeight] || fontFiles[normalizedFamily]?.regular;

  if (fontFile) {
    for (const basePath of possiblePaths) {
      const fontPath = path.join(basePath, fontFile);
      if (fs.existsSync(fontPath)) {
        try {
          const fontBytes = fs.readFileSync(fontPath);
          const font = await pdfDoc.embedFont(fontBytes);
          docFontCache[cacheKey] = font;
          console.log(`✅ Loaded custom font: ${fontFamily} from ${fontPath}`);
          return font;
        } catch (err) {
          console.error(`❌ Error loading font from ${fontPath}:`, err.message);
        }
      }
    }
    console.warn(`⚠️ Font file not found: ${fontFile}`);
  } else {
    console.warn(`⚠️ Font not configured: ${fontFamily}`);
  }

  console.warn(`⚠️ Fallback to Helvetica for: ${fontFamily}`);
  const fallback = await pdfDoc.embedFont(StandardFonts.Helvetica);
  docFontCache[cacheKey] = fallback;
  return fallback;
}

async function generateSingleCertificate(
  templatePath,
  data,
  fields,
  outputPath,
) {
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];
  const { width: pdfWidth, height: pdfHeight } = page.getSize();

  // ✅ Register fontkit for custom fonts
  pdfDoc.registerFontkit(fontkit); // ADD THIS LINE

  for (const field of fields) {
    let value = data[field.name];
    if (!value) continue;
    value = sanitizeText(String(value));
    if (!value) continue;

    // Validate: if the field was saved with different PDF dimensions (e.g. template
    // was replaced), scale coordinates proportionally rather than silently misplacing
    let x = field.x;
    let y = field.y;
    if (
      field.pdfWidth &&
      field.pdfHeight &&
      (Math.abs(field.pdfWidth - pdfWidth) > 1 ||
        Math.abs(field.pdfHeight - pdfHeight) > 1)
    ) {
      console.warn(`Template size mismatch — rescaling field "${field.name}"`);
      x = (field.x / field.pdfWidth) * pdfWidth;
      y = (field.y / field.pdfHeight) * pdfHeight;
    }

    const font = await getFont(pdfDoc, field.fontFamily || "Helvetica");
    const { r, g, b } = hexToRgb(field.color || "#000000");
    const textWidth = font.widthOfTextAtSize(value, field.fontSize);

    // Handle alignment — shift X so the anchor point matches the frontend
    if (field.align === "center") {
      x = x - textWidth / 2;
    } else if (field.align === "right") {
      x = x - textWidth;
    }

    // Y coordinates are already in PDF point space (bottom-left origin), draw directly
    page.drawText(value, {
      x,
      y,
      size: field.fontSize,
      font,
      color: rgb(r, g, b),
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

/**
 * Generate unique certificate code
 */
// function generateUniqueCode(recipientName, index) {
//   const timestamp = Date.now();
//   const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
//   const nameSlug = recipientName.substring(0, 10).replace(/[^a-zA-Z0-9]/g, "");
//   return `CERT-${nameSlug}-${timestamp}-${randomStr}`;
// }

function generateUniqueCode(recipientName, index) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NET-CERT-${timestamp}-${randomStr}`;
}

/**
 * Generate single certificate and upload to S3
 */

async function generateAndStoreCertificate({
  templatePath,
  data,
  fields,
  batchId,
  recipientName,
  recipientEmail,
  index,
  skipS3Upload = false,
}) {
  console.log(`\n🔍 === GENERATING CERTIFICATE ${index + 1} for: ${recipientName} ===`);

  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  pdfDoc.registerFontkit(fontkit);

  // ✅ Fresh font cache scoped to THIS pdf document only
  const docFontCache = {};

  const page = pdfDoc.getPages()[0];
  const { width: pdfWidth, height: pdfHeight } = page.getSize();
  console.log(`📄 PDF size: ${pdfWidth} x ${pdfHeight}`);

  let fieldsDrawn = 0;

  for (const field of fields) {
    let value = data[field.name];
    if (!value) {
      console.log(`   ⚠️ No value for field: ${field.name}`);
      continue;
    }

    value = sanitizeText(String(value));
    if (!value) {
      console.log(`   ⚠️ Empty after sanitize for: ${field.name}`);
      continue;
    }

    let x = field.x;
    let y = field.y;

    if (
      field.pdfWidth && field.pdfHeight &&
      (Math.abs(field.pdfWidth - pdfWidth) > 1 || Math.abs(field.pdfHeight - pdfHeight) > 1)
    ) {
      x = (field.x / field.pdfWidth) * pdfWidth;
      y = (field.y / field.pdfHeight) * pdfHeight;
    }

    // ✅ Pass docFontCache — fonts are embedded into THIS pdfDoc only
    const font = await getFont(
      pdfDoc,
      field.fontFamily || "Helvetica",
      field.fontWeight || "regular",
      docFontCache,  // <-- scoped cache
    );

    const { r, g, b } = hexToRgb(field.color || "#000000");
    const textWidth = font.widthOfTextAtSize(value, field.fontSize);

    if (field.align === "center") x -= textWidth / 2;
    else if (field.align === "right") x -= textWidth;

    console.log(`   Drawing "${value}" at (${x.toFixed(2)}, ${y.toFixed(2)})`);

    try {
      page.drawText(value, { x, y, size: field.fontSize, font, color: rgb(r, g, b) });
      fieldsDrawn++;
    } catch (drawError) {
      console.error(`   ❌ Failed to draw "${field.name}":`, drawError.message);
    }
  }

  console.log(`✅ Total fields drawn: ${fieldsDrawn}/${fields.length}`);

  const pdfBytes = await pdfDoc.save();

  const uniqueCode = generateUniqueCode(recipientName, index);
  const fileName = `certificate_${String(index + 1).padStart(3, "0")}_${
    recipientName.replace(/\s/g, "_").replace(/[^a-zA-Z0-9_-]/g, "")
  }.pdf`;
  const localPath = path.join(process.cwd(), "temp", batchId, fileName);

  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, pdfBytes);
  console.log(`✅ Saved: ${fileName} (${pdfBytes.length} bytes)`);

  if (skipS3Upload || process.env.SKIP_S3_UPLOAD === "true") {
    console.log(`⏭️ Skipping S3 upload for ${recipientName}`);
    return { s3Url: null, uniqueCode, pdfBytes, localPath, fileName };
  }

  const key = `certificates/${batchId}/${uniqueCode}.pdf`;
  const s3Url = await uploadToS3({
    buffer: pdfBytes,
    key,
    mimetype: "application/pdf",
    isPublic: false,
  });

  return { s3Url, uniqueCode, pdfBytes, localPath, fileName };
}

/**
 * Generate certificates, store in S3, and save to database
 */

export async function generateCertificates({
  templatePath,
  dataRows,
  fields,
  outputDir,
  templateId,
  adminId,
  title = "Certificate Batch",
}) {
  console.log(`📊 Starting generation for ${dataRows.length} records`);

  const batchId = uuidv4();
  const tempDir = path.join(outputDir, "temp", batchId);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const skipS3 = process.env.SKIP_S3_UPLOAD === 'true';
  console.log(`📦 S3 Upload: ${skipS3 ? 'SKIPPED (local only)' : 'ENABLED'}`);

  const certificate = await prisma.certificate.create({
    data: {
      title,
      adminId,
      templateId,
      totalCount: dataRows.length,
      status: "COMPLETED",
      excelFile: path.join(tempDir, "data.xlsx"),
    },
  });

  const certificateItems = [];
  const localFiles = [];

  try {
    console.log(`Generating ${dataRows.length} certificates...`);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const recipientName = row.recipientName || `Recipient ${i + 1}`;
      const recipientEmail = row.recipientEmail || null;

      console.log(`\n📄 Processing ${i + 1}/${dataRows.length}: ${recipientName}`);

      // ✅ Pass the template path directly - it will be read fresh each time
      const result = await generateAndStoreCertificate({
        templatePath, // This is the path, not the bytes
        data: row,
        fields: JSON.parse(JSON.stringify(fields)), // Deep clone to prevent mutation
        batchId,
        recipientName,
        recipientEmail,
        index: i,
        skipS3Upload: skipS3,
      });

      // ✅ Use the localPath from the result
      if (fs.existsSync(result.localPath)) {
        localFiles.push(result.localPath);
        console.log(`✅ Added to list: ${path.basename(result.localPath)}`);
      } else {
        console.error(`❌ File not found: ${result.localPath}`);
      }

      // Only create DB entry if not skipping S3
      if (!skipS3 && result.s3Url) {
        const certificateItem = await prisma.bulkCertificateItem.create({
          data: {
            certificateId: certificate.id,
            recipientName,
            recipientEmail,
            uniqueCode: result.uniqueCode,
            filePath: result.s3Url,
            isIssued: true,
            issuedAt: new Date(),
          },
        });
        certificateItems.push(certificateItem);
      } else {
        certificateItems.push({
          id: `local-${i}`,
          recipientName,
          recipientEmail,
          uniqueCode: result.uniqueCode,
          filePath: `/local/${batchId}/${result.uniqueCode}.pdf`,
          isIssued: true,
          issuedAt: new Date(),
        });
      }
    }

    // ✅ Verify all files exist before creating ZIP
    console.log(`\n📦 Files to zip (${localFiles.length}):`);
    const missingFiles = [];
    for (const file of localFiles) {
      const exists = fs.existsSync(file);
      const size = exists ? fs.statSync(file).size : 0;
      console.log(`   ${path.basename(file)}: ${exists ? `${size} bytes` : 'MISSING!'}`);
      if (!exists) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      console.error(`❌ ${missingFiles.length} files are missing!`);
    }

    // Create ZIP
    const zipPath = path.join(tempDir, `certificates.zip`);
    console.log(`\n📦 Creating ZIP at: ${zipPath}`);

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        console.log(`✅ ZIP created: ${zipPath}, size: ${archive.pointer()} bytes`);
        resolve();
      });

      archive.on("error", (err) => {
        console.error("Archive error:", err);
        reject(err);
      });

      archive.pipe(output);

      // ✅ Add each file with a clean name
      for (const file of localFiles) {
        if (fs.existsSync(file)) {
          const fileName = path.basename(file);
          console.log(`   Adding: ${fileName}`);
          archive.file(file, { name: fileName });
        } else {
          console.error(`   ❌ File not found: ${file}`);
        }
      }

      archive.finalize();
    });

    await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return {
      zipPath,
      certificateId: certificate.id,
      certificateItems,
    };
    
  } catch (error) {
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { status: "FAILED" },
    });
    console.error("Error generating certificates:", error);
    throw error;
  } finally {
    // Clean up individual files (keep zip)
    for (const file of localFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    }
  }
}

export async function processCertificateGeneration({
  excelData,
  templatePath,
  fields,
  fieldMapping,
  templateId,
  adminId,
  title,
}) {
  console.log("📊 Excel Data received:", excelData.length, "records");
  console.log("📊 First record sample:", JSON.stringify(excelData[0], null, 2));

  const reverseMapping = {};
  for (const [templateField, excelColumn] of Object.entries(fieldMapping)) {
    if (excelColumn) {
      reverseMapping[excelColumn] = templateField;
    }
  }

  console.log("🔄 Reverse mapping:", reverseMapping);

  const mappedData = excelData.map((row) => {
    const mappedRow = {};
    for (const [excelColumn, templateField] of Object.entries(reverseMapping)) {
      const value = row[excelColumn];
      mappedRow[templateField] = value ? sanitizeText(String(value)) : "";
    }
    return mappedRow;
  });

  console.log("📊 Mapped data count:", mappedData.length);
  console.log(
    "📊 First mapped record:",
    JSON.stringify(mappedData[0], null, 2),
  );

  const outputDir = process.cwd();
  const result = await generateCertificates({
    templatePath,
    dataRows: mappedData,
    fields,
    outputDir,
    templateId,
    adminId,
    title,
  });

  return result;
}
