"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Download,
  Trash2,
  FileIcon,
  CalendarIcon,
  HardDriveIcon,
} from "lucide-react";
import { api } from "@/lib/axios";
import { FileRow } from "@/lib/types";
import { ext, humanDate, bytes, isImageExt } from "@/lib/utils";

interface GridCardProps {
  f: FileRow;
  onDownload: (id: string, filename: string) => void;
  onDelete: (id: string) => void;
}

export function GridCard({ f, onDownload, onDelete }: GridCardProps) {
  const [thumb, setThumb] = useState<string>("");
  const e = ext(f.Filename);
  const img = isImageExt(e);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!img) return;
      try {
        const res = await api.get(`/files/download/${f.ID}`, {
          responseType: "blob",
        });
        const url = URL.createObjectURL(res.data);
        if (active) setThumb(url);
      } catch {}
    })();
    return () => {
      active = false;
      if (thumb) URL.revokeObjectURL(thumb);
    };
  }, [f.ID]);

  return (
    <div className="group rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Preview Section */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        {img && thumb ? (
          <Image
            width={300}
            height={225}
            src={thumb}
            alt={f.Filename}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <FileIcon className="h-12 w-12 mb-2" />
            <span className="text-sm font-medium">No preview</span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium">
          {e.toUpperCase()}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <h3
            className="font-semibold text-gray-900 truncate text-sm leading-tight"
            title={f.Filename}
          >
            {f.Filename}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <time className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {humanDate(f.CreatedAt)}
            </time>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <HardDriveIcon className="h-3 w-3" />
              {bytes(f.TotalSize)}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 h-8"
            onClick={() => onDownload(f.ID, f.Filename)}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            disabled
            onClick={() => onDelete(f.ID)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
