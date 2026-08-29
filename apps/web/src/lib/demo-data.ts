export const DEMO_SERVICE_AREA = {
  id: "59882d00-9c29-4ce5-be82-fe4436d0e180",
  code: "OD-KDP-01",
  name: "Kendrapara District",
  district: "Kendrapara",
  state: "Odisha",
};

export const DEMO_CENTRE = {
  id: "09dde818-5502-4c8c-89db-b9ac53fa9efc",
  name: "Kendrapara Procurement Centre",
  address: "Near Bus Stand, Kendrapara, Odisha",
  pincode: "754211",
  latitude: "20.50000000",
  longitude: "86.42000000",
  district: "Kendrapara",
  state: "Odisha",
  contactPhone: "1800-11-4000",
  openingHours: "10:00 AM - 01:00 PM",
  commodities: ["Rice"],
  status: "active",
};

export const DEMO_WINDOW = {
  id: "8216d9eb-a946-4d38-b401-44eedd24d88d",
  commodity: "Rice",
  season: "Kharif",
  year: 2026,
  startDate: "2026-08-29",
  endDate: "2026-09-30",
  status: "open",
};

export const DEMO_SLOTS = [
  {
    id: "d76f102a-e853-4dcb-a687-77440132f004",
    centreId: DEMO_CENTRE.id,
    procurementWindowId: DEMO_WINDOW.id,
    slotDate: "2026-08-29",
    startTime: "10:00",
    endTime: "13:00",
    capacity: 100,
    bookedCount: 0,
    status: "open",
    centre: DEMO_CENTRE,
    procurementWindow: DEMO_WINDOW,
  },
  {
    id: "d2df5e58-615f-4550-a040-51ad99a79a58",
    centreId: DEMO_CENTRE.id,
    procurementWindowId: DEMO_WINDOW.id,
    slotDate: "2026-08-29",
    startTime: "14:00",
    endTime: "17:00",
    capacity: 80,
    bookedCount: 0,
    status: "open",
    centre: DEMO_CENTRE,
    procurementWindow: DEMO_WINDOW,
  },
];
