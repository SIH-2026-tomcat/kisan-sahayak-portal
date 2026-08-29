/**
 * Pincode -> state/district resolution for the portal.
 *
 * Primary source: India Post public PIN API (https://api.postalpincode.in).
 * Fallback: a small offline prefix table keyed by the first 3 digits of the
 * pincode (postal sub-region) so registration still works without network.
 * Real deployments should replace this with an authoritative postal dataset.
 */

export type GeoInfo = { state: string; district: string; source: "india-post" | "offline" | "none" };

const PREFIX_MAP: Record<string, { state: string; district: string }> = {
  "753": { state: "Odisha", district: "Cuttack" },
  "754": { state: "Odisha", district: "Kendrapara" },
  "751": { state: "Odisha", district: "Khordha" },
  "752": { state: "Odisha", district: "Puri" },
  "755": { state: "Odisha", district: "Jajpur" },
  "756": { state: "Odisha", district: "Bhadrak" },
  "757": { state: "Odisha", district: "Mayurbhanj" },
  "760": { state: "Odisha", district: "Ganjam" },
  "500": { state: "Telangana", district: "Hyderabad" },
  "501": { state: "Telangana", district: "Rangareddy" },
  "506": { state: "Telangana", district: "Warangal" },
  "110": { state: "Delhi", district: "New Delhi" },
  "700": { state: "West Bengal", district: "Kolkata" },
  "711": { state: "West Bengal", district: "Howrah" },
  "712": { state: "West Bengal", district: "Hooghly" },
  "713": { state: "West Bengal", district: "Paschim Bardhaman" },
  "741": { state: "West Bengal", district: "Nadia" },
  "743": { state: "West Bengal", district: "North 24 Parganas" },
  "560": { state: "Karnataka", district: "Bengaluru Urban" },
  "400": { state: "Maharashtra", district: "Mumbai" },
  "411": { state: "Maharashtra", district: "Pune" },
  "302": { state: "Rajasthan", district: "Jaipur" },
  "226": { state: "Uttar Pradesh", district: "Lucknow" },
  "201": { state: "Uttar Pradesh", district: "Gautam Buddha Nagar" },
  "141": { state: "Punjab", district: "Ludhiana" },
  "160": { state: "Chandigarh", district: "Chandigarh" },
  "380": { state: "Gujarat", district: "Ahmedabad" },
  "600": { state: "Tamil Nadu", district: "Chennai" },
  "682": { state: "Kerala", district: "Ernakulam" },
  "800": { state: "Bihar", district: "Patna" },
  "462": { state: "Madhya Pradesh", district: "Bhopal" },
  "781": { state: "Assam", district: "Kamrup Metropolitan" },
};

/** Offline-only guess. Kept synchronous for callers that cannot await. */
export function lookupPincode(pincode: string): { state: string; district: string } | null {
  return PREFIX_MAP[pincode.slice(0, 3)] ?? null;
}

async function fromIndiaPost(pincode: string): Promise<GeoInfo | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const body = (await res.json()) as Array<{ Status: string; PostOffice?: Array<{ State: string; District: string }> }>;
    const entry = Array.isArray(body) ? body[0] : undefined;
    const office = entry?.PostOffice?.[0];
    if (entry?.Status === "Success" && office?.State && office?.District) {
      return { state: office.State, district: office.District, source: "india-post" };
    }
    return null;
  } catch {
    return null;
  }
}

/** Best-effort resolution: live India Post first, then the offline table. */
export async function resolvePincode(pincode: string): Promise<GeoInfo> {
  if (!/^\d{6}$/.test(pincode)) return { state: "", district: "", source: "none" };
  const live = await fromIndiaPost(pincode);
  if (live) return live;
  const offline = lookupPincode(pincode);
  if (offline) return { ...offline, source: "offline" };
  return { state: "", district: "", source: "none" };
}
