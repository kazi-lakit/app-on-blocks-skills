const API = (import.meta.env.VITE_BLOCKS_API_URL as string).replace(
  /\/$/,
  ""
);
const KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;
const MODULES = ((import.meta.env.VITE_BLOCKS_I18N_MODULES as string) || "common")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const DEFAULT_LANGUAGE =
  (import.meta.env.VITE_BLOCKS_DEFAULT_LANGUAGE as string) || "en-US";

export interface Language {
  languageName: string;
  languageCode: string;
  isDefault: boolean;
}

export type Dictionary = Record<string, string>;

async function loc<T>(path: string): Promise<T> {
  const res = await fetch(`${API}/localization/v4${path}`, {
    headers: { "x-blocks-key": KEY },
  });
  if (!res.ok) {
    throw new Error(`localization ${path} -> ${res.status}`);
  }
  return (await res.json()) as T;
}

export const i18nApi = {
  languages: () =>
    loc<Language[]>(`/Language/Gets?ProjectKey=${KEY}`),
  modules: () =>
    loc<Array<{ moduleName: string }>>(`/Module/Gets?ProjectKey=${KEY}`),
  uilmFile: (language: string, moduleName: string) =>
    loc<Dictionary>(
      `/Key/GetUilmFile?Language=${encodeURIComponent(
        language
      )}&ModuleName=${encodeURIComponent(moduleName)}&ProjectKey=${KEY}`
    ),
};

export const I18N_MODULES = MODULES;
export const I18N_DEFAULT_LANGUAGE = DEFAULT_LANGUAGE;

export function format(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : `{${k}}`
  );
}