const TRANSLATE_ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

const CACHE_PREFIX = "translate.v1";

function getApiKey() {
  const key = import.meta.env.VITE_TRANSLATE_API_KEY;
  return typeof key === "string" ? key : "";
}

function djb2Hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function makeCacheKey({ source, target, text }) {
  const payload = `${source}→${target}→${text}`;
  const hash = djb2Hash(payload);
  return `${CACHE_PREFIX}.${source}.${target}.${hash}`;
}

function safeLocalStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
  }
}

function decodeHtmlEntities(htmlString) {
  if (typeof htmlString !== "string") return "";
  try {
    const doc = new DOMParser().parseFromString(htmlString, "text/html");
    return doc.documentElement.textContent || "";
  } catch {
    return htmlString;
  }
}

async function translateRequest({
  q,
  target,
  source,
  signal,
}) {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Missing Translate API key. Set VITE_TRANSLATE_API_KEY in frontend/.env");
  }

  const url = `${TRANSLATE_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q,
      target,
      ...(source ? { source } : {}),
      format: "text",
    }),
    signal,
  });

  if (!res.ok) {
    let errText = `Translate request failed: ${res.status}`;
    try {
      const errJson = await res.json();
      errText = JSON.stringify(errJson);
    } catch {
      try {
        const t = await res.text();
        if (t) errText = t;
      } catch {
      }
    }
    throw new Error(errText);
  }

  const data = await res.json();
  const translations = data?.data?.translations;

  if (!Array.isArray(translations)) {
    throw new Error("Unexpected Translate API response");
  }

  return translations.map((t) => decodeHtmlEntities(t?.translatedText ?? ""));
}

export async function translateText(text, targetLang, sourceLang = "en", options = {}) {
  const { signal, useCache = true } = options;

  if (typeof text !== "string" || text.length === 0) return "";
  if (!targetLang || targetLang === "en") return text;

  const cacheKey = makeCacheKey({ source: sourceLang, target: targetLang, text });

  if (useCache) {
    const cached = safeLocalStorageGet(cacheKey);
    if (typeof cached === "string" && cached.length > 0) return cached;
  }

  try {
    const [translated] = await translateRequest({
      q: text,
      target: targetLang,
      source: sourceLang,
      signal,
    });

    const finalText = typeof translated === "string" && translated.length > 0 ? translated : text;

    if (useCache) {
      safeLocalStorageSet(cacheKey, finalText);
    }

    return finalText;
  } catch {
    return text;
  }
}

export async function batchTranslate(texts, targetLang, sourceLang = "en", options = {}) {
  const { signal, useCache = true } = options;

  if (!Array.isArray(texts) || texts.length === 0) return [];
  if (!targetLang || targetLang === "en") return texts.slice();

  const normalized = texts.map((t) => (typeof t === "string" ? t : String(t ?? "")));

  const out = new Array(normalized.length);
  const toTranslate = [];
  const toTranslateIndexes = [];
  const toTranslateKeys = [];

  for (let i = 0; i < normalized.length; i += 1) {
    const text = normalized[i];

    if (!text) {
      out[i] = "";
      continue;
    }

    const cacheKey = makeCacheKey({ source: sourceLang, target: targetLang, text });

    if (useCache) {
      const cached = safeLocalStorageGet(cacheKey);
      if (typeof cached === "string" && cached.length > 0) {
        out[i] = cached;
        continue;
      }
    }

    toTranslate.push(text);
    toTranslateIndexes.push(i);
    toTranslateKeys.push(cacheKey);
  }

  if (toTranslate.length === 0) return out;

  try {
    const translated = await translateRequest({
      q: toTranslate,
      target: targetLang,
      source: sourceLang,
      signal,
    });

    for (let j = 0; j < toTranslate.length; j += 1) {
      const idx = toTranslateIndexes[j];
      const t = translated[j];
      const finalText = typeof t === "string" && t.length > 0 ? t : normalized[idx];
      out[idx] = finalText;

      if (useCache) {
        safeLocalStorageSet(toTranslateKeys[j], finalText);
      }
    }

    return out;
  } catch {
    for (let j = 0; j < toTranslate.length; j += 1) {
      const idx = toTranslateIndexes[j];
      out[idx] = normalized[idx];
    }
    return out;
  }
}
