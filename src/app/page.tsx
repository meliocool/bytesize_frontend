"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { api, setApiKeyHeader } from "@/lib/axios";
import { FileMeta, FileRow, UploadResponse } from "@/lib/types";
import { bytes, ext, humanDate } from "@/lib/utils";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Download,
  UploadCloud,
  Table as TableIcon,
  Grid3X3,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { GridCard } from "@/components/grid-card";

type ViewMode = "table" | "grid";

export default function Page() {
  const [apiKey, setApiKey] = React.useState<string>(
    () =>
      (typeof window !== "undefined"
        ? localStorage.getItem("bs.apiKey")
        : "") ||
      process.env.NEXT_PUBLIC_API_KEY ||
      ""
  );
  const [files, setFiles] = useState<FileRow[]>([]);
  const [view, setView] = useState<ViewMode>("table");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<File | null>(null);

  useEffect(() => {
    setApiKeyHeader(apiKey);
  }, [apiKey]);

  async function refresh() {
    try {
      setBusy(true);
      setMsg("Loading files…");
      const res = await api.get<FileRow[]>("/files");
      setFiles(res.data || []);
      setMsg("Loaded.");
    } catch {
      setMsg("Failed to load files.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  async function doUpload() {
    if (!pick) return;
    try {
      setBusy(true);
      setMsg("Uploading…");
      const fd = new FormData();
      fd.append("file", pick);
      const up = await api.post<UploadResponse>("/files/upload", fd);
      const id = up.data?.data?.FileID;
      if (!id) throw new Error("No FileID");
      const meta = await api.get<FileMeta>("/files/metadata/" + id);
      setFiles((prev) => [meta.data, ...prev]);
      setMsg("Upload complete.");
    } catch {
      setMsg("Upload failed.");
    } finally {
      setBusy(false);
      setOpen(false);
      setPick(null);
    }
  }

  async function doDownload(id: string, fallbackName?: string) {
    try {
      setBusy(true);
      setMsg("Downloading…");
      const res = await api.get(`/files/download/${id}`, {
        responseType: "blob",
      });
      let filename = fallbackName || `file-${id}`;
      const cd = (res.headers["content-disposition"] as string) || "";
      const m = /filename\*?=(?:UTF-8'')?"?([^\";]+)/i.exec(cd);
      if (m && m[1]) filename = decodeURIComponent(m[1]);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg("Download complete.");
    } catch {
      setMsg("Download failed.");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(id: string) {
    try {
      setBusy(true);
      setMsg("Deleting…");
      await api.delete(`/files/del/${id}`);
      setFiles((prev) => prev.filter((f) => f.ID !== id));
      setMsg("Deleted.");
    } catch {
      setMsg("Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  const columns = useMemo<ColumnDef<FileRow>[]>(
    () => [
      {
        header: "Filename",
        accessorKey: "Filename",
        cell: ({ row }) => (
          <div className="truncate max-w-[320px]" title={row.original.Filename}>
            {row.original.Filename}
          </div>
        ),
      },
      {
        header: "Type",
        cell: ({ row }) => {
          const e = ext(row.original.Filename);
          return <Badge variant="outline">{e ? e.toUpperCase() : "—"}</Badge>;
        },
      },
      {
        header: "Size",
        accessorKey: "TotalSize",
        cell: ({ row }) => (
          <span className="tabular-nums">{bytes(row.original.TotalSize)}</span>
        ),
      },
      {
        header: "Created",
        accessorKey: "CreatedAt",
        cell: ({ row }) => humanDate(row.original.CreatedAt),
      },
      {
        header: "Updated",
        accessorKey: "UpdatedAt",
        cell: ({ row }) => humanDate(row.original.UpdatedAt),
      },
      {
        accessorKey: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    doDownload(row.original.ID, row.original.Filename)
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => doDelete(row.original.ID)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">ByteSize | Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Upload, view, and download your files.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "table" ? "default" : "outline"}
            onClick={() => setView("table")}
          >
            <TableIcon className="mr-1 h-4 w-4" /> Table
          </Button>
          <Button
            variant={view === "grid" ? "default" : "outline"}
            onClick={() => setView("grid")}
          >
            <Grid3X3 className="mr-1 h-4 w-4" /> Grid
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <UploadCloud className="mr-1 h-4 w-4" /> Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload a file</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-3">
                <Label htmlFor="file">Select file</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setPick(e.target.files?.[0] || null)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={!pick} onClick={doUpload}>
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">Backend</Label>
            <Input
              value={process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}
              readOnly
            />
          </div>
          <div>
            <Label className="mb-1 block">X-API-Key</Label>
            <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {busy ? "Working…" : msg || "Ready."}
        </div>
      </div>

      {view === "table" ? (
        <DataTable<FileRow, unknown>
          data={files}
          columns={columns}
          empty={
            <span className="text-gray-600">No files yet. Upload one.</span>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.length ? (
            files.map((f) => (
              <GridCard
                key={f.ID}
                f={f}
                onDownload={doDownload}
                onDelete={doDelete}
              />
            ))
          ) : (
            <div className="rounded-xl border bg-white p-6 text-center text-gray-600">
              No files yet. Upload one.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
