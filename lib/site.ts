export const BANK_SITE_URL = "https://banco.laplaceta.org";
export const BANK_API_URL = "https://api.banco.laplaceta.org";
export const GDLP_SITE_URL = "https://www.laplaceta.org";
export const GDLP_SITE_URL_NO_WWW = "https://laplaceta.org";

export function bankUrl(path = "/") {
  return new URL(path, BANK_SITE_URL).toString();
}

export function bankApiUrl(path = "/") {
  return new URL(path, BANK_API_URL).toString();
}

export function gdlpUrl(path = "/") {
  return new URL(path, GDLP_SITE_URL).toString();
}
