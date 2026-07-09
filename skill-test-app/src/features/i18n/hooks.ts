import { useI18n } from "./provider";

export function useT() {
  return useI18n().t;
}

export function useTn() {
  return useI18n().tn;
}