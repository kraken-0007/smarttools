import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, StandardFonts } from 'pdf-lib';
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
