import { useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Star, X } from "lucide-react";

const MAX = 6;

async function resize(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await img.decode();
  const s = Math.min(1, 900 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s);
  c.height = Math.round(img.height * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.72);
}

/** Selector de fotos: agrega, elimina, reordena y elige portada (la primera). */
export function SellPhotos({ images, onChange }: { images: string[]; onChange: (v: string[]) => void }) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const add = async (list: FileList | null) => {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/")).slice(0, MAX - images.length);
    if (!files.length) return;
    setBusy(true);
    try {
      const out = await Promise.all(files.map(resize));
      onChange([...images, ...out].slice(0, MAX));
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    const n = [...images];
    const a = n[i]!; n[i] = n[j]!; n[j] = a;
    onChange(n);
  };

  const cover = (i: number) => onChange([images[i]!, ...images.filter((_, k) => k !== i)]);

  return (
    <div>
      {images.length < MAX && (
        <label
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); void add(e.dataTransfer.files); }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${over ? "border-primary bg-accent" : "border-border bg-background hover:border-primary"}`}
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary"><Camera className="h-5 w-5" /></span>
          <span className="text-sm font-medium text-foreground">{busy ? "Procesando…" : images.length ? "Agregar más fotos" : "Elegir fotos"}</span>
          <span className="text-xs text-muted-foreground"><span className="md:hidden">Desde tu galería o cámara</span><span className="hidden md:inline">o arrástralas aquí</span> · {images.length}/{MAX}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
        </label>
      )}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {images.map((src, i) => (
            <div key={src.slice(-40) + i} className={`group relative aspect-square overflow-hidden rounded-xl ring-1 ${i === 0 ? "ring-2 ring-primary" : "ring-border"}`}>
              <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-gold-foreground">Portada</span>}
              <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))} className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-1" aria-label="Eliminar foto"><X className="h-3.5 w-3.5" /></button>
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-full bg-background/90 p-1 disabled:opacity-0" aria-label="Mover antes"><ArrowLeft className="h-3.5 w-3.5" /></button>
                {i !== 0 && <button type="button" onClick={() => cover(i)} className="rounded-full bg-background/90 p-1" aria-label="Usar como portada"><Star className="h-3.5 w-3.5" /></button>}
                <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} className="rounded-full bg-background/90 p-1 disabled:opacity-0" aria-label="Mover después"><ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
