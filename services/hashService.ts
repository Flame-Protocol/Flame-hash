
import * as jsSha3 from 'js-sha3';

/**
 * Calculates SHA3-256 hash in chunks to prevent blocking the main UI thread.
 * This allows the browser to remain responsive even for large files.
 */
export const calculateSHA3_256 = async (
  file: File, 
  onProgress?: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Access the hash function robustly from the module
    const m = jsSha3 as any;
    const sha3_256 = m.sha3_256 || m.default?.sha3_256 || (typeof m === 'function' ? m : null);
    
    if (!sha3_256 || typeof sha3_256.create !== 'function') {
      reject(new Error("SHA3-256 implementation not found in the loaded module."));
      return;
    }

    const hasher = sha3_256.create();
    const chunkSize = 1024 * 1024; // 1MB chunks
    let offset = 0;
    const reader = new FileReader();

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    reader.onload = async (event) => {
      if (event.target?.result) {
        hasher.update(event.target.result as ArrayBuffer);
        offset += chunkSize;
        
        const progress = Math.min(100, Math.round((offset / file.size) * 100));
        if (onProgress) onProgress(progress);

        if (offset < file.size) {
          // Yield to the main thread briefly to keep UI smooth
          setTimeout(readNextChunk, 0);
        } else {
          resolve(hasher.hex());
        }
      }
    };

    reader.onerror = () => reject(new Error("Error reading file."));
    
    // Start the process
    readNextChunk();
  });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
