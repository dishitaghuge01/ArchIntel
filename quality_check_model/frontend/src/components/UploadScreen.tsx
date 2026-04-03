import { useState, useCallback, useRef } from 'react';
import { Upload, FileUp } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function UploadScreen() {
  const { analyzeSvg } = useAppStore();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.svg')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const name = file.name.replace('.svg', '');
        analyzeSvg(name, content);
      };
      reader.readAsText(file);
    },
    [analyzeSvg]
  );

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
