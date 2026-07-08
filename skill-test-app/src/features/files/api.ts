const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/data/v4`;
const PROJECT_KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

export interface PresignResponse {
  uploadUrl?: string;
  fileId?: string;
}

export interface FileRecord {
  fileId?: string;
  name?: string;
  url?: string;
  sizeInBytes?: number;
  accessModifier?: number;
  contentType?: string;
  currentVersion?: number;
}

async function filesApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "x-blocks-key": PROJECT_KEY,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err: Error & { status?: number; errors?: unknown } = new Error(
      `Files ${init.method ?? "GET"} ${path} → ${res.status}${body ? ` ${body}` : ""}`
    );
    err.status = res.status;
    try {
      err.errors = JSON.parse(body);
    } catch {
      /* not json */
    }
    throw err;
  }
  return res.json() as Promise<T>;
}

export const files = {
  presign: (
    name: string,
    accessModifier: "Public" | "Private" = "Public",
    configurationName = "Default"
  ): Promise<PresignResponse> =>
    filesApi<PresignResponse>(`/Files/GetPreSignedUrlForUpload`, {
      method: "POST",
      body: JSON.stringify({
        name,
        projectKey: PROJECT_KEY,
        accessModifier,
        configurationName,
        moduleName: 3,
        ParentDirectoryId: "",
        tags: "",
        metaData: "{}",
      }),
    }),

  get: (fileId: string, configurationName = "Default"): Promise<FileRecord> =>
    filesApi<FileRecord>(
      `/Files/GetFile?FileId=${encodeURIComponent(fileId)}&ConfigurationName=${configurationName}`
    ),

  getMany: (fileIds: string[], configurationName = "Default"): Promise<FileRecord[]> =>
    filesApi<FileRecord[]>(`/Files/GetFiles`, {
      method: "POST",
      body: JSON.stringify({ fileIds, configurationName }),
    }),

  del: (fileId: string): Promise<{ isSuccess?: boolean }> =>
    filesApi<{ isSuccess?: boolean }>(`/Files/DeleteFile`, {
      method: "POST",
      body: JSON.stringify({ fileId, projectKey: PROJECT_KEY }),
    }),
};

export function isAzureUpload(uploadUrl: string): boolean {
  return /\.blob\.core\.windows\.net/i.test(uploadUrl);
}

export function providerHeaders(
  uploadUrl: string,
  contentType: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": contentType || "application/octet-stream",
  };
  if (isAzureUpload(uploadUrl)) {
    headers["x-ms-blob-type"] = "BlockBlob";
  }
  return headers;
}

export async function putBinary(
  uploadUrl: string,
  file: File
): Promise<Response> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: providerHeaders(uploadUrl, file.type),
    body: file,
  });
  return res;
}