
import React, { useState, useEffect, useRef } from 'react';
import { Save, Download, Upload, Copy, Check, AlertTriangle, Trash2, X, FileText } from 'lucide-react';
import { GameState } from '../types';
import { exportSaveString, importSaveString, downloadSaveFile, saveToLocal, readSaveFile } from '../services/saveService';

interface SettingsModalProps {
  state: GameState;
  onClose: () => void;
  onImport: (newState: GameState) => void;
  onReset: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ state, onClose, onImport, onReset }) => {
  const [exportCode, setExportCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [manualSaveSuccess, setManualSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Generate export code on mount
    const code = exportSaveString(state);
    setExportCode(code);
  }, [state]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleDownload = () => {
    downloadSaveFile(state);
  };

  const handleImportPaste = () => {
    if (!importCode) return;
    try {
      const newState = importSaveString(importCode);
      if (newState) {
        onImport(newState);
        onClose();
      }
    } catch (e) {
      setImportError("Invalid Save Code");
      setTimeout(() => setImportError(null), 3000);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const content = await readSaveFile(file);
          const newState = importSaveString(content);
          if (newState) {
              onImport(newState);
              onClose();
          }
      } catch (err) {
          setImportError("File Corrupted");
          setTimeout(() => setImportError(null), 3000);
      }
  };

  const handleManualSave = () => {
    saveToLocal(state);
    setManualSaveSuccess(true);
    setTimeout(() => setManualSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Save className="w-5 h-5 text-cyan-400" />
            System / Data Management
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Section: Manual Save */}
          <section className="space-y-2">
             <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Local Save</h3>
                <span className="text-xs text-slate-500">Last Auto-Save: {new Date(state.lastSaveTime).toLocaleTimeString()}</span>
             </div>
             <button 
                onClick={handleManualSave}
                className={`w-full py-3 rounded border font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    manualSaveSuccess 
                    ? 'bg-green-900/30 border-green-500 text-green-400' 
                    : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
             >
                {manualSaveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {manualSaveSuccess ? 'Game Saved Successfully' : 'Force Manual Save'}
             </button>
          </section>

          <hr className="border-slate-800" />

          {/* Section: Export */}
          <section className="space-y-3">
             <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Export Data</h3>
             <div className="flex gap-2">
                <div className="relative flex-1">
                    <textarea 
                        readOnly
                        value={exportCode}
                        className="w-full h-24 bg-black/50 border border-slate-700 rounded p-2 text-[10px] font-mono text-slate-400 resize-none focus:outline-none focus:border-cyan-500"
                    />
                </div>
                <div className="flex flex-col gap-2 w-32">
                    <button 
                        onClick={handleCopy}
                        className="flex-1 bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-400 rounded flex items-center justify-center gap-2 text-xs font-bold uppercase transition-colors"
                    >
                        {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copySuccess ? 'Copied' : 'Copy'}
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded flex items-center justify-center gap-2 text-xs font-bold uppercase transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                </div>
             </div>
          </section>

          <hr className="border-slate-800" />

          {/* Section: Import */}
          <section className="space-y-3">
             <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Import Data</h3>
             
             <div className="flex flex-col gap-3">
                 <textarea 
                    placeholder="Paste save code here..."
                    value={importCode}
                    onChange={(e) => setImportCode(e.target.value)}
                    className="w-full h-20 bg-black/50 border border-slate-700 rounded p-2 text-xs font-mono text-white resize-none focus:outline-none focus:border-purple-500 placeholder:text-slate-700"
                 />
                 
                 <div className="flex gap-4">
                     <button 
                        onClick={handleImportPaste}
                        disabled={!importCode}
                        className={`flex-1 py-3 rounded border font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
                            ${importCode 
                                ? 'bg-purple-900/30 border-purple-500 text-purple-400 hover:bg-purple-900/50' 
                                : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'}
                        `}
                     >
                        <Upload className="w-4 h-4" />
                        Load from Text
                     </button>
                     
                     <div className="flex-1">
                         <input 
                             type="file" 
                             ref={fileInputRef}
                             onChange={handleImportFile}
                             className="hidden"
                             accept=".txt"
                         />
                         <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-full py-3 rounded border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                         >
                            <FileText className="w-4 h-4" />
                            Load from File
                         </button>
                     </div>
                 </div>

                 {importError && (
                     <div className="p-2 bg-red-900/20 border border-red-500/30 text-red-400 text-xs text-center font-bold rounded animate-pulse">
                         {importError}
                     </div>
                 )}
             </div>
          </section>

          <hr className="border-slate-800" />

          {/* Section: Hard Reset */}
          <section className="bg-red-950/20 border border-red-900/30 p-4 rounded-lg">
             {!showResetConfirm ? (
                 <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest">Danger Zone</h3>
                        <p className="text-xs text-red-400/60">Permanently delete all save data and restart.</p>
                    </div>
                    <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-400 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Hard Reset
                    </button>
                 </div>
             ) : (
                 <div className="text-center space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                     <div className="flex items-center justify-center gap-2 text-red-500 font-bold">
                         <AlertTriangle className="w-5 h-5" />
                         <span>ARE YOU ABSOLUTELY SURE?</span>
                         <AlertTriangle className="w-5 h-5" />
                     </div>
                     <p className="text-xs text-red-300">This action cannot be undone. The universe will be deleted.</p>
                     <div className="flex gap-3 justify-center">
                         <button 
                            onClick={() => setShowResetConfirm(false)}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold uppercase"
                         >
                            Cancel
                         </button>
                         <button 
                            onClick={() => {
                                onClose(); // Close modal first
                                onReset(); // Trigger destructive animation in App
                            }}
                            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] rounded text-xs font-bold uppercase animate-pulse"
                         >
                            CONFIRM DELETION
                         </button>
                     </div>
                 </div>
             )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
