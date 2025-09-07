export type FileRow = {
  ID: string;
  Filename: string;
  TotalSize: number;
  CreatedAt: string;
  UpdatedAt: string;
};

export type UploadResponse = {
  code?: number;
  status?: string;
  data?: {
    FileID: string;
    TotalSize: number;
    ChunksCount: number;
    UniqueChunksWritten: number;
    DedupeSavedBytes: number;
  };
};

export type FileMeta = {
  ID: string;
  Filename: string;
  TotalSize: number;
  ChunksCount: number;
  CreatedAt: string;
  UpdatedAt: string;
};
