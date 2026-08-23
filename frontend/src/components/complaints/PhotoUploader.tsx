import React, { useRef, useState } from 'react';
import { Upload, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { compressImage } from '@/lib/compressImage';
import { useToast } from '@/hooks/use-toast';

export interface PreviewFile {
  file: File;
  url: string;
}

export function PhotoUploader({
  files,
  onChange,
  max = 10,
}: {
  files: PreviewFile[];
  onChange: (files: PreviewFile[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const addFiles = async (list: FileList | File[]) => {
    const incoming = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (files.length + incoming.length > max) {
      toast({ title: `You can upload up to ${max} photos`, variant: 'destructive' });
      return;
    }
    const next = [...files];
    for (const file of incoming) {
      const compressed = await compressImage(file);
      next.push({ file: compressed, url: URL.createObjectURL(compressed) });
    }
    onChange(next);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= files.length) return;
    const copy = [...files];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700'}`}
      >
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Drag and drop photos, or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">Up to {max} images • JPG, PNG, WEBP • compressed automatically</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Upload complaint photos"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {files.map((item, i) => (
            <div key={item.url} className="relative group rounded-lg overflow-hidden border aspect-square">
              <img src={item.url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs px-2 py-1 flex justify-between">
                <button type="button" aria-label="Move left" onClick={() => move(i, -1)}><ArrowLeft className="w-3 h-3" /></button>
                <span>{i + 1}</span>
                <button type="button" aria-label="Move right" onClick={() => move(i, 1)}><ArrowRight className="w-3 h-3" /></button>
              </div>
              <button
                type="button"
                aria-label="Remove photo"
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
