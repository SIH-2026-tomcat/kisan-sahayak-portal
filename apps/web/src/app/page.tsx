import { getAreasByPincode, getOpenSlots } from "@/lib/api";

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
              <div
                key={slot.id}
                className="border border-gov-border rounded-md p-3 hover:border-gov-green-700"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gov-ink">
                      {slot.startTime} - {slot.endTime}
                    </p>
                    <p className="text-sm text-gov-muted">{slot.centre.name}</p>
                    <p className="text-sm text-gov-muted">{slot.centre.address}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gov-green-100 text-gov-green-900">
                    {slot.capacity - slot.bookedCount} left
                  </span>
                </div>
                <button className="mt-3 w-full bg-gov-green-800 text-white py-2 rounded-md text-sm font-medium hover:bg-gov-green-900">
                  Book this slot
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
