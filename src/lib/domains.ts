/**
 * Domain credibility intelligence for Indonesian media, government, and educational portals.
 */

export interface DomainCheckResult {
  isKnownDomain: boolean;
  isCredibleMedia: boolean;
  isOfficialGovEdu: boolean;
  isFactChecker: boolean;
  isSocialMedia: boolean;
  domainName: string;
  categoryName: string;
  trustScoreBonus: number; // Positive bonus for credible, penalty for suspicious
}

const CREDIBLE_MEDIA_DOMAINS = new Set([
  "kompas.com",
  "kompas.id",
  "detik.com",
  "tempo.co",
  "antaranews.com",
  "cnnindonesia.com",
  "liputan6.com",
  "republika.co.id",
  "tirto.id",
  "bisnis.com",
  "kontan.co.id",
  "jawapos.com",
  "kumparan.com",
  "suara.com",
  "mediaindonesia.com",
  "tribunnews.com",
  "idntimes.com",
  "viva.co.id",
  "bbc.com",
  "voaindonesia.com",
  "cnbcindonesia.com",
]);

const FACT_CHECK_DOMAINS = new Set([
  "turnbackhoax.id",
  "cekfakta.com",
  "kominfo.go.id",
  "aduankonten.id",
  "mafindo.or.id",
]);

const SOCIAL_MEDIA_DOMAINS = new Set([
  "tiktok.com",
  "instagram.com",
  "instagr.am",
  "youtube.com",
  "youtu.be",
  "twitter.com",
  "x.com",
  "facebook.com",
  "fb.watch",
  "threads.net",
]);

export function evaluateUrlDomain(rawUrl: string): DomainCheckResult {
  try {
    const parsed = new URL(rawUrl);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);

    const isGovEdu =
      host.endsWith(".go.id") ||
      host.endsWith(".ac.id") ||
      host.endsWith(".mil.id") ||
      host.endsWith(".sch.id");

    const isFactChecker =
      FACT_CHECK_DOMAINS.has(host) ||
      Array.from(FACT_CHECK_DOMAINS).some((d) => host.endsWith("." + d));

    const isCredibleMedia =
      CREDIBLE_MEDIA_DOMAINS.has(host) ||
      Array.from(CREDIBLE_MEDIA_DOMAINS).some((d) => host.endsWith("." + d));

    const isSocialMedia =
      SOCIAL_MEDIA_DOMAINS.has(host) ||
      Array.from(SOCIAL_MEDIA_DOMAINS).some((d) => host.endsWith("." + d));

    if (isFactChecker) {
      return {
        isKnownDomain: true,
        isCredibleMedia: true,
        isOfficialGovEdu: host.endsWith(".go.id"),
        isFactChecker: true,
        isSocialMedia: false,
        domainName: host,
        categoryName: "Portal Cek Fakta Resmi / Independen",
        trustScoreBonus: 25,
      };
    }

    if (isGovEdu) {
      return {
        isKnownDomain: true,
        isCredibleMedia: false,
        isOfficialGovEdu: true,
        isFactChecker: false,
        isSocialMedia: false,
        domainName: host,
        categoryName: host.endsWith(".go.id")
          ? "Domain Resmi Pemerintah Republik Indonesia (.go.id)"
          : "Domain Institusi Pendidikan / Universitas (.ac.id)",
        trustScoreBonus: 20,
      };
    }

    if (isCredibleMedia) {
      return {
        isKnownDomain: true,
        isCredibleMedia: true,
        isOfficialGovEdu: false,
        isFactChecker: false,
        isSocialMedia: false,
        domainName: host,
        categoryName: "Media Pers Nasional Terverifikasi",
        trustScoreBonus: 18,
      };
    }

    if (isSocialMedia) {
      let platformLabel = "Platform Media Sosial";
      if (host.includes("tiktok")) platformLabel = "Platform Video Media Sosial (TikTok)";
      else if (host.includes("instagram") || host.includes("instagr.am")) platformLabel = "Platform Media Sosial (Instagram Reel / Post)";
      else if (host.includes("youtube") || host.includes("youtu.be")) platformLabel = "Platform Media Sosial (YouTube / Shorts)";
      else if (host.includes("twitter") || host.includes("x.com")) platformLabel = "Platform Media Sosial (X / Twitter)";
      else if (host.includes("facebook") || host.includes("fb.watch")) platformLabel = "Platform Media Sosial (Facebook Video)";

      return {
        isKnownDomain: true,
        isCredibleMedia: false,
        isOfficialGovEdu: false,
        isFactChecker: false,
        isSocialMedia: true,
        domainName: host,
        categoryName: platformLabel,
        trustScoreBonus: 0, // Netral: ditentukan dari isi konten, audio & cek fakta
      };
    }

    // Check for suspicious TLDs often abused in phishing
    const suspiciousTlds = [".xyz", ".top", ".buzz", ".club", ".work", ".site", ".online"];
    const isSuspiciousTld = suspiciousTlds.some((tld) => host.endsWith(tld));
    if (isSuspiciousTld) {
      return {
        isKnownDomain: false,
        isCredibleMedia: false,
        isOfficialGovEdu: false,
        isFactChecker: false,
        isSocialMedia: false,
        domainName: host,
        categoryName: "Domain Tidak Terverifikasi (TLD Berisiko)",
        trustScoreBonus: -20,
      };
    }

    return {
      isKnownDomain: false,
      isCredibleMedia: false,
      isOfficialGovEdu: false,
      isFactChecker: false,
      isSocialMedia: false,
      domainName: host,
      categoryName: "Domain Publik Umum",
      trustScoreBonus: 0,
    };
  } catch {
    return {
      isKnownDomain: false,
      isCredibleMedia: false,
      isOfficialGovEdu: false,
      isFactChecker: false,
      isSocialMedia: false,
      domainName: "",
      categoryName: "URL Tidak Valid",
      trustScoreBonus: 0,
    };
  }
}
