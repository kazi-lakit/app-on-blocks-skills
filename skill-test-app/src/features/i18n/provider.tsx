import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  format,
  I18N_DEFAULT_LANGUAGE,
  I18N_MODULES,
  i18nApi,
  type Dictionary,
  type Language,
} from "./api";

interface I18n {
  languages: Language[];
  language: string;
  setLanguage: (code: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tn: (key: string, count: number, params?: Record<string, string | number>) => string;
  ready: boolean;
}

const Ctx = createContext<I18n | null>(null);

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used within <I18nProvider>");
  return v;
}

const STORAGE_KEY = "stagepass:language";

function pickInitialLanguage(languages: Language[]): string {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && languages.some((l) => l.languageCode === saved)) return saved;
  }
  const def = languages.find((l) => l.isDefault)?.languageCode;
  return def ?? I18N_DEFAULT_LANGUAGE ?? languages[0]?.languageCode ?? "en-US";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { data: languages = [] } = useQuery({
    queryKey: ["i18n", "languages"],
    queryFn: i18nApi.languages,
    staleTime: 60 * 60_000,
  });

  const [language, setLanguageState] = useState<string>(
    () => I18N_DEFAULT_LANGUAGE
  );

  useEffect(() => {
    if (!languages.length) return;
    setLanguageState((cur) => {
      if (cur && languages.some((l) => l.languageCode === cur)) return cur;
      return pickInitialLanguage(languages);
    });
  }, [languages]);

  const setLanguage = useCallback((code: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, code);
    }
    setLanguageState(code);
  }, []);

  const results = useQueries({
    queries: I18N_MODULES.map((m) => ({
      queryKey: ["i18n", "uilm", language, m] as const,
      queryFn: () => i18nApi.uilmFile(language, m),
      enabled: !!language,
      staleTime: 5 * 60_000,
    })),
  });

  const dict: Dictionary = useMemo(() => {
    const out: Dictionary = {};
    for (const r of results) {
      const d = r.data;
      if (d && typeof d === "object") Object.assign(out, d);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.map((r) => r.dataUpdatedAt).join("|")]);

  const ready = !!language && results.every((r) => r.isSuccess);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const raw = dict[key];
      if (raw == null) return key;
      return format(raw, params);
    },
    [dict]
  );

  const tn = useCallback(
    (key: string, count: number, params?: Record<string, string | number>) => {
      const suffix = count === 1 ? "_SINGULAR" : "_PLURAL";
      const raw = dict[key + suffix] ?? dict[key];
      if (raw == null) return key + suffix;
      return format(raw, { ...(params ?? {}), count });
    },
    [dict]
  );

  const value = useMemo<I18n>(
    () => ({
      languages,
      language,
      setLanguage,
      t,
      tn,
      ready,
    }),
    [languages, language, setLanguage, t, tn, ready]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}