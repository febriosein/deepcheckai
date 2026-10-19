/**
 * Comprehensive URL Resolver for Social Media & Web Links
 * Supports: TikTok, Instagram, YouTube, X/Twitter, and General Web/News Portals.
 */

export interface ResolvedUrlContent {
  platform:
    | "tiktok"
    | "instagram"
    | "youtube"
    | "twitter"
    | "facebook"
    | "news"
    | "web";
  mediaType: "video" | "image" | "text";
  title: string;
  author?: string;
  extractedText: string;
  thumbnailBase64?: string;
  thumbnailMimeType?: string;
  canonicalUrl: string;
  isSocialMediaVideo: boolean;
}

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Fetch image URL and convert to Base64 for visual verification
 */
async function fetchImageAsBase64(
  imageUrl: string,
  timeoutMs = 5000
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });
    clearTimeout(timer);

    if (!res.ok) return null;

    const mimeType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Limit maximum image size to 5MB
    if (buffer.length > 5 * 1024 * 1024 || buffer.length === 0) return null;

    return {
      base64: buffer.toString("base64"),
      mimeType: mimeType.split(";")[0],
    };
  } catch {
    return null;
  }
}

/**
 * Resolve short URLs (vt.tiktok.com, youtu.be, bit.ly, etc.)
 */
async function resolveShortUrl(url: string): Promise<string> {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    const isShortDomain =
      host.includes("vt.tiktok.com") ||
      host.includes("vm.tiktok.com") ||
      host === "youtu.be" ||
      host === "t.co" ||
      host === "bit.ly" ||
      host === "tinyurl.com";

    if (!isShortDomain) return url;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": BROWSER_USER_AGENT },
    });
    clearTimeout(timer);

    return res.url || url;
  } catch {
    return url;
  }
}

/**
 * Parse & resolve TikTok videos
 */
async function resolveTikTok(rawUrl: string): Promise<ResolvedUrlContent> {
  const canonicalUrl = await resolveShortUrl(rawUrl);
  let username = "";
  let videoId = "";

  try {
    const parsed = new URL(canonicalUrl);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const userPart = pathParts.find((p) => p.startsWith("@"));
    if (userPart) username = userPart.slice(1);
    const videoIdx = pathParts.indexOf("video");
    if (videoIdx !== -1 && pathParts[videoIdx + 1]) {
      videoId = pathParts[videoIdx + 1].split("?")[0];
    }
  } catch {}

  let title = "Video Konten TikTok";
  let authorName = username ? `@${username}` : "Kreator TikTok";
  let thumbnailUrl: string | undefined = undefined;

  // Query TikTok official oEmbed API
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(
      canonicalUrl
    )}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Referer: "https://www.tiktok.com/",
        Accept: "application/json",
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.title) title = data.title;
      if (data.author_name) authorName = data.author_name;
      if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
    }
  } catch {}

  // Fetch thumbnail frame if available
  let thumbnailData: { base64: string; mimeType: string } | null = null;
  if (thumbnailUrl) {
    thumbnailData = await fetchImageAsBase64(thumbnailUrl);
  }

  const structuredText = `[Kanal: Video TikTok]
Akun Pengunggah: ${authorName}${username ? ` (@${username})` : ""}
Judul / Takarir (Caption): "${title}"
${videoId ? `ID Video: ${videoId}` : ""}
Tautan Asli: ${canonicalUrl}
Catatan Verifikasi: Periksa konsistensi narasi video dengan basis data klarifikasi cek fakta TurnBackHoax, Kominfo, dan media nasional.`;

  return {
    platform: "tiktok",
    mediaType: "video",
    title,
    author: authorName,
    extractedText: structuredText,
    thumbnailBase64: thumbnailData?.base64,
    thumbnailMimeType: thumbnailData?.mimeType,
    canonicalUrl,
    isSocialMediaVideo: true,
  };
}

/**
 * Parse & resolve Instagram Reels / Posts
 */
async function resolveInstagram(rawUrl: string): Promise<ResolvedUrlContent> {
  const canonicalUrl = await resolveShortUrl(rawUrl);
  let isReel = false;
  let code = "";
  let username = "";

  try {
    const parsed = new URL(canonicalUrl);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.includes("reel") || parts.includes("reels")) {
      isReel = true;
      const idx = parts.findIndex((p) => p === "reel" || p === "reels");
      if (parts[idx + 1]) code = parts[idx + 1].split("?")[0];
    } else if (parts.includes("p")) {
      const idx = parts.indexOf("p");
      if (parts[idx + 1]) code = parts[idx + 1].split("?")[0];
    }
    const userPart = parts.find((p) => !["reel", "reels", "p", "tv", "stories", code].includes(p));
    if (userPart && !userPart.includes("?")) username = userPart;
  } catch {}

  let title = isReel ? "Instagram Reel Video" : "Instagram Post";
  let authorName = username ? `@${username}` : (isReel ? "Kreator Instagram Reel" : "Pengguna Instagram");
  let description = "";

  // Try fetching page OpenGraph with bot headers
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(canonicalUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const html = await res.text();
      const ogTitleMatch = html.match(
        /<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i
      );
      if (ogTitleMatch) title = ogTitleMatch[1];

      const ogDescMatch = html.match(
        /<meta\s+(?:property|name)=["'](?:og:description|description)["']\s+content=["']([^"']+)["']/i
      );
      if (ogDescMatch) description = ogDescMatch[1];
    }
  } catch {}

  const structuredText = `[Kanal: ${isReel ? "Instagram Reel" : "Postingan Instagram"}]
Kode Konten: ${code || "tersedia di URL"}
Akun Pengunggah: ${authorName}
${title !== "Instagram Reel Video" && title !== "Instagram Post" ? `Judul / Header: "${title}"` : ""}
${description ? `Konteks Takarir: "${description}"` : ""}
Tautan Asli: ${canonicalUrl}
Catatan Verifikasi: Lakukan pengujian mendalam terhadap indikasi manipulasi visual / kloning audio jika mencatut pejabat atau program bantuan.`;

  return {
    platform: "instagram",
    mediaType: isReel ? "video" : "image",
    title,
    author: authorName,
    extractedText: structuredText,
    canonicalUrl,
    isSocialMediaVideo: isReel,
  };
}

/**
 * Parse & resolve YouTube Videos / Shorts
 */
async function resolveYouTube(rawUrl: string): Promise<ResolvedUrlContent> {
  const canonicalUrl = await resolveShortUrl(rawUrl);
  let videoId = "";
  let isShort = false;

  try {
    const parsed = new URL(canonicalUrl);
    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.slice(1).split("?")[0];
    } else if (parsed.pathname.includes("/shorts/")) {
      isShort = true;
      videoId = parsed.pathname.split("/shorts/")[1].split("?")[0];
    } else {
      videoId = parsed.searchParams.get("v") || "";
    }
  } catch {}

  let title = isShort ? "YouTube Shorts" : "Video YouTube";
  let authorName = "Kanal YouTube";
  let thumbnailUrl: string | undefined = videoId
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : undefined;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      canonicalUrl
    )}&format=json`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": BROWSER_USER_AGENT },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.title) title = data.title;
      if (data.author_name) authorName = data.author_name;
      if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
    }
  } catch {}

  let thumbnailData: { base64: string; mimeType: string } | null = null;
  if (thumbnailUrl) {
    thumbnailData = await fetchImageAsBase64(thumbnailUrl);
  }

  const structuredText = `[Kanal: ${isShort ? "YouTube Shorts" : "Video YouTube"}]
Kanal Pengunggah: ${authorName}
Judul Video: "${title}"
${videoId ? `ID Video: ${videoId}` : ""}
Tautan Asli: ${canonicalUrl}
Catatan Verifikasi: Verifikasi klaim audio dan narasi terhadap sumber kredibel dan cek fakta resmi.`;

  return {
    platform: "youtube",
    mediaType: "video",
    title,
    author: authorName,
    extractedText: structuredText,
    thumbnailBase64: thumbnailData?.base64,
    thumbnailMimeType: thumbnailData?.mimeType,
    canonicalUrl,
    isSocialMediaVideo: true,
  };
}

/**
 * Parse & resolve X / Twitter posts
 */
async function resolveTwitter(rawUrl: string): Promise<ResolvedUrlContent> {
  const canonicalUrl = await resolveShortUrl(rawUrl);
  let tweetText = "";
  let authorName = "Pengguna X";
  let thumbnailUrl: string | undefined = undefined;

  try {
    // Attempt FxTwitter public API for clean tweet extraction
    const parsed = new URL(canonicalUrl);
    const path = parsed.pathname;
    const fxtwitterUrl = `https://api.fxtwitter.com${path}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(fxtwitterUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "DeepCheckAI/1.0" },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.tweet) {
        tweetText = data.tweet.text || "";
        authorName = `${data.tweet.author?.name || ""} (@${data.tweet.author?.screen_name || ""})`.trim();
        if (data.tweet.media?.photos?.[0]?.url) {
          thumbnailUrl = data.tweet.media.photos[0].url;
        } else if (data.tweet.media?.videos?.[0]?.thumbnail_url) {
          thumbnailUrl = data.tweet.media.videos[0].thumbnail_url;
        }
      }
    }
  } catch {}

  let thumbnailData: { base64: string; mimeType: string } | null = null;
  if (thumbnailUrl) {
    thumbnailData = await fetchImageAsBase64(thumbnailUrl);
  }

  const structuredText = `[Kanal: Postingan X / Twitter]
Penulis / Akun: ${authorName}
Teks Tweet: "${tweetText || "Cek klaim dari tautan X terlampir"}"
Tautan Asli: ${canonicalUrl}`;

  return {
    platform: "twitter",
    mediaType: thumbnailUrl ? "image" : "text",
    title: tweetText ? tweetText.slice(0, 100) : "Postingan X / Twitter",
    author: authorName,
    extractedText: structuredText,
    thumbnailBase64: thumbnailData?.base64,
    thumbnailMimeType: thumbnailData?.mimeType,
    canonicalUrl,
    isSocialMediaVideo: false,
  };
}

/**
 * Parse standard news portals, government portals, or general websites
 */
async function resolveGeneralWeb(rawUrl: string): Promise<ResolvedUrlContent> {
  const canonicalUrl = await resolveShortUrl(rawUrl);
  let title = "Artikel Web";
  let description = "";
  let bodyText = "";
  let ogImageUrl: string | undefined = undefined;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(canonicalUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const html = await res.text();

      // Extract title
      const titleMatch =
        html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) title = titleMatch[1].trim();

      // Extract description
      const descMatch = html.match(
        /<meta\s+(?:property|name)=["'](?:og:description|description)["']\s+content=["']([^"']+)["']/i
      );
      if (descMatch) description = descMatch[1].trim();

      // Extract og:image
      const imgMatch = html.match(
        /<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i
      );
      if (imgMatch) ogImageUrl = imgMatch[1].trim();

      // Clean HTML body text (extract readable paragraphs)
      const cleanHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "");

      const paragraphs = cleanHtml.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) || [];
      const extractedParas = paragraphs
        .map((p) => p.replace(/<[^>]+>/g, "").trim())
        .filter((t) => t.length > 30)
        .slice(0, 10)
        .join("\n\n");

      bodyText = extractedParas.slice(0, 3000);
    }
  } catch {}

  let thumbnailData: { base64: string; mimeType: string } | null = null;
  if (ogImageUrl) {
    thumbnailData = await fetchImageAsBase64(ogImageUrl);
  }

  const structuredText = `[Sumber: Portal Berita / Situs Web]
Judul: "${title}"
${description ? `Ringkasan: "${description}"` : ""}
${bodyText ? `Kutipan Isi Berita:\n${bodyText}` : ""}
Tautan Asli: ${canonicalUrl}`;

  return {
    platform: "news",
    mediaType: thumbnailData ? "image" : "text",
    title,
    extractedText: structuredText,
    thumbnailBase64: thumbnailData?.base64,
    thumbnailMimeType: thumbnailData?.mimeType,
    canonicalUrl,
    isSocialMediaVideo: false,
  };
}

/**
 * Master URL Resolver
 * Automatically classifies URL, routes to appropriate handler, and returns rich analysis metadata.
 */
export async function resolveUrlContent(rawUrl: string): Promise<ResolvedUrlContent> {
  const trimmed = rawUrl.trim();
  const lower = trimmed.toLowerCase();

  // TikTok detection
  if (
    lower.includes("tiktok.com") ||
    lower.includes("vt.tiktok.com") ||
    lower.includes("vm.tiktok.com")
  ) {
    return resolveTikTok(trimmed);
  }

  // Instagram detection
  if (lower.includes("instagram.com") || lower.includes("instagr.am")) {
    return resolveInstagram(trimmed);
  }

  // YouTube detection
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return resolveYouTube(trimmed);
  }

  // Twitter / X detection
  if (lower.includes("twitter.com") || lower.includes("x.com")) {
    return resolveTwitter(trimmed);
  }

  // Fallback to standard web & news scraper
  return resolveGeneralWeb(trimmed);
}
