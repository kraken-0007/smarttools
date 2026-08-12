import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up GlobalWorkerOptions for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * 1. Convert PDF to an array of JPG Blobs.
 * Renders each page to a canvas at 2x scale.
 * 
 * @param {File|Blob} file 
 * @param {number} quality 
 * @returns {Promise<Array<{ page: number, blob: Blob, filename: string }>>}
 */
export async function pdfToJpg(file, quality = 0.92) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const result = [];
    const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "document";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to generate blob for page ${i}`));
        }, 'image/jpeg', quality);
      });
      
      result.push({
        page: i,
        blob,
        filename: `${baseName}_page_${i}.jpg`
      });
    }
    
    return result;
  } catch (error) {
    throw new Error(`PDF to JPG conversion failed: ${error.message}`);
  }
}

/**
 * 2. Convert an array of image Files (JPG/PNG) to a single PDF Blob.
 * 
 * @param {Array<File>} files 
 * @returns {Promise<Blob>}
 */
export async function jpgToPdf(files) {
  try {
    const pdfDoc = await PDFDocument.create();
    
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      
      let image;
      if (isPng) {
        image = await pdfDoc.embedPng(arrayBuffer);
      } else {
        image = await pdfDoc.embedJpg(arrayBuffer);
      }
      
      const { width, height } = image.scale(1);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width,
        height
      });
    }
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`JPG to PDF conversion failed: ${error.message}`);
  }
}

/**
 * 3. Merge multiple PDF Files into a single PDF Blob.
 * 
 * @param {Array<File>} files 
 * @returns {Promise<Blob>}
 */
export async function mergePDFs(files) {
  try {
    const mergedPdf = await PDFDocument.create();
    
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    
    const pdfBytes = await mergedPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Merging PDFs failed: ${error.message}`);
  }
}

/**
 * 4. Split a PDF File by page ranges (e.g. '1-3,5,7-9').
 * If no pageRanges provided, splits into individual pages.
 * 
 * @param {File} file 
 * @param {string} [pageRanges] 
 * @returns {Promise<Array<{ filename: string, blob: Blob }>>}
 */
export async function splitPDF(file, pageRanges) {
  try {
    const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "document";
    const arrayBuffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = srcDoc.getPageCount();
    
    let ranges = [];
    if (!pageRanges || pageRanges.trim() === '') {
      for (let i = 1; i <= totalPages; i++) {
        ranges.push(`${i}`);
      }
    } else {
      ranges = pageRanges.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    const outputFiles = [];
    
    for (const range of ranges) {
      let start, end;
      if (range.includes('-')) {
        const parts = range.split('-').map(s => s.trim());
        start = parseInt(parts[0], 10);
        end = parseInt(parts[1], 10);
      } else {
        start = parseInt(range, 10);
        end = start;
      }
      
      if (isNaN(start) || isNaN(end) || start < 1 || end < 1 || start > totalPages || end > totalPages || start > end) {
        throw new Error(`Invalid page range: "${range}". Document has ${totalPages} pages.`);
      }
      
      const newDoc = await PDFDocument.create();
      const pageIndices = [];
      for (let i = start - 1; i < end; i++) {
        pageIndices.push(i);
      }
      
      const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((page) => newDoc.addPage(page));
      
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      const filename = start === end 
        ? `${baseName}_page_${start}.pdf`
        : `${baseName}_pages_${start}-${end}.pdf`;
        
      outputFiles.push({ filename, blob });
    }
    
    return outputFiles;
  } catch (error) {
    throw new Error(`Splitting PDF failed: ${error.message}`);
  }
}

/**
 * 5. Compress a PDF by re-saving it with useObjectStreams: true.
 * 
 * @param {File} file 
 * @returns {Promise<Blob>}
 */
export async function compressPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Compressing PDF failed: ${error.message}`);
  }
}

/**
 * 6. Convert a PDF File to a Word-compatible HTML Document (.doc).
 * Uses pdfjs-dist to extract text.
 * 
 * @param {File} file 
 * @returns {Promise<Blob>}
 */
export async function pdfToWord(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let content = '';
    
    const escapeHtml = (text) => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items;
      
      // Reconstruct text lines sorted by Y coordinate desc, then X coordinate asc
      const sortedItems = [...items].sort((a, b) => {
        const yA = a.transform[5];
        const yB = b.transform[5];
        if (Math.abs(yA - yB) < 5) {
          return a.transform[4] - b.transform[4];
        }
        return yB - yA;
      });
      
      const lines = [];
      let currentLine = [];
      let lastY = null;
      
      for (const item of sortedItems) {
        const y = item.transform[5];
        if (lastY === null || Math.abs(y - lastY) < 5) {
          currentLine.push(item.str);
        } else {
          lines.push(currentLine.join(' '));
          currentLine = [item.str];
        }
        lastY = y;
      }
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
      }
      
      const pageContent = lines
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => `<p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.15;">${escapeHtml(line)}</p>`)
        .join('\n');
        
      content += `<div class="page">${pageContent}</div>`;
      if (i < pdf.numPages) {
        content += '<br clear="all" style="page-break-before:always" />';
      }
    }
    
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Converted Document</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page {
  size: 8.5in 11in;
  margin: 1.0in 1.0in 1.0in 1.0in;
}
div.page {
  page-break-after: always;
}
</style>
</head>
<body>${content}</body>
</html>`;

    return new Blob([html], { type: 'application/msword' });
  } catch (error) {
    throw new Error(`PDF to Word conversion failed: ${error.message}`);
  }
}

/**
 * 7. Convert a Word (.docx) or Text (.txt) File to PDF.
 * Uses a pure JS custom ZIP reader to extract word/document.xml without external libraries,
 * and standard pdf-lib to layout the formatted text.
 * 
 * @param {File} file 
 * @returns {Promise<Blob>}
 */
export async function wordToPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    let paragraphs = [];
    
    if (file.name && file.name.endsWith('.txt')) {
      const text = new TextDecoder().decode(arrayBuffer);
      paragraphs = text.split(/\r?\n/);
    } else {
      // DOCX processing
      const docXml = await extractDocumentXmlFromDocx(arrayBuffer);
      
      // Group by paragraphs: <w:p>...</w:p>
      const paragraphMatches = docXml.matchAll(/<w:p(?:\s[^>]*)?>(.*?)<\/w:p>/g);
      for (const match of paragraphMatches) {
        const pContent = match[1];
        const tMatches = [...pContent.matchAll(/<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/g)];
        const pText = tMatches.map(m => m[1]).join('');
        paragraphs.push(decodeXmlEntities(pText));
      }
      
      // Fallback: scan for all <w:t> elements if structure is non-standard
      if (paragraphs.length === 0) {
        const tMatches = [...docXml.matchAll(/<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/g)];
        if (tMatches.length > 0) {
          paragraphs = [decodeXmlEntities(tMatches.map(m => m[1]).join(' '))];
        } else {
          paragraphs = ['[No readable text found in document]'];
        }
      }
    }
    
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const lineHeight = 14;
    const margin = 50;
    const pageWidth = 612;
    const pageHeight = 792;
    const maxWidth = pageWidth - (margin * 2);
    
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;
    
    for (const paragraph of paragraphs) {
      const lines = wrapText(paragraph, maxWidth, font, fontSize);
      for (const line of lines) {
        if (y - lineHeight < margin) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        
        currentPage.drawText(line, {
          x: margin,
          y: y - fontSize,
          size: fontSize,
          font,
        });
        y -= lineHeight;
      }
      // Space between paragraphs
      y -= lineHeight * 0.5;
    }
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Word to PDF conversion failed: ${error.message}`);
  }
}

// ==========================================
// PRIVATE HELPER FUNCTIONS
// ==========================================

/**
 * Extract word/document.xml from a standard .docx ZIP file using built-in DecompressionStream
 * @param {ArrayBuffer} arrayBuffer 
 * @returns {Promise<string>}
 */
async function extractDocumentXmlFromDocx(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  let offset = 0;
  
  while (offset < bytes.length - 30) {
    const signature = view.getUint32(offset, true);
    if (signature === 0x04034b50) { // Local File Header Signature
      const compressionMethod = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const fileNameLength = view.getUint16(offset + 26, true);
      const extraFieldLength = view.getUint16(offset + 28, true);
      
      const fileNameBytes = bytes.subarray(offset + 30, offset + 30 + fileNameLength);
      const fileName = new TextDecoder().decode(fileNameBytes);
      
      const dataOffset = offset + 30 + fileNameLength + extraFieldLength;
      
      if (fileName === 'word/document.xml') {
        const compressedData = bytes.subarray(dataOffset, dataOffset + compressedSize);
        if (compressionMethod === 8) { // DEFLATE
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(compressedData);
          writer.close();
          const response = new Response(ds.readable);
          const decompressedBytes = await response.arrayBuffer();
          return new TextDecoder().decode(decompressedBytes);
        } else if (compressionMethod === 0) { // STORED (uncompressed)
          return new TextDecoder().decode(compressedData);
        } else {
          throw new Error(`Unsupported compression method: ${compressionMethod} for word/document.xml`);
        }
      }
      
      offset = dataOffset + compressedSize; // Hop to the next Local File Header
    } else {
      offset++;
    }
  }
  
  throw new Error('word/document.xml not found inside the .docx package');
}

/**
 * Decode common XML entities
 * @param {string} str 
 * @returns {string}
 */
function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'");
}

/**
 * Wrap paragraphs into multiple lines according to a maximum pixel width
 * @param {string} text 
 * @param {number} maxWidth 
 * @param {object} font 
 * @param {number} fontSize 
 * @returns {Array<string>}
 */
function wrapText(text, maxWidth, font, fontSize) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is longer than max width, force wrap it
        lines.push(word);
        currentLine = '';
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}



/**
 * 1. Convert PDF to an array of PNG Blobs.
 * Renders each page to a canvas at specified scale (default 2).
 * 
 * @param {File|Blob} file 
 * @param {number} scale 
 * @returns {Promise<Array<{ page: number, blob: Blob, filename: string }>>}
 */
export async function pdfToPng(file, scale = 2) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const result = [];
    const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "document";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to generate PNG blob for page ${i}`));
        }, 'image/png');
      });
      
      result.push({
        page: i,
        blob,
        filename: `${baseName}_page_${i}.png`
      });
    }
    
    return result;
  } catch (error) {
    throw new Error(`PDF to PNG conversion failed: ${error.message}`);
  }
}

/**
 * 2. Convert an array of PNG/JPG image Files to a single PDF Blob.
 * Alias for jpgToPdf.
 * 
 * @param {Array<File>} files 
 * @returns {Promise<Blob>}
 */
export async function pngToPdf(files) {
  try {
    return await jpgToPdf(files);
  } catch (error) {
    throw new Error(`PNG to PDF conversion failed: ${error.message}`);
  }
}

/**
 * 3. Rotate all pages of a PDF by a given angle (adds to existing rotation).
 * 
 * @param {File|Blob} file 
 * @param {number} angle 
 * @returns {Promise<Blob>}
 */
export async function rotatePdf(file, angle = 90) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    for (const page of pages) {
      const currentRotation = page.getRotation().angle || 0;
      page.setRotation(degrees((currentRotation + angle) % 360));
    }
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Rotating PDF failed: ${error.message}`);
  }
}

/**
 * 4. Delete specific pages from a PDF.
 * 
 * @param {File|Blob} file 
 * @param {Array<number>} pageNums 1-indexed page numbers to delete
 * @returns {Promise<Blob>}
 */
export async function deletePdfPages(file, pageNums) {
  try {
    if (!Array.isArray(pageNums) || pageNums.length === 0) {
      throw new Error('pageNums must be a non-empty array of 1-indexed page numbers.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount();
    
    const indicesToDelete = [...new Set(pageNums)]
      .map(num => num - 1)
      .filter(idx => idx >= 0 && idx < totalPages)
      .sort((a, b) => b - a);
      
    if (indicesToDelete.length === 0) {
      throw new Error('No valid page numbers provided to delete.');
    }
    
    for (const index of indicesToDelete) {
      pdfDoc.removePage(index);
    }
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Deleting PDF pages failed: ${error.message}`);
  }
}

/**
 * 5. Extract specific pages from a PDF into a new PDF.
 * 
 * @param {File|Blob} file 
 * @param {Array<number>} pageNums 1-indexed page numbers to extract
 * @returns {Promise<Blob>}
 */
export async function extractPdfPages(file, pageNums) {
  try {
    if (!Array.isArray(pageNums) || pageNums.length === 0) {
      throw new Error('pageNums must be a non-empty array of 1-indexed page numbers.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = srcDoc.getPageCount();
    
    const indicesToExtract = pageNums
      .map(num => num - 1)
      .filter(idx => idx >= 0 && idx < totalPages);
      
    if (indicesToExtract.length === 0) {
      throw new Error('No valid page numbers provided to extract.');
    }
    
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, indicesToExtract);
    copiedPages.forEach(page => newDoc.addPage(page));
    
    const pdfBytes = await newDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Extracting PDF pages failed: ${error.message}`);
  }
}

/**
 * 6. Reorder pages of a PDF based on a 0-indexed array of page positions.
 * 
 * @param {File|Blob} file 
 * @param {Array<number>} newOrder 0-indexed array of page positions (e.g. [2, 0, 1])
 * @returns {Promise<Blob>}
 */
export async function reorderPdfPages(file, newOrder) {
  try {
    if (!Array.isArray(newOrder) || newOrder.length === 0) {
      throw new Error('newOrder must be a non-empty array of 0-indexed page positions.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = srcDoc.getPageCount();
    
    const validOrder = newOrder.filter(idx => idx >= 0 && idx < totalPages);
    if (validOrder.length === 0) {
      throw new Error('No valid page positions in newOrder.');
    }
    
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, validOrder);
    copiedPages.forEach(page => newDoc.addPage(page));
    
    const pdfBytes = await newDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Reordering PDF pages failed: ${error.message}`);
  }
}

/**
 * 7. Count total number of pages in a PDF file.
 * 
 * @param {File|Blob} file 
 * @returns {Promise<{ pages: number, filename: string, fileSize: number }>}
 */
export async function countPdfPages(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPageCount();
    return {
      pages,
      filename: file.name || 'document.pdf',
      fileSize: file.size || arrayBuffer.byteLength || 0
    };
  } catch (error) {
    throw new Error(`Counting PDF pages failed: ${error.message}`);
  }
}

/**
 * 8. Read metadata from a PDF file.
 * 
 * @param {File|Blob} file 
 * @returns {Promise<object>}
 */
export async function getPdfMetadata(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    let title = null, author = null, subject = null, keywords = null;
    let creator = null, producer = null, creationDate = null, modificationDate = null;
    let pages = 0;
    let isEncrypted = false;

    // Check encryption with pdfjs-dist
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
      await loadingTask.promise;
    } catch (err) {
      if (err.name === 'PasswordException' || (err.message && err.message.toLowerCase().includes('password'))) {
        isEncrypted = true;
      }
    }

    // Read metadata with pdf-lib
    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: true });
      title = pdfDoc.getTitle() || null;
      author = pdfDoc.getAuthor() || null;
      subject = pdfDoc.getSubject() || null;
      keywords = pdfDoc.getKeywords() || null;
      creator = pdfDoc.getCreator() || null;
      producer = pdfDoc.getProducer() || null;
      creationDate = pdfDoc.getCreationDate() || null;
      modificationDate = pdfDoc.getModificationDate() || null;
      pages = pdfDoc.getPageCount();
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('encrypted')) {
        isEncrypted = true;
      }
    }

    return {
      title,
      author,
      subject,
      keywords,
      creator,
      producer,
      creationDate,
      modificationDate,
      pages,
      isEncrypted,
      fileSize: file.size || arrayBuffer.byteLength || 0,
      filename: file.name || 'document.pdf'
    };
  } catch (error) {
    throw new Error(`Getting PDF metadata failed: ${error.message}`);
  }
}

/**
 * 9. Protect a PDF file by updating metadata. Note: Standard PDF encryption
 * requires WASM/native libraries; this tool updates metadata flags and re-saves as a valid PDF.
 * 
 * @param {File|Blob} file 
 * @param {string} password 
 * @returns {Promise<Blob>}
 */
export async function protectPdf(file, password) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    pdfDoc.setProducer(`Protected PDF (Key: ${password ? 'Set' : 'None'})`);
    pdfDoc.setSubject('Password Protected');
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Protecting PDF failed: ${error.message}`);
  }
}

/**
 * 10. Unlock a password-protected PDF file by rendering pages to canvas and generating a new PDF.
 * 
 * @param {File|Blob} file 
 * @param {string} password 
 * @returns {Promise<Blob>}
 */
export async function unlockPdf(file, password) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password });
    const pdf = await loadingTask.promise;

    const newPdfDoc = await PDFDocument.create();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');

      await page.render({ canvasContext: context, viewport }).promise;

      const imgBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to render page ${i} for unlocking`));
        }, 'image/jpeg', 0.92);
      });

      const imgArrayBuffer = await imgBlob.arrayBuffer();
      const image = await newPdfDoc.embedJpg(imgArrayBuffer);
      const newPage = newPdfDoc.addPage([viewport.width / 2, viewport.height / 2]);
      newPage.drawImage(image, {
        x: 0,
        y: 0,
        width: viewport.width / 2,
        height: viewport.height / 2
      });
    }

    const pdfBytes = await newPdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    if (error.name === 'PasswordException') {
      throw new Error('Incorrect password provided for unlocking PDF.');
    }
    throw new Error(`Unlocking PDF failed: ${error.message}`);
  }
}

/**
 * Helper to parse color string (rgb(r,g,b) or hex #rrggbb) to pdf-lib rgb() object
 */
function parsePdfColor(colorStr) {
  if (typeof colorStr === 'object' && colorStr.type) return colorStr;
  if (typeof colorStr === 'string') {
    const matchRgb = colorStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (matchRgb) {
      return rgb(parseInt(matchRgb[1], 10)/255, parseInt(matchRgb[2], 10)/255, parseInt(matchRgb[3], 10)/255);
    }
    const matchHex = colorStr.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (matchHex) {
      return rgb(parseInt(matchHex[1], 16)/255, parseInt(matchHex[2], 16)/255, parseInt(matchHex[3], 16)/255);
    }
  }
  return rgb(0.78, 0.78, 0.78);
}

/**
 * 11. Add text watermark to all pages of a PDF.
 * 
 * @param {File|Blob} file 
 * @param {object} options { text, fontSize=50, opacity=0.3, color='rgb(200,200,200)', rotation=45, position='center' }
 * @returns {Promise<Blob>}
 */
export async function addWatermarkPdf(file, options = {}) {
  try {
    const {
      text = 'WATERMARK',
      fontSize = 50,
      opacity = 0.3,
      color = 'rgb(200,200,200)',
      rotation = 45,
      position = 'center'
    } = options;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const watermarkColor = parsePdfColor(color);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      let x = (width - textWidth) / 2;
      let y = (height - textHeight) / 2;

      if (position === 'top-left') {
        x = 30;
        y = height - textHeight - 30;
      } else if (position === 'top-right') {
        x = width - textWidth - 30;
        y = height - textHeight - 30;
      } else if (position === 'bottom-left') {
        x = 30;
        y = 30;
      } else if (position === 'bottom-right') {
        x = width - textWidth - 30;
        y = 30;
      } else if (position === 'top-center') {
        x = (width - textWidth) / 2;
        y = height - textHeight - 30;
      } else if (position === 'bottom-center') {
        x = (width - textWidth) / 2;
        y = 30;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: watermarkColor,
        opacity,
        rotate: degrees(rotation)
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Adding watermark failed: ${error.message}`);
  }
}

/**
 * 12. Add page numbers to all pages of a PDF.
 * 
 * @param {File|Blob} file 
 * @param {object} options { position='bottom-center', fontSize=14, margin=30, startAt=1 }
 * @returns {Promise<Blob>}
 */
export async function addPageNumbersPdf(file, options = {}) {
  try {
    const {
      position = 'bottom-center',
      fontSize = 14,
      margin = 30,
      startAt = 1
    } = options;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = pdfDoc.getPageCount();
    const pages = pdfDoc.getPages();

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const pageNumText = `${startAt + i}`;
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(pageNumText, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      let x = (width - textWidth) / 2;
      let y = margin;

      if (position === 'bottom-left') {
        x = margin;
        y = margin;
      } else if (position === 'bottom-right') {
        x = width - textWidth - margin;
        y = margin;
      } else if (position === 'top-center') {
        x = (width - textWidth) / 2;
        y = height - margin - textHeight;
      } else if (position === 'top-left') {
        x = margin;
        y = height - margin - textHeight;
      } else if (position === 'top-right') {
        x = width - textWidth - margin;
        y = height - margin - textHeight;
      }

      page.drawText(pageNumText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0)
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Adding page numbers failed: ${error.message}`);
  }
}

/**
 * 13. Extract embedded images from a PDF file.
 * 
 * @param {File|Blob} file 
 * @returns {Promise<Array<{ page: number, blob: Blob, filename: string }>>}
 */
export async function extractImagesFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const result = [];
    const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "document";
    let imageCounter = 1;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const ops = await page.getOperatorList();

      for (let j = 0; j < ops.fnArray.length; j++) {
        const fn = ops.fnArray[j];
        if (
          fn === pdfjsLib.OPS.paintImageXObject ||
          fn === pdfjsLib.OPS.paintInlineImageXObject ||
          fn === pdfjsLib.OPS.paintImageMaskXObject
        ) {
          const imgName = ops.argsArray[j][0];
          try {
            let imgObj;
            if (fn === pdfjsLib.OPS.paintInlineImageXObject) {
              imgObj = ops.argsArray[j][0];
            } else {
              imgObj = await page.objs.get(imgName);
            }

            if (imgObj && imgObj.width && imgObj.height) {
              const canvas = document.createElement('canvas');
              canvas.width = imgObj.width;
              canvas.height = imgObj.height;
              const ctx = canvas.getContext('2d');

              const imgData = ctx.createImageData(imgObj.width, imgObj.height);
              if (imgObj.data) {
                if (imgObj.data.length === imgObj.width * imgObj.height * 4) {
                  imgData.data.set(imgObj.data);
                } else if (imgObj.data.length === imgObj.width * imgObj.height * 3) {
                  for (let src = 0, dst = 0; src < imgObj.data.length; src += 3, dst += 4) {
                    imgData.data[dst] = imgObj.data[src];
                    imgData.data[dst + 1] = imgObj.data[src + 1];
                    imgData.data[dst + 2] = imgObj.data[src + 2];
                    imgData.data[dst + 3] = 255;
                  }
                } else if (imgObj.data.length === imgObj.width * imgObj.height) {
                  for (let src = 0, dst = 0; src < imgObj.data.length; src++, dst += 4) {
                    const val = imgObj.data[src];
                    imgData.data[dst] = val;
                    imgData.data[dst + 1] = val;
                    imgData.data[dst + 2] = val;
                    imgData.data[dst + 3] = 255;
                  }
                }
                ctx.putImageData(imgData, 0, 0);

                const blob = await new Promise((resolve) => {
                  canvas.toBlob((b) => resolve(b), 'image/png');
                });

                if (blob) {
                  result.push({
                    page: i,
                    blob,
                    filename: `${baseName}_p${i}_img${imageCounter++}.png`
                  });
                }
              }
            }
          } catch (e) {
            // Ignore individual image extraction errors
          }
        }
      }
    }

    return result;
  } catch (error) {
    throw new Error(`Extracting images from PDF failed: ${error.message}`);
  }
}

// ==========================================
// PUBLIC SHARED HELPERS
// ==========================================

/**
 * Trigger file download for a given Blob
 * @param {Blob} blob 
 * @param {string} filename 
 */
export function downloadBlob(blob, filename) {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format raw bytes count into a human-readable size string
 * @param {number} bytes 
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
