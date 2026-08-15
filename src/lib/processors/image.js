/**
 * Production-grade Image Processing Utility Module
 * 
 * This module exports various image processing functions using only the browser's 
 * native HTML5 Canvas API, ensuring no external dependencies are required. All functions 
 * handle URL lifecycle management (creation/cleanup of Object URLs) and catch errors gracefully.
 */

/**
 * Internal helper to load a File or Blob into an HTMLImageElement safely.
 * Automatically cleans up the Object URL upon completion (success or failure)
 * to avoid memory leaks.
 * 
 * @param {Blob|File} file - The source image file/blob.
 * @returns {Promise<HTMLImageElement>} Resolve with loaded HTMLImageElement.
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      return reject(new Error('Invalid image file. Please provide a valid File or Blob object.'));
    }
    
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image. The file may be corrupt or not a valid image format.'));
    };
    
    img.src = objectUrl;
  });
}

/**
 * Internal helper to convert a canvas to a Blob in a promise-based wrapper.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {string} type - MIME type of the output blob (e.g. 'image/jpeg').
 * @param {number} [quality] - Image quality value between 0 and 1 (only for jpeg/webp).
 * @returns {Promise<Blob>} Resolve with output image Blob.
 */
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas export failed to produce a valid Blob.'));
          }
        },
        type,
        quality
      );
    } catch (err) {
      reject(new Error(`Failed to export canvas to Blob: ${err.message}`));
    }
  });
}

/**
 * 1. Compress Image
 * Takes an image File/Blob, loads it, draws it onto a canvas, and exports as JPEG with the given quality.
 * If the input is already JPEG, it is still re-encoded at the given quality.
 * Since JPEG does not support transparency, transparent areas are filled with a white background.
 * 
 * @param {File|Blob} file - The image to compress.
 * @param {number} [quality=0.7] - The quality of compressed image (0.0 to 1.0).
 * @returns {Promise<Blob>} Re-encoded JPEG image blob.
 */
export async function compressImage(file, quality = 0.7) {
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain canvas 2D rendering context.');
    }
    
    // Fill background with white to avoid transparent pixels becoming black when exported to JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the image
    ctx.drawImage(img, 0, 0);
    
    // Re-encode at the given quality as image/jpeg
    const compressedBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
    return compressedBlob;
  } catch (error) {
    throw new Error(`compressImage failed: ${error.message}`);
  }
}

/**
 * 2. Resize Image
 * Takes an image File/Blob, loads it, and resizes it to target dimensions.
 * Maintains aspect ratio if only targetWidth or targetHeight is provided.
 * Returns a Blob in the same format as the input.
 * 
 * @param {File|Blob} file - The image file/blob to resize.
 * @param {number} [targetWidth] - The target width in pixels.
 * @param {number} [targetHeight] - The target height in pixels.
 * @returns {Promise<Blob>} Resized image blob.
 */
export async function resizeImage(file, targetWidth, targetHeight) {
  try {
    const img = await loadImage(file);
    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;
    const aspectRatio = origWidth / origHeight;
    
    let width = targetWidth;
    let height = targetHeight;
    
    // Handle aspect ratio calculation
    if (width && !height) {
      height = Math.round(width / aspectRatio);
    } else if (!width && height) {
      width = Math.round(height * aspectRatio);
    } else if (!width && !height) {
      width = origWidth;
      height = origHeight;
    }
    
    // Guarantee non-zero dimensions
    width = Math.max(1, Math.round(width));
    height = Math.max(1, Math.round(height));
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain canvas 2D rendering context.');
    }
    
    const format = file.type || 'image/png';
    // Fill white background for JPEG conversion
    if (format === 'image/jpeg' || format === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
    
    // Draw resized image
    ctx.drawImage(img, 0, 0, width, height);
    
    const quality = (format === 'image/jpeg' || format === 'image/jpg' || format === 'image/webp') ? 0.92 : undefined;
    const resizedBlob = await canvasToBlob(canvas, format, quality);
    return resizedBlob;
  } catch (error) {
    throw new Error(`resizeImage failed: ${error.message}`);
  }
}

/**
 * 3. Crop Image
 * Takes an image File/Blob, loads it, crops the region at (x, y, width, height), and returns a Blob.
 * Preserves the format of the input file.
 * 
 * @param {File|Blob} file - The image file/blob to crop.
 * @param {number} x - The starting X coordinate.
 * @param {number} y - The starting Y coordinate.
 * @param {number} width - Crop width.
 * @param {number} height - Crop height.
 * @returns {Promise<Blob>} Cropped region as a Blob.
 */
export async function cropImage(file, x, y, width, height) {
  try {
    const img = await loadImage(file);
    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;
    
    // Constrain X and Y within original bounds
    const cropX = Math.max(0, Math.min(origWidth - 1, Math.round(x)));
    const cropY = Math.max(0, Math.min(origHeight - 1, Math.round(y)));
    
    let cropWidth = Math.round(width);
    let cropHeight = Math.round(height);
    
    if (cropWidth <= 0 || cropHeight <= 0) {
      throw new Error('Crop width and height must be greater than zero.');
    }
    
    // Constrain dimensions to fit within remaining image boundaries from coordinates
    cropWidth = Math.min(origWidth - cropX, cropWidth);
    cropHeight = Math.min(origHeight - cropY, cropHeight);
    
    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain canvas 2D rendering context.');
    }
    
    const format = file.type || 'image/png';
    // Fill white background for JPEG
    if (format === 'image/jpeg' || format === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cropWidth, cropHeight);
    }
    
    // Crop using source parameters on drawImage
    ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    
    const quality = (format === 'image/jpeg' || format === 'image/jpg' || format === 'image/webp') ? 0.92 : undefined;
    const croppedBlob = await canvasToBlob(canvas, format, quality);
    return croppedBlob;
  } catch (error) {
    throw new Error(`cropImage failed: ${error.message}`);
  }
}

/**
 * 4. Convert Image
 * Takes an image File/Blob, loads it, draws it on a canvas, and exports it in the target format.
 * Supported target formats: 'image/jpeg', 'image/png', 'image/webp'.
 * 
 * @param {File|Blob} file - The image file/blob to convert.
 * @param {string} targetFormat - Target MIME type ('image/jpeg', 'image/png', 'image/webp').
 * @param {number} [quality=0.92] - Quality level (0.0 to 1.0) for formats supporting lossy compression.
 * @returns {Promise<Blob>} Converted image blob.
 */
export async function convertImage(file, targetFormat, quality = 0.92) {
  try {
    const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validFormats.includes(targetFormat)) {
      throw new Error(`Unsupported target format: "${targetFormat}". Supported formats are: ${validFormats.join(', ')}`);
    }
    
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain canvas 2D rendering context.');
    }
    
    // Fill white background if target is JPEG to cleanly handle transparent images
    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.drawImage(img, 0, 0);
    
    const exportQuality = (targetFormat === 'image/jpeg' || targetFormat === 'image/webp') ? quality : undefined;
    const convertedBlob = await canvasToBlob(canvas, targetFormat, exportQuality);
    return convertedBlob;
  } catch (error) {
    throw new Error(`convertImage failed: ${error.message}`);
  }
}

/**
 * Helper: Download Blob
 * Creates a temporary <a> element, sets href to object URL, sets download attribute, 
 * clicks it programmatically, and cleans up after the trigger completes.
 * 
 * @param {Blob} blob - The blob to download.
 * @param {string} filename - The file name for the download.
 */
export function downloadBlob(blob, filename) {
  if (!blob || !(blob instanceof Blob)) {
    throw new Error('downloadBlob failed: Invalid Blob parameter.');
  }
  
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename || 'download';
  
  // Append to body to make it work on all browsers (especially Firefox/Safari)
  document.body.appendChild(a);
  a.click();
  
  // Clean up element immediately, and revoke URL with a small timeout
  document.body.removeChild(a);
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 100);
}

/**
 * Helper: Format File Size
 * Converts a byte value into a highly readable human-friendly string (e.g., KB, MB).
 * 
 * @param {number} bytes - Number of bytes to format.
 * @returns {string} Human readable formatted file size.
 */
export function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes)) {
    return '0 B';
  }
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  
  // Show no decimals for raw bytes, and up to two decimal places otherwise, removing trailing zeros
  const formattedValue = i === 0 ? value : value.toFixed(2).replace(/\.?0+$/, '');
  return `${formattedValue} ${sizes[i]}`;
}

/**
 * Helper: Get Output Filename
 * Replaces the file extension of inputName with a new one.
 * 
 * @param {string} inputName - Original filename.
 * @param {string} newExt - The new extension (with or without a leading dot).
 * @returns {string} The output filename with the new extension.
 */
export function getOutputFilename(inputName, newExt) {
  if (typeof inputName !== 'string') {
    throw new Error('getOutputFilename failed: inputName must be a string.');
  }
  if (typeof newExt !== 'string') {
    throw new Error('getOutputFilename failed: newExt must be a string.');
  }
  
  // Clean new extension by stripping leading dot if present
  const cleanExt = newExt.startsWith('.') ? newExt.slice(1) : newExt;
  
  const lastDotIndex = inputName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return `${inputName}.${cleanExt}`;
  }
  
  const baseName = inputName.substring(0, lastDotIndex);
  return `${baseName}.${cleanExt}`;
}

/**
 * 5. Rotate Image (90° increments)
 * Rotates an image by 90, 180, or 270 degrees.
 * 
 * @param {File|Blob} file - The image file.
 * @param {number} degrees - Rotation in degrees (90, 180, 270, -90, -180, -270).
 * @returns {Promise<Blob>} Rotated image blob.
 */
export async function rotateImage(file, degrees) {
  try {
    const img = await loadImage(file);
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;
    
    const normalized = ((degrees % 360) + 360) % 360;
    const swap = normalized === 90 || normalized === 270;
    
    const canvas = document.createElement('canvas');
    canvas.width = swap ? origH : origW;
    canvas.height = swap ? origW : origH;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');
    
    const format = file.type || 'image/png';
    if (format === 'image/jpeg' || format === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(normalized * Math.PI / 180);
    ctx.drawImage(img, -origW / 2, -origH / 2);
    
    const quality = (format === 'image/jpeg' || format === 'image/jpg' || format === 'image/webp') ? 0.92 : undefined;
    return await canvasToBlob(canvas, format, quality);
  } catch (error) {
    throw new Error(`rotateImage failed: ${error.message}`);
  }
}

/**
 * 6. Convert Image with Background Color
 * Like convertImage but allows specifying a background fill color
 * (useful for PNG→JPG where transparency needs a fill).
 * 
 * @param {File|Blob} file - Source image.
 * @param {string} targetFormat - Target MIME type.
 * @param {string} bgColor - CSS color string for background fill (e.g. '#FFFFFF', '#000000').
 * @param {number} [quality=0.92] - Quality for lossy formats.
 * @returns {Promise<Blob>} Converted blob.
 */
export async function convertImageWithBackground(file, targetFormat, bgColor, quality = 0.92) {
  try {
    const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validFormats.includes(targetFormat)) {
      throw new Error(`Unsupported target format: "${targetFormat}".`);
    }
    
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');
    
    // Fill background if provided and target doesn't support transparency
    if (bgColor && (targetFormat === 'image/jpeg' || bgColor !== 'transparent')) {
      if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    ctx.drawImage(img, 0, 0);
    
    const exportQuality = (targetFormat === 'image/jpeg' || targetFormat === 'image/webp') ? quality : undefined;
    return await canvasToBlob(canvas, targetFormat, exportQuality);
  } catch (error) {
    throw new Error(`convertImageWithBackground failed: ${error.message}`);
  }
}

/**
 * 7. Crop and Rotate in one pass
 * Crops a region from the image after applying rotation.
 * 
 * @param {File|Blob} file - Source image.
 * @param {number} x - Crop X (in rotated image space).
 * @param {number} y - Crop Y (in rotated image space).
 * @param {number} width - Crop width.
 * @param {number} height - Crop height.
 * @param {number} [degrees=0] - Rotation to apply before cropping.
 * @returns {Promise<Blob>} Cropped (and optionally rotated) blob.
 */
export async function cropAndRotate(file, x, y, width, height, degrees = 0) {
  try {
    const img = await loadImage(file);
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;
    
    let sourceImg = img;
    let srcW = origW;
    let srcH = origH;
    
    // Apply rotation first if needed
    const normalized = ((degrees % 360) + 360) % 360;
    if (normalized !== 0) {
      const swap = normalized === 90 || normalized === 270;
      const rotCanvas = document.createElement('canvas');
      rotCanvas.width = swap ? origH : origW;
      rotCanvas.height = swap ? origW : origH;
      const rotCtx = rotCanvas.getContext('2d');
      
      const format = file.type || 'image/png';
      if (format === 'image/jpeg' || format === 'image/jpg') {
        rotCtx.fillStyle = '#FFFFFF';
        rotCtx.fillRect(0, 0, rotCanvas.width, rotCanvas.height);
      }
      
      rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      rotCtx.rotate(normalized * Math.PI / 180);
      rotCtx.drawImage(img, -origW / 2, -origH / 2);
      
      // Convert rotated canvas back to image
      const rotBlob = await canvasToBlob(rotCanvas, format, 0.92);
      sourceImg = await loadImage(rotBlob);
      srcW = sourceImg.naturalWidth || sourceImg.width;
      srcH = sourceImg.naturalHeight || sourceImg.height;
    }
    
    // Now crop
    const cx = Math.max(0, Math.min(srcW - 1, Math.round(x)));
    const cy = Math.max(0, Math.min(srcH - 1, Math.round(y)));
    let cw = Math.max(1, Math.round(width));
    let ch = Math.max(1, Math.round(height));
    cw = Math.min(srcW - cx, cw);
    ch = Math.min(srcH - cy, ch);
    
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');
    
    const format = file.type || 'image/png';
    if (format === 'image/jpeg' || format === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cw, ch);
    }
    
    ctx.drawImage(sourceImg, cx, cy, cw, ch, 0, 0, cw, ch);
    
    const quality = (format === 'image/jpeg' || format === 'image/jpg' || format === 'image/webp') ? 0.92 : undefined;
    return await canvasToBlob(canvas, format, quality);
  } catch (error) {
    throw new Error(`cropAndRotate failed: ${error.message}`);
  }
}


/**
 * Internal helper to parse EXIF orientation from a JPEG ArrayBuffer.
 * Returns orientation integer (1-8) or null if not found/invalid.
 */
function parseExifOrientation(arrayBuffer) {
  try {
    const view = new DataView(arrayBuffer);
    if (view.byteLength < 2 || view.getUint16(0, false) !== 0xFFD8) {
      return null;
    }
    const length = view.byteLength;
    let offset = 2;
    while (offset + 4 <= length) {
      const marker = view.getUint16(offset, false);
      if (marker === 0xFFE1) {
        const app1Length = view.getUint16(offset + 2, false);
        const exifHeaderOffset = offset + 4;
        if (
          exifHeaderOffset + 6 <= length &&
          view.getUint32(exifHeaderOffset, false) === 0x45786966 &&
          view.getUint16(exifHeaderOffset + 4, false) === 0x0000
        ) {
          const tiffOffset = exifHeaderOffset + 6;
          if (tiffOffset + 8 > length) return null;
          const endianness = view.getUint16(tiffOffset, false);
          const littleEndian = endianness === 0x4949; // 'II'
          if (!littleEndian && endianness !== 0x4D4D) { // 'MM'
            return null;
          }
          if (view.getUint16(tiffOffset + 2, littleEndian) !== 0x002A) {
            return null;
          }
          const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian);
          if (firstIfdOffset < 8) return null;

          let dirOffset = tiffOffset + firstIfdOffset;
          if (dirOffset + 2 > length) return null;
          const entries = view.getUint16(dirOffset, littleEndian);
          dirOffset += 2;

          for (let i = 0; i < entries; i++) {
            const entryOffset = dirOffset + i * 12;
            if (entryOffset + 12 > length) break;
            const tag = view.getUint16(entryOffset, littleEndian);
            if (tag === 0x0112) { // Orientation tag
              const value = view.getUint16(entryOffset + 8, littleEndian);
              return value;
            }
          }
        }
        offset += 2 + app1Length;
      } else if ((marker & 0xFF00) === 0xFF00) {
        if (offset + 4 > length) break;
        const markerLength = view.getUint16(offset + 2, false);
        offset += 2 + markerLength;
      } else {
        break;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * 8. Flip Image
 * Flips an image horizontally or vertically.
 * 
 * @param {File|Blob} file - Source image.
 * @param {string} direction - 'horizontal' or 'vertical'.
 * @returns {Promise<Blob>} Flipped image blob.
 */
export async function flipImage(file, direction) {
  try {
    if (direction !== 'horizontal' && direction !== 'vertical') {
      throw new Error('Direction must be "horizontal" or "vertical".');
    }
    const img = await loadImage(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');

    const format = file.type || 'image/png';
    if (format === 'image/jpeg' || format === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    if (direction === 'horizontal') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, height);
      ctx.scale(1, -1);
    }

    ctx.drawImage(img, 0, 0);
    const quality = (format === 'image/jpeg' || format === 'image/jpg' || format === 'image/webp') ? 0.92 : undefined;
    return await canvasToBlob(canvas, format, quality);
  } catch (error) {
    throw new Error(`flipImage failed: ${error.message}`);
  }
}

/**
 * 9. Image to Base64
 * Reads an image file and converts it to a Data URL base64 string with metadata.
 * 
 * @param {File|Blob} file - Source image file.
 * @returns {Promise<{base64: string, filename: string, fileSize: number, mimeType: string}>}
 */
export async function imageToBase64(file) {
  try {
    if (!file || !(file instanceof Blob)) {
      throw new Error('Invalid image file provided.');
    }
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file as Data URL.'));
      reader.readAsDataURL(file);
    });
    return {
      base64,
      filename: file.name || 'image',
      fileSize: file.size || 0,
      mimeType: file.type || 'image/png'
    };
  } catch (error) {
    throw new Error(`imageToBase64 failed: ${error.message}`);
  }
}

/**
 * 10. Base64 to Image
 * Takes a base64 string (with or without data URL prefix), validates it, converts to Blob, and loads metadata.
 * 
 * @param {string} base64String - Base64 encoded string or Data URL.
 * @returns {Promise<{blob: Blob, width: number, height: number, mimeType: string}>}
 */
export async function base64ToImage(base64String) {
  try {
    if (!base64String || typeof base64String !== 'string') {
      throw new Error('Invalid base64 string provided.');
    }
    let mimeType = 'image/png';
    let base64Data = base64String.trim();

    // Handle data URL prefix if present
    const dataUrlMatch = base64Data.match(/^data:(image\/[a-zA-Z0-9+-]+);base64,(.*)$/s);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
      base64Data = dataUrlMatch[2];
    } else if (base64Data.includes(',')) {
      const parts = base64Data.split(',');
      const headerMatch = parts[0].match(/data:(.*?);base64/);
      if (headerMatch) mimeType = headerMatch[1] || mimeType;
      base64Data = parts[1];
    }

    base64Data = base64Data.replace(/\s/g, '');

    if (!base64Data) {
      throw new Error('Empty base64 data.');
    }

    let byteCharacters;
    try {
      byteCharacters = atob(base64Data);
    } catch (err) {
      throw new Error('Invalid base64 string.');
    }

    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const img = await loadImage(blob);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    return { blob, width, height, mimeType };
  } catch (error) {
    throw new Error(`base64ToImage failed: ${error.message}`);
  }
}

/**
 * 11. Grayscale Image
 * Converts image to grayscale using CSS filters.
 * 
 * @param {File|Blob} file - Source image.
 * @returns {Promise<Blob>} Grayscale image blob.
 */
export async function grayscaleImage(file) {
  try {
    const img = await loadImage(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');

    const format = file.type || 'image/png';
    if (format === 'image/jpeg' || format === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.filter = 'grayscale(1)';
    ctx.drawImage(img, 0, 0);

    const quality = (format === 'image/jpeg' || format === 'image/jpg' || format === 'image/webp') ? 0.92 : undefined;
    return await canvasToBlob(canvas, format, quality);
  } catch (error) {
    throw new Error(`grayscaleImage failed: ${error.message}`);
  }
}

/**
 * 12. Blur Image
 * Applies blur filter to image.
 * 
 * @param {File|Blob} file - Source image.
 * @param {number} [radius=5] - Blur radius in pixels.
 * @returns {Promise<Blob>} Blurred image blob.
 */
export async function blurImage(file, radius = 5) {
  try {
    const img = await loadImage(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');

    const format = file.type || 'image/png';
    if (format === 'image/jpeg' || format === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(img, 0, 0);

    const quality = (format === 'image/jpeg' || format === 'image/jpg' || format === 'image/webp') ? 0.92 : undefined;
    return await canvasToBlob(canvas, format, quality);
  } catch (error) {
    throw new Error(`blurImage failed: ${error.message}`);
  }
}

/**
 * 13. Adjust Brightness
 * Adjusts image brightness from -100 to 100.
 * 
 * @param {File|Blob} file - Source image.
 * @param {number} [value=0] - Brightness adjustment (-100 to 100).
 * @returns {Promise<Blob>} Adjusted image blob.
 */
export async function adjustBrightness(file, value = 0) {
  try {
    const img = await loadImage(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');

    const format = file.type || 'image/png';
    if (format === 'image/jpeg' || format === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    const brightnessFactor = 1 + (value / 100);
    ctx.filter = `brightness(${brightnessFactor})`;
    ctx.drawImage(img, 0, 0);

    const quality = (format === 'image/jpeg' || format === 'image/jpg' || format === 'image/webp') ? 0.92 : undefined;
    return await canvasToBlob(canvas, format, quality);
  } catch (error) {
    throw new Error(`adjustBrightness failed: ${error.message}`);
  }
}

/**
 * 14. Adjust Contrast
 * Adjusts image contrast from -100 to 100.
 * 
 * @param {File|Blob} file - Source image.
 * @param {number} [value=0] - Contrast adjustment (-100 to 100).
 * @returns {Promise<Blob>} Adjusted image blob.
 */
export async function adjustContrast(file, value = 0) {
  try {
    const img = await loadImage(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');

    const format = file.type || 'image/png';
    if (format === 'image/jpeg' || format === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    const contrastFactor = 1 + (value / 100);
    ctx.filter = `contrast(${contrastFactor})`;
    ctx.drawImage(img, 0, 0);

    const quality = (format === 'image/jpeg' || format === 'image/jpg' || format === 'image/webp') ? 0.92 : undefined;
    return await canvasToBlob(canvas, format, quality);
  } catch (error) {
    throw new Error(`adjustContrast failed: ${error.message}`);
  }
}

/**
 * 15. Adjust Saturation
 * Adjusts image saturation from -100 to 100.
 * 
 * @param {File|Blob} file - Source image.
 * @param {number} [value=0] - Saturation adjustment (-100 to 100).
 * @returns {Promise<Blob>} Adjusted image blob.
 */
export async function adjustSaturation(file, value = 0) {
  try {
    const img = await loadImage(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');

    const format = file.type || 'image/png';
    if (format === 'image/jpeg' || format === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    const saturateFactor = 1 + (value / 100);
    ctx.filter = `saturate(${saturateFactor})`;
    ctx.drawImage(img, 0, 0);

    const quality = (format === 'image/jpeg' || format === 'image/jpg' || format === 'image/webp') ? 0.92 : undefined;
    return await canvasToBlob(canvas, format, quality);
  } catch (error) {
    throw new Error(`adjustSaturation failed: ${error.message}`);
  }
}

/**
 * 16. Apply Combined Image Filters
 * Applies multiple image adjustments/filters in one pass.
 * 
 * @param {File|Blob} file - Source image.
 * @param {Object} [filters={}] - Object containing filter options: { brightness, contrast, saturation, blur, grayscale }.
 * @returns {Promise<Blob>} Adjusted image blob.
 */
export async function applyImageFilters(file, filters = {}) {
  try {
    const img = await loadImage(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');

    const format = file.type || 'image/png';
    if (format === 'image/jpeg' || format === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    const filterParts = [];
    if (filters) {
      if (typeof filters.brightness === 'number' && filters.brightness !== 0) {
        filterParts.push(`brightness(${1 + filters.brightness / 100})`);
      }
      if (typeof filters.contrast === 'number' && filters.contrast !== 0) {
        filterParts.push(`contrast(${1 + filters.contrast / 100})`);
      }
      if (typeof filters.saturation === 'number' && filters.saturation !== 0) {
        filterParts.push(`saturate(${1 + filters.saturation / 100})`);
      }
      if (typeof filters.blur === 'number' && filters.blur > 0) {
        filterParts.push(`blur(${filters.blur}px)`);
      }
      if (filters.grayscale) {
        if (typeof filters.grayscale === 'number') {
          const val = filters.grayscale > 1 ? filters.grayscale / 100 : filters.grayscale;
          filterParts.push(`grayscale(${val})`);
        } else if (filters.grayscale === true) {
          filterParts.push('grayscale(1)');
        }
      }
    }

    if (filterParts.length > 0) {
      ctx.filter = filterParts.join(' ');
    }

    ctx.drawImage(img, 0, 0);

    const quality = (format === 'image/jpeg' || format === 'image/jpg' || format === 'image/webp') ? 0.92 : undefined;
    return await canvasToBlob(canvas, format, quality);
  } catch (error) {
    throw new Error(`applyImageFilters failed: ${error.message}`);
  }
}

/**
 * 17. Add Text Watermark
 * Draws text watermark on the image at specified position with given styling options.
 * Returns PNG format to preserve transparency if applicable.
 * 
 * @param {File|Blob} file - Source image.
 * @param {Object} [options={}] - Watermark options: { text, fontSize, opacity, color, rotation, position, font }.
 * @returns {Promise<Blob>} PNG Blob with watermark.
 */
export async function addTextWatermark(file, options = {}) {
  try {
    const {
      text = '',
      fontSize = 48,
      opacity = 0.5,
      color = '#ffffff',
      rotation = 0,
      position = 'center',
      font
    } = options;

    const img = await loadImage(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');

    ctx.drawImage(img, 0, 0);

    if (text) {
      ctx.save();
      ctx.font = font || `bold ${fontSize}px Arial`;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;

      const padding = Math.max(20, fontSize / 2);
      let x = width / 2;
      let y = height / 2;
      let align = 'center';
      let baseline = 'middle';

      switch (position) {
        case 'top-left':
          x = padding;
          y = padding;
          align = 'left';
          baseline = 'top';
          break;
        case 'top-center':
          x = width / 2;
          y = padding;
          align = 'center';
          baseline = 'top';
          break;
        case 'top-right':
          x = width - padding;
          y = padding;
          align = 'right';
          baseline = 'top';
          break;
        case 'center':
          x = width / 2;
          y = height / 2;
          align = 'center';
          baseline = 'middle';
          break;
        case 'bottom-left':
          x = padding;
          y = height - padding;
          align = 'left';
          baseline = 'bottom';
          break;
        case 'bottom-center':
          x = width / 2;
          y = height - padding;
          align = 'center';
          baseline = 'bottom';
          break;
        case 'bottom-right':
          x = width - padding;
          y = height - padding;
          align = 'right';
          baseline = 'bottom';
          break;
        default:
          x = width / 2;
          y = height / 2;
          align = 'center';
          baseline = 'middle';
          break;
      }

      ctx.translate(x, y);
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }
      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    return await canvasToBlob(canvas, 'image/png');
  } catch (error) {
    throw new Error(`addTextWatermark failed: ${error.message}`);
  }
}

/**
 * 18. Add Image Border
 * Adds border around image with optional corner radius for inner image.
 * 
 * @param {File|Blob} file - Source image.
 * @param {Object} [options={}] - Options: { width, color, radius }.
 * @returns {Promise<Blob>} Image blob with border.
 */
export async function addImageBorder(file, options = {}) {
  try {
    const { width = 10, color = '#000000', radius = 0 } = options;
    const borderW = Math.max(0, width);

    const img = await loadImage(file);
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;

    const canvas = document.createElement('canvas');
    canvas.width = imgW + borderW * 2;
    canvas.height = imgH + borderW * 2;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');

    // Draw border background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw inner image
    ctx.save();
    if (radius > 0) {
      const r = Math.min(radius, imgW / 2, imgH / 2);
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(borderW, borderW, imgW, imgH, r);
      } else {
        ctx.moveTo(borderW + r, borderW);
        ctx.arcTo(borderW + imgW, borderW, borderW + imgW, borderW + imgH, r);
        ctx.arcTo(borderW + imgW, borderW + imgH, borderW, borderW + imgH, r);
        ctx.arcTo(borderW, borderW + imgH, borderW, borderW, r);
        ctx.arcTo(borderW, borderW, borderW + imgW, borderW, r);
        ctx.closePath();
      }
      ctx.clip();
    }
    ctx.drawImage(img, borderW, borderW, imgW, imgH);
    ctx.restore();

    const format = file.type || 'image/png';
    const quality = (format === 'image/jpeg' || format === 'image/jpg' || format === 'image/webp') ? 0.92 : undefined;
    return await canvasToBlob(canvas, format, quality);
  } catch (error) {
    throw new Error(`addImageBorder failed: ${error.message}`);
  }
}

/**
 * 19. Add Rounded Corners
 * Clips image with rounded rectangle path and returns PNG blob.
 * 
 * @param {File|Blob} file - Source image.
 * @param {number} [radius=20] - Corner radius in pixels.
 * @returns {Promise<Blob>} PNG Blob with rounded corners.
 */
export async function addRoundedCorners(file, radius = 20) {
  try {
    const img = await loadImage(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain canvas 2D rendering context.');

    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(0, 0, width, height, r);
    } else {
      ctx.moveTo(r, 0);
      ctx.arcTo(width, 0, width, height, r);
      ctx.arcTo(width, height, 0, height, r);
      ctx.arcTo(0, height, 0, 0, r);
      ctx.arcTo(0, 0, width, 0, r);
      ctx.closePath();
    }
    ctx.clip();

    ctx.drawImage(img, 0, 0);

    return await canvasToBlob(canvas, 'image/png');
  } catch (error) {
    throw new Error(`addRoundedCorners failed: ${error.message}`);
  }
}

/**
 * 20. Get Image Metadata
 * Extracts image metadata (dimensions, aspect ratio, file info) and parses JPEG EXIF orientation.
 * 
 * @param {File|Blob} file - Source image.
 * @returns {Promise<{filename: string, fileType: string, fileSize: number, width: number, height: number, aspectRatio: number, lastModified: number|null, exifOrientation: number|null}>}
 */
export async function getImageMetadata(file) {
  try {
    if (!file || !(file instanceof Blob)) {
      throw new Error('Invalid image file provided.');
    }

    const img = await loadImage(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    let exifOrientation = null;
    if (file.type === 'image/jpeg' || file.type === 'image/jpg' || (file.name && /\.(jpe?g)$/i.test(file.name))) {
      try {
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to read array buffer'));
          reader.readAsArrayBuffer(file);
        });
        exifOrientation = parseExifOrientation(arrayBuffer);
      } catch (e) {
        exifOrientation = null;
      }
    }

    return {
      filename: file.name || '',
      fileType: file.type || '',
      fileSize: file.size || 0,
      width,
      height,
      aspectRatio: width / height,
      lastModified: file.lastModified || null,
      exifOrientation
    };
  } catch (error) {
    throw new Error(`getImageMetadata failed: ${error.message}`);
  }
}

/* ═══════════════════════════════════════════════════
 * 21-26. Region-based batch processors
 * These apply the "full image" effect for batch processing.
 * The interactive region selection is only available in the
 * single-file editor — batch mode always processes the entire image.
 * ═══════════════════════════════════════════════════ */

/**
 * 21. Pixelate Image (batch/full-image mode)
 */
export async function pixelateImageBatch(file, blockSize = 10) {
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const bs = Math.max(2, blockSize);
    for (let y = 0; y < canvas.height; y += bs) {
      for (let x = 0; x < canvas.width; x += bs) {
        const cx = Math.min(x + Math.floor(bs / 2), canvas.width - 1);
        const cy = Math.min(y + Math.floor(bs / 2), canvas.height - 1);
        const idx = (cy * canvas.width + cx) * 4;
        for (let dy = 0; dy < bs && y + dy < canvas.height; dy++) {
          for (let dx = 0; dx < bs && x + dx < canvas.width; dx++) {
            const i = ((y + dy) * canvas.width + (x + dx)) * 4;
            data[i] = data[idx]; data[i+1] = data[idx+1]; data[i+2] = data[idx+2];
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return await canvasToBlob(canvas, file.type || 'image/jpeg');
  } catch (error) {
    throw new Error(`pixelateImageBatch failed: ${error.message}`);
  }
}

/**
 * 22. Sharpen Image (batch/full-image mode)
 */
export async function sharpenImageBatch(file, amount = 50) {
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    const strength = amount / 100;
    for (let py = 1; py < canvas.height - 1; py++) {
      for (let px = 1; px < canvas.width - 1; px++) {
        for (let c = 0; c < 3; c++) {
          let val = 0, ki = 0;
          const kernel = [0, -strength, 0, -strength, 1 + 4 * strength, -strength, 0, -strength, 0];
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              val += data[((py + ky) * canvas.width + (px + kx)) * 4 + c] * kernel[ki++];
            }
          }
          output[(py * canvas.width + px) * 4 + c] = Math.max(0, Math.min(255, val));
        }
      }
    }
    imageData.data.set(output);
    ctx.putImageData(imageData, 0, 0);
    return await canvasToBlob(canvas, file.type || 'image/jpeg');
  } catch (error) {
    throw new Error(`sharpenImageBatch failed: ${error.message}`);
  }
}

/**
 * 23. Invert Image (batch/full-image mode)
 */
export async function invertImageBatch(file) {
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i+1] = 255 - data[i+1];
      data[i+2] = 255 - data[i+2];
    }
    ctx.putImageData(imageData, 0, 0);
    return await canvasToBlob(canvas, file.type || 'image/jpeg');
  } catch (error) {
    throw new Error(`invertImageBatch failed: ${error.message}`);
  }
}

/**
 * 24. Redact Image (batch/full-image mode) — fill entire image with solid color
 */
export async function redactImageBatch(file, color = '#000000') {
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return await canvasToBlob(canvas, file.type || 'image/jpeg');
  } catch (error) {
    throw new Error(`redactImageBatch failed: ${error.message}`);
  }
}
