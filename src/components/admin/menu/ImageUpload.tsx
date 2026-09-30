"use client";

import { useRef, useState } from "react";
import { uploadMedia } from "@/actions/media";
import type { Media } from "@/db/schema";
import { Btn, Input } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { cn } from "@/lib/cn";

/**
 * Image field: upload a new photo (stored in the media library, kept out of the
 * public gallery), pick one from the library, or paste a path/URL.
 */
export function ImageUpload({ value, onChange, library, altSuggestion }: { value: string; onChange: (v: string) => void; library: Pick<Media, "id" | "file" | "alt" | "tag">[]; altSuggestion?: string }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("inGallery", "0");
    if (altSuggestion) fd.append("alt", altSuggestion);
    const res = await uploadMedia(fd);
    setBusy(false);
    if (res.ok) {
      onChange(res.data.file);
      toast.success("Image uploaded", `${res.data.width}×${res.data.height}`);
    } else toast.error(res.error);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[12px] text-zinc-400">No image</div>}
        </div>
        <div className="flex-1 space-y-2">
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/images/… or https://…" aria-label="Image path" />
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Btn size="sm" type="button" onClick={() => fileRef.current?.click()} loading={busy}>Upload image</Btn>
            <Btn size="sm" type="button" variant="ghost" onClick={() => setShowLibrary((v) => !v)}>{showLibrary ? "Hide library" : "Choose from library"}</Btn>
            {value && <Btn size="sm" type="button" variant="ghost" className="text-red-600" onClick={() => onChange("")}>Remove</Btn>}
          </div>
          <p className="text-[12px] text-zinc-500">JPG, PNG or WebP up to 6 MB, at least 200 px on each side.</p>
        </div>
      </div>
      {showLibrary && (
        <div className="grid grid-cols-4 gap-2 rounded-lg border border-zinc-200 p-2 sm:grid-cols-6">
          {library.length === 0 && <p className="col-span-full p-3 text-[12px] text-zinc-500">The library is empty. Upload photos under Media.</p>}
          {library.map((m) => (
            <button key={m.id} type="button" onClick={() => { onChange(m.file); setShowLibrary(false); }} className={cn("aspect-square overflow-hidden rounded-md border-2", value === m.file ? "border-zinc-900" : "border-transparent hover:border-zinc-300")} aria-label={m.alt} title={m.alt}>
              <img src={m.file} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
