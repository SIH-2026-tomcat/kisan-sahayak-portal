/**
 * Illustrative pincode -> state/district lookup for the prototype.
 * Real deployments should use an authoritative postal dataset.
 * Keyed by the first 3 digits of the pincode (postal sub-region).
 */
const PREFIX_MAP: Record<string, { state: string; district: string }> = {
  "753": { state: "Odisha", district: "Cuttack" },
  "754": { state: "Odisha", district: "Kendrapara" },
  "751": { state: "Odisha", district: "Khordha" },
  "755": { state: "Odisha", district: "Jajpur" },
  "756": { state: "Odisha", district: "Bhadrak" },
  "500": { state: "Telangana", district: "Hyderabad" },
  "110": { state: "Delhi", district: "New Delhi" },
  "700": { state: "West Bengal", district: "Kolkata" },
  "560": { state: "Karnataka", district: "Bengaluru Urban" },
};

export function lookupPincode(pincode: string): { state: string; district: string } | null {
  return PREFIX_MAP[pincode.slice(0, 3)] ?? null;
}
