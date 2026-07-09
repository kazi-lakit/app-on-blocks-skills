import { useState, useRef } from "react";
import { useUploadFile } from "./hooks";
import { useT } from "../i18n";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUploadField({ value, onChange }: Props) {
  const t = useT();
  const upload = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError(t("UPLOAD_ERR_TYPE"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("UPLOAD_ERR_SIZE"));
      return;
    }
    try {
      const result = await upload.mutateAsync(file);
      onChange(result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="field">
      <label className="field__label">{t("UPLOAD_LABEL")}</label>
      <div
        className={`image-upload ${dragOver ? "image-upload--drag" : ""} ${upload.isPending ? "image-upload--busy" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {value ? (
          <img
            src={value}
            alt={t("UPLOAD_PREVIEW_ALT")}
            className="image-upload__preview"
            onError={() => {
              /* ignore broken preview */
            }}
          />
        ) : (
          <div className="image-upload__placeholder">
            <span aria-hidden="true">🖼</span>
            <p>{t("UPLOAD_DROP_HERE")}</p>
            <small>{t("UPLOAD_FORMATS")}</small>
          </div>
        )}
        {upload.isPending ? (
          <div className="image-upload__overlay">
            <div className="spinner spinner--inline" aria-hidden="true" />
            <span>{t("UPLOAD_UPLOADING")}</span>
          </div>
        ) : null}
        <div className="image-upload__actions">
          <button
            type="button"
            className="nav__cta"
            onClick={() => fileInputRef.current?.click()}
            disabled={upload.isPending}
          >
            {value ? t("BTN_REPLACE_IMAGE") : t("BTN_UPLOAD_IMAGE")}
          </button>
          {value ? (
            <button
              type="button"
              className="image-upload__remove"
              onClick={() => onChange("")}
              disabled={upload.isPending}
            >
              {t("BTN_REMOVE")}
            </button>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            hidden
            onChange={onPickFile}
          />
        </div>
      </div>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <p className="field__hint">
        {t("UPLOAD_PASTE_URL")}{" "}
        <input
          className="image-upload__url"
          type="url"
          placeholder="https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </p>
    </div>
  );
}