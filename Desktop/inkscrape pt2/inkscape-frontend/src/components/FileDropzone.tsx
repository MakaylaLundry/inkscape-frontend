import { useState, useCallback } from 'react';
import { Upload, FileImage, X, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
}

export function FileDropzone({
  onFilesSelected,
  accept = 'image/*',
  multiple = false,
  maxFiles = 10,
  className,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const files = Array.from(e.dataTransfer.files).slice(0, maxFiles);
      setSelectedFiles(files);
      onFilesSelected(files);
    },
    [maxFiles, onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).slice(0, maxFiles);
      setSelectedFiles(files);
      onFilesSelected(files);
    },
    [maxFiles, onFilesSelected]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [selectedFiles, onFilesSelected]
  );

  const clearAll = useCallback(() => {
    setSelectedFiles([]);
    onFilesSelected([]);
  }, [onFilesSelected]);

  const isZipAccepted = accept.includes('.zip') || accept.includes('application/zip');

  return (
    <div className={cn('space-y-4', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'w-full min-h-[200px] p-8',
          'border-2 border-dashed rounded-sm',
          'transition-all duration-200 cursor-pointer',
          'hover:border-primary/50 hover:bg-accent/50',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border bg-card',
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload files"
        />
        
        <div className={cn(
          'flex flex-col items-center gap-4 text-center',
          'transition-transform duration-200',
          isDragging && 'scale-95'
        )}>
          <div className={cn(
            'p-4 rounded-sm',
            isDragging ? 'bg-primary/10' : 'bg-accent'
          )}>
            {isZipAccepted ? (
              <Archive className={cn(
                'w-8 h-8 transition-colors',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )} />
            ) : (
              <Upload className={cn(
                'w-8 h-8 transition-colors',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )} />
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse • {multiple ? `up to ${maxFiles} files` : 'single file'}
            </p>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
          
          <div className="grid gap-2 max-h-[200px] overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-accent/50 rounded-sm group"
              >
                <div className="p-2 bg-background rounded-sm">
                  <FileImage className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
