export type FeedDefinition = {
  id: string;
  title: string;
  url: string;
  tags?: string[];
};

export type FeedItem = {
  id: string;
  feedId: string;
  feedTitle: string;
  title: string;
  link?: string;
  publishedAt?: string;
  summary?: string;
};

export type FetchFeedOptions = {
  proxy?: "none";
  timeoutMs?: number;
};

function textContent(parent: Element | null, selector: string) {
  if (!parent) return undefined;
  const el = parent.querySelector(selector);
  const t = el?.textContent?.trim();
  return t || undefined;
}

function normalizeId({ link, title, publishedAt }: { link?: string; title: string; publishedAt?: string }) {
  const base = (link || "").trim() || `${title}|${publishedAt || ""}`;
  return base.trim() || `${title}-${Math.random().toString(16).slice(2)}`;
}

function normalizeDate(raw?: string) {
  if (!raw) return undefined;
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return raw;
  return d.toISOString().slice(0, 10);
}

async function fetchText(url: string, opts: FetchFeedOptions) {
  const proxy = opts.proxy ?? "none";
  const timeoutMs = opts.timeoutMs ?? 12000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const fetchUrl = proxy === "none" ? url : url;

  try {
    const res = await fetch(fetchUrl, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAndParseFeed(feed: FeedDefinition, opts: FetchFeedOptions = {}): Promise<FeedItem[]> {
  const xmlText = await fetchText(feed.url, opts);
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("Invalid feed XML");
  }

  const channel = doc.querySelector("rss channel");
  const feedTitle = textContent(channel, "title") || textContent(doc.querySelector("feed"), "title") || feed.title;

  const rssItems = Array.from(doc.querySelectorAll("rss channel item"));
  if (rssItems.length > 0) {
    return rssItems.map((item) => {
      const title = textContent(item, "title") || "(untitled)";
      const link = textContent(item, "link");
      const publishedAt = normalizeDate(textContent(item, "pubDate") || textContent(item, "dc\\:date"));
      const summary = textContent(item, "description");

      return {
        id: normalizeId({ link, title, publishedAt }),
        feedId: feed.id,
        feedTitle,
        title,
        link,
        publishedAt,
        summary,
      };
    });
  }

  const atomEntries = Array.from(doc.querySelectorAll("feed entry"));
  return atomEntries.map((entry) => {
    const title = textContent(entry, "title") || "(untitled)";
    const link = entry.querySelector("link")?.getAttribute("href") || undefined;
    const publishedAt = normalizeDate(textContent(entry, "updated") || textContent(entry, "published"));
    const summary = textContent(entry, "summary") || textContent(entry, "content");

    return {
      id: normalizeId({ link, title, publishedAt }),
      feedId: feed.id,
      feedTitle,
      title,
      link,
      publishedAt,
      summary,
    };
  });
}
