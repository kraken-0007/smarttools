/**
 * zipHelper.js — Pure JavaScript ZIP creator for the browser.
 * Uses DataView API & CRC32. No external dependencies.
 * Stores files without compression (STORE method, 0).
 */

// Pre-computed CRC32 lookup table
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
  }
  crcTable[n] = c >>> 0
}

function calculateCRC32(bytes) {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

function strToUint8(str) {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

/**
 * Creates a ZIP file Blob from an array of files.
 * @param {Array<{name: string, blob: Blob}>} files
 * @returns {Promise<Blob>} ZIP file blob (application/zip)
 */
export async function createZip(files) {
  const chunks = []
  const centralDir = []
  let offset = 0

  for (const { name, blob } of files) {
    const fileData = new Uint8Array(await blob.arrayBuffer())
    const nameBytes = strToUint8(name)
    const crc = calculateCRC32(fileData)
    const compressedSize = fileData.length
    const uncompressedSize = fileData.length

    // Local file header (30 bytes + filename)
    const localHeader = new DataView(new ArrayBuffer(30))
    localHeader.setUint32(0, 0x04034b50, true)  // signature
    localHeader.setUint16(4, 20, true)            // version needed
    localHeader.setUint16(6, 0, true)            // flags
    localHeader.setUint16(8, 0, true)            // compression (STORE)
    localHeader.setUint16(10, 0, true)           // mod time
    localHeader.setUint16(12, 0, true)           // mod date
    localHeader.setUint32(14, crc, true)         // crc32
    localHeader.setUint32(18, compressedSize, true)  // compressed size
    localHeader.setUint32(22, uncompressedSize, true) // uncompressed size
    localHeader.setUint16(26, nameBytes.length, true) // filename length
    localHeader.setUint16(28, 0, true)          // extra field length

    chunks.push(localHeader.buffer)
    chunks.push(nameBytes.buffer)
    chunks.push(fileData.buffer)

    // Central directory record
    const cdRecord = new DataView(new ArrayBuffer(46))
    cdRecord.setUint32(0, 0x02014b50, true)      // signature
    cdRecord.setUint16(4, 20, true)              // version made by
    cdRecord.setUint16(6, 20, true)              // version needed
    cdRecord.setUint16(8, 0, true)               // flags
    cdRecord.setUint16(10, 0, true)              // compression (STORE)
    cdRecord.setUint16(12, 0, true)              // mod time
    cdRecord.setUint16(14, 0, true)              // mod date
    cdRecord.setUint32(16, crc, true)            // crc32
    cdRecord.setUint32(20, compressedSize, true)  // compressed size
    cdRecord.setUint32(24, uncompressedSize, true) // uncompressed size
    cdRecord.setUint16(28, nameBytes.length, true) // filename length
    cdRecord.setUint16(30, 0, true)             // extra field length
    cdRecord.setUint16(32, 0, true)             // comment length
    cdRecord.setUint16(34, 0, true)             // disk number start
    cdRecord.setUint16(36, 0, true)             // internal attrs
    cdRecord.setUint32(38, 0, true)             // external attrs
    cdRecord.setUint32(42, offset, true)        // local header offset

    centralDir.push(cdRecord.buffer)
    centralDir.push(nameBytes.buffer)

    offset += 30 + nameBytes.length + fileData.length
  }

  // End of central directory record
  const cdSize = centralDir.reduce((sum, buf) => sum + buf.byteLength, 0)
  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054b50, true)           // signature
  eocd.setUint16(4, 0, true)                    // disk number
  eocd.setUint16(6, 0, true)                    // disk with CD
  eocd.setUint16(8, files.length, true)         // entries on disk
  eocd.setUint16(10, files.length, true)        // total entries
  eocd.setUint32(12, cdSize, true)             // CD size
  eocd.setUint32(16, offset, true)             // CD offset
  eocd.setUint16(20, 0, true)                   // comment length

  chunks.push(...centralDir)
  chunks.push(eocd.buffer)

  return new Blob(chunks, { type: 'application/zip' })
}
