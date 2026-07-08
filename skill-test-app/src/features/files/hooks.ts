import { useMutation } from "@tanstack/react-query";
import { files, putBinary, type FileRecord } from "./api";

export interface UploadResult extends FileRecord {
  fileId: string;
  url: string;
  name: string;
}

export function useUploadFile() {
  return useMutation<UploadResult, Error, File>({
    mutationFn: async (file: File) => {
      const { uploadUrl, fileId } = await files.presign(file.name);
      if (!uploadUrl || !fileId) {
        throw new Error("Presign failed: no uploadUrl or fileId returned");
      }
      const put = await putBinary(uploadUrl, file);
      if (!put.ok) {
        throw new Error(`Storage upload failed: ${put.status}`);
      }
      const record = await files.get(fileId);
      const url = record.url;
      if (!url) throw new Error("Upload complete but GetFile returned no url");
      return { ...record, fileId, url, name: record.name ?? file.name };
    },
  });
}