import { DEMO_SERVICE_AREA, DEMO_SLOTS } from "./demo-data";

const API_URL = process.env.PUBLIC_API_URL || "http://localhost:3001";
const DUMMY_MODE = process.env.DUMMY_MODE === "true";

export async function getAreasByPincode(pincode: string) {
  if (DUMMY_MODE && pincode === "754211") {
    return { serviceArea: DEMO_SERVICE_AREA, eligibleCentres: [DEMO_SLOTS[0].centre] };
  }

  try {
    const res = await fetch(`${API_URL}/areas/by-pincode/${pincode}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`API status ${res.status}`);
    return res.json();
  } catch {
    if (pincode === "754211") {
      return { serviceArea: DEMO_SERVICE_AREA, eligibleCentres: [DEMO_SLOTS[0].centre] };
    }
    return null;
  }
}

export async function getOpenSlots(serviceAreaId: string) {
  if (DUMMY_MODE || serviceAreaId === DEMO_SERVICE_AREA.id) {
    return { items: DEMO_SLOTS };
  }

  try {
    const res = await fetch(`${API_URL}/slots?serviceAreaId=${serviceAreaId}&status=open`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) throw new Error(`API status ${res.status}`);
    const data = await res.json();
    if (data.items?.length === 0) return { items: DEMO_SLOTS };
    return data;
  } catch {
    return { items: DEMO_SLOTS };
  }
}
