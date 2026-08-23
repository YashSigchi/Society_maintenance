import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

export function PhotoGallery({
  images,
}: {
  images: { id?: string; fileUrl: string; thumbnailUrl?: string | null; fileName?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (!images?.length) {
    return <p className="text-sm text-muted-foreground">No photos attached.</p>;
  }

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <button
            key={img.id || i}
            type="button"
            onClick={() => openAt(i)}
            className="relative group rounded-lg overflow-hidden border bg-gray-100 aspect-[4/3]"
            aria-label={`Open photo ${i + 1}`}
          >
            <img
              src={img.thumbnailUrl || img.fileUrl}
              alt={img.fileName || `Photo ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
            </span>
          </button>
        ))}
      </div>
      {open && (
        <Lightbox images={images} index={index} onIndex={setIndex} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

export function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: { fileUrl: string; fileName?: string }[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, images.length, onClose, onIndex]);

  const [touchX, setTouchX] = useState<number | null>(null);

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
    >
      <button type="button" className="absolute top-4 right-4 text-white" onClick={onClose} aria-label="Close">
        <X className="w-7 h-7" />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-3 text-white"
            aria-label="Previous photo"
            onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + images.length) % images.length); }}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            type="button"
            className="absolute right-3 text-white"
            aria-label="Next photo"
            onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % images.length); }}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </>
      )}
      <img
        src={images[index].fileUrl}
        alt={images[index].fileName || 'Complaint photo'}
        className="max-h-[88vh] max-w-[92vw] object-contain rounded-md transition-opacity"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => setTouchX(e.changedTouches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX == null) return;
          const dx = e.changedTouches[0].clientX - touchX;
          if (dx > 40) onIndex((index - 1 + images.length) % images.length);
          if (dx < -40) onIndex((index + 1) % images.length);
          setTouchX(null);
        }}
      />
    </div>
  );
}
