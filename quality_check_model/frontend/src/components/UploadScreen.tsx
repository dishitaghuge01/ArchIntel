import { useState, useCallback, useRef } from 'react';
import { Upload, FileUp, FileImage } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAnalyzeSvg } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

export function UploadScreen() {
  const { settings } = useAppStore();
  const { mutate: analyzeSvg, isPending: isAnalyzing } = useAnalyzeSvg();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.svg')) return;
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPreview(content);
      };
      reader.readAsText(file);
    },
    []
  );

  const handleAnalyze = useCallback(() => {
    if (!selectedFile) return;
    const name = selectedFile.name.replace('.svg', '');
    analyzeSvg({ name, file: selectedFile });
  }, [selectedFile, analyzeSvg]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setPreview('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8">
      <h2 className="text-2xl font-semibold text-foreground mb-8">
        Working on a new floorplan?
      </h2>

      {/* File preview */}
      {selectedFile && preview && (
        <div className="w-full max-w-2xl mb-6 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center p-2">
              <div
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full text-foreground"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{selectedFile.name}</h3>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB • SVG file
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
                      Analyzing...
                    </div>
                  ) : (
                    'Analyze Floor Plan'
                  )}
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={cn(
          'w-full max-w-2xl h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer',
          dragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-muted-foreground/50 hover:bg-accent/50'
        )}
        onClick={() => inputRef.current?.click()}
      >
        <div
          className={cn(
            'p-3 rounded-full transition-colors',
            dragActive ? 'bg-primary/10' : 'bg-muted'
          )}
        >
          {dragActive ? (
            <FileUp className="h-6 w-6 text-primary" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {dragActive ? 'Drop your SVG here' : 'Drag & Drop Upload SVG'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse
          </p>
          {settings.demoMode && (
            <p className="text-xs text-primary mt-2">
              Demo Mode: Use sample data or upload real files
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
