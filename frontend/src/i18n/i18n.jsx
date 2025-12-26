import * as React from "react";

import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { batchTranslate } from "@/services/translate";

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" },
  { code: "bn", label: "Bengali" },
  { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "pa", label: "Punjabi" },
];

const LanguageContext = React.createContext(null);

function normalizeText(value) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useLocalStorageState("app.language", "en");
  const [translationsByLang, setTranslationsByLang] = React.useState({});
  const [isTranslating, setIsTranslating] = React.useState(false);

  const translationsRef = React.useRef(translationsByLang);
  React.useEffect(() => {
    translationsRef.current = translationsByLang;
  }, [translationsByLang]);

  const pendingRef = React.useRef(new Map());
  const flushTimerRef = React.useRef(null);
  const abortRef = React.useRef(null);

  const clearTimer = React.useCallback(() => {
    if (flushTimerRef.current) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  const abortInFlight = React.useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    clearTimer();
    abortInFlight();
    setIsTranslating(false);
  }, [language, clearTimer, abortInFlight]);

  const flush = React.useCallback(async (langToFlush) => {
    if (!langToFlush || langToFlush === "en") return;

    const setForLang = pendingRef.current.get(langToFlush);
    if (!setForLang || setForLang.size === 0) return;

    pendingRef.current.set(langToFlush, new Set());

    const texts = Array.from(setForLang);

    setIsTranslating(true);
    abortInFlight();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const translated = await batchTranslate(texts, langToFlush, "en", {
        signal: controller.signal,
        useCache: true,
      });

      setTranslationsByLang((prev) => {
        const langMap = prev[langToFlush] ? { ...prev[langToFlush] } : {};
        for (let i = 0; i < texts.length; i += 1) {
          langMap[texts[i]] = translated[i] ?? texts[i];
        }
        return { ...prev, [langToFlush]: langMap };
      });
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsTranslating(false);
    }
  }, [abortInFlight]);

  const scheduleFlush = React.useCallback((langToFlush) => {
    if (!langToFlush || langToFlush === "en") return;

    if (flushTimerRef.current) return;

    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      flush(langToFlush);
    }, 50);
  }, [flush]);

  const registerText = React.useCallback((text) => {
    const normalized = normalizeText(text);
    if (!normalized) return;
    if (!language || language === "en") return;

    const existing = translationsRef.current?.[language]?.[normalized];
    if (typeof existing === "string" && existing.length > 0) return;

    let setForLang = pendingRef.current.get(language);
    if (!setForLang) {
      setForLang = new Set();
      pendingRef.current.set(language, setForLang);
    }

    if (setForLang.has(normalized)) return;

    setForLang.add(normalized);
    scheduleFlush(language);
  }, [language, scheduleFlush]);

  const t = React.useCallback((text) => {
    const normalized = normalizeText(text);

    if (!normalized) return "";
    if (!language || language === "en") return normalized;

    const fromState = translationsRef.current?.[language]?.[normalized];
    if (typeof fromState === "string" && fromState.length > 0) return fromState;

    registerText(normalized);
    return normalized;
  }, [language, registerText]);

  const value = React.useMemo(() => {
    return {
      language,
      setLanguage,
      isTranslating,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
    };
  }, [language, setLanguage, isTranslating, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useI18n must be used within LanguageProvider");
  }
  return ctx;
}

export function Trans({ children }) {
  const { t } = useI18n();
  return t(children);
}

export function translateNode(node, translate) {
  if (typeof node === "string") {
    if (node.trim().length === 0) return node;
    return translate(node);
  }

  if (Array.isArray(node)) {
    return node.map((n, idx) => {
      const translated = translateNode(n, translate);
      if (React.isValidElement(translated)) {
        return React.cloneElement(translated, { key: translated.key ?? idx });
      }
      return translated;
    });
  }

  if (React.isValidElement(node)) {
    const nextChildren = translateNode(node.props.children, translate);
    return React.cloneElement(node, node.props, nextChildren);
  }

  return node;
}

export { SUPPORTED_LANGUAGES };
