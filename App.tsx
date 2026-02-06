
import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  FileCode, 
  History, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { FileResult, HashStatus } from './types';
import { calculateSHA3_256, formatBytes } from './services/hashService';
import { analyzeFileMetadata } from './services/geminiService';

const App: React.FC = () => {
  const [results, setResults] = useState<FileResult[]>([]);
  const [status, setStatus] = useState<HashStatus>(HashStatus.IDLE);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setStatus(HashStatus.PROCESSING);
    setProgress(0);

    try {
      // 1. Calculate Hash with progress updates
      const hash = await calculateSHA3_256(file, (p) => setProgress(p));
      
      // 2. Perform AI analysis (Optional/Background)
      let aiAnalysis = "Analysis pending...";
      try {
        aiAnalysis = await analyzeFileMetadata(
          file.name, 
          formatBytes(file.size), 
          file.type || 'unknown', 
          hash
        );
      } catch (aiErr) {
        aiAnalysis = "Unable to generate AI security context for this file.";
      }

      const newResult: FileResult = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type || 'unknown',
        lastModified: file.lastModified,
        hash,
        timestamp: Date.now(),
        aiAnalysis
      };

      setResults(prev => [newResult, ...prev]);
      setStatus(HashStatus.COMPLETED);
    } catch (err: any) {
      console.error("Process error:", err);
      setErrorMsg(err.message || "Failed to process file.");
      setStatus(HashStatus.ERROR);
    } finally {
      setProgress(0);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (e.target) e.target.value = '';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearAll = () => {
    setResults([]);
    setStatus(HashStatus.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-5xl mx-auto">
      <header className="w-full text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Fingerprint className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            SecureFingerprint
          </h1>
        </div>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Generate cryptographic SHA3-256 fingerprints for your files instantly. 
          Everything stays on your machine.
        </p>
      </header>

      <div 
        className={`w-full relative transition-all duration-300 ${isDragging ? 'scale-[1.01]' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className={`
          border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
          }
          ${status === HashStatus.PROCESSING ? 'pointer-events-none' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" className="hidden" ref={fileInputRef} onChange={onFileChange} />
          
          <div className="flex flex-col items-center gap-4">
            <div className={`p-4 rounded-full bg-slate-700/50 transition-all ${
              status === HashStatus.PROCESSING ? 'bg-indigo-600 animate-pulse' : ''
            }`}>
              {status === HashStatus.PROCESSING ? (
                <Cpu className="w-10 h-10 text-white" />
              ) : (
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-400" />
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">
                {status === HashStatus.PROCESSING ? `Calculating... ${progress}%` : 'Drop your file here'}
              </h3>
              <p className="text-slate-400">
                {status === HashStatus.PROCESSING 
                  ? 'Processing file in chunks to keep your browser fast' 
                  : 'or click to choose a file'}
              </p>
            </div>

            {status === HashStatus.PROCESSING && (
              <div className="w-full max-w-xs mt-4">
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}
      </div>

      <main className="w-full mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            History
          </h2>
          {results.length > 0 && (
            <button onClick={clearAll} className="text-slate-400 hover:text-red-400 text-sm flex items-center gap-1 transition-colors">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {results.length === 0 && status !== HashStatus.PROCESSING ? (
          <div className="text-center py-16 border border-slate-800 rounded-3xl bg-slate-900/30">
            <ShieldCheck className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">Your fingerprints will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {results.map((res) => (
              <div key={res.id} className="bg-slate-800/40 border border-slate-700/50 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-4">
                      <div className="p-3 bg-slate-700/50 rounded-xl"><FileCode className="w-6 h-6 text-indigo-300" /></div>
                      <div>
                        <h4 className="font-semibold text-white break-all">{res.name}</h4>
                        <p className="text-sm text-slate-400">{formatBytes(res.size)} • {res.type || 'unknown'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="relative">
                      <div className="mono p-4 bg-black/40 rounded-xl text-indigo-300 break-all text-sm border border-slate-700/50">
                        {res.hash}
                      </div>
                      <button 
                        onClick={() => copyToClipboard(res.hash, res.id)}
                        className="absolute right-2 top-2 p-2 bg-slate-800 rounded-lg hover:bg-slate-700"
                      >
                        {copiedId === res.id ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {res.aiAnalysis && (
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                      <p className="text-sm text-slate-300">{res.aiAnalysis}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
