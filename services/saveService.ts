
import { GameState } from '../types';

const SAVE_KEY = 'infiniteIdleSave_v2';
const SECRET_KEY = 'COSMIC_ENTROPY_KEY'; // Simple key for XOR obfuscation

// Helper to obfuscate data so it's not just plain JSON
// Process: JSON -> URL Encode (handle unicode) -> XOR Cipher -> Base64
const obfuscate = (jsonStr: string): string => {
  try {
    const encodedUri = encodeURIComponent(jsonStr);
    const chars = encodedUri.split('');
    const xor = chars.map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
    ).join('');
    return btoa(xor);
  } catch (e) {
    console.error("Obfuscation failed", e);
    return "";
  }
};

// Process: Base64 -> XOR Cipher -> URL Decode -> JSON
const deobfuscate = (encodedStr: string): string => {
  try {
    const xor = atob(encodedStr);
    const chars = xor.split('');
    const originalUri = chars.map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
    ).join('');
    return decodeURIComponent(originalUri);
  } catch (e) {
    console.error("Deobfuscation failed", e);
    return "";
  }
};

export const saveToLocal = (state: GameState) => {
  try {
    // We can keep local storage as plain JSON for performance, 
    // or obfuscate it too. Using plain JSON for local storage reliability.
    const serialized = JSON.stringify(state);
    localStorage.setItem(SAVE_KEY, serialized);
    return true;
  } catch (e) {
    console.error("Failed to save to local storage", e);
    return false;
  }
};

export const loadFromLocal = (): GameState | null => {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load from local storage", e);
  }
  return null;
};

export const exportSaveString = (state: GameState): string => {
  try {
    const json = JSON.stringify(state);
    return obfuscate(json);
  } catch (e) {
    console.error("Failed to export save", e);
    return "";
  }
};

export const importSaveString = (encoded: string): GameState | null => {
  try {
    const json = deobfuscate(encoded);
    if (!json) throw new Error("Decryption failed");
    
    const state = JSON.parse(json);
    
    // Basic validation
    if (state.resources === undefined || !state.buildings) {
      throw new Error("Invalid save structure");
    }
    return state;
  } catch (e) {
    console.error("Failed to import save", e);
    throw new Error("Save code is invalid or corrupt.");
  }
};

export const downloadSaveFile = (state: GameState) => {
  const code = exportSaveString(state);
  // Saving as .txt because it's just a text code
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cosmic-save-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const readSaveFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                resolve(text.trim());
            } else {
                reject(new Error("Failed to read file"));
            }
        };
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsText(file);
    });
};

export const clearLocalSave = () => {
  localStorage.removeItem(SAVE_KEY);
};
