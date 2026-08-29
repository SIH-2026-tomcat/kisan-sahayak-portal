import { getAreasByPincode, getOpenSlots } from "@/lib/api";
import SlotCard from "@/components/SlotCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const pincode = "754211";
  const areaData = await getAreasByPincode(pincode);
  const slotsData = areaData
    ? await getOpenSlots(areaData.serviceArea.id)
    : { items: [] };

  return (
    <main className="max-w-3xl mx-auto p-4">
      <section className="bg-gov-green-900 text-white p-6 rounded-lg mb-6">
        <p className="text-sm uppercase tracking-wide opacity-80">Government of India</p>
        <h1 className="text-2xl font-bold mt-1">Kisan Sahayak Portal</h1>
        <p className="mt-2 text-gov-green-100">
          Know your centre. Book your slot. Come when it is your turn.
        </p>
      </section>

      {areaData && (
        <section className="bg-white border border-gov-border rounded-lg p-4 mb-6 shadow-sm">
          <h2 className="font-semibold text-gov-ink">Service area found</h2>
          <p className="text-gov-muted">
            {areaData.serviceArea.district} district, {areaData.serviceArea.state}
          </p>
        </section>
      )}

      <section className="bg-white border border-gov-border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold text-gov-ink mb-4">Open slots</h2>
        {slotsData.items.length === 0 ? (
          <p className="text-gov-muted">No open slots right now.</p>
        ) : (
          <div className="space-y-3">
            {slotsData.items.map((slot: any) => (
              <SlotCard key={slot.id} slot={slot} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
