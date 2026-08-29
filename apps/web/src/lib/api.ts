const API_URL = process.env.PUBLIC_API_URL || "http://localhost:3001";

export async function getAreasByPincode(pincode: string) {
  const res = await fetch(`${API_URL}/areas/by-pincode/${pincode}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getOpenSlots(serviceAreaId: string) {
  const res = await fetch(`${API_URL}/slots?serviceAreaId=${serviceAreaId}&status=open`, {
    next: { revalidate: 10 },
  });
  if (!res.ok) return { items: [] };
  return res.json();
}
