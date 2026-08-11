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
