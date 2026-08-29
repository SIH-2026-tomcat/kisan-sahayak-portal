"use client";

import { useState } from "react";

export default function SlotCard({ slot }: { slot: any }) {
  const [bookedCount, setBookedCount] = useState(slot.bookedCount);
  const [confirmed, setConfirmed] = useState(false);

  const remaining = slot.capacity - bookedCount;

  const book = () => {
    if (remaining <= 0 || confirmed) return;
    setBookedCount(bookedCount + 1);
    setConfirmed(true);
  };

  return (
    <div className="border border-gov-border rounded-md p-3 hover:border-gov-green-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-gov-ink">
            {slot.startTime} - {slot.endTime}
          </p>
          <p className="text-sm text-gov-muted">{slot.centre.name}</p>
          <p className="text-sm text-gov-muted">{slot.centre.address}</p>
        </div>
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gov-green-100 text-gov-green-900">
          {remaining} left
        </span>
      </div>
      {confirmed ? (
        <div className="mt-3 w-full bg-gov-green-50 border border-gov-green-200 text-gov-green-900 py-2 rounded-md text-sm font-medium text-center">
          Demo booking confirmed
        </div>
      ) : (
        <button
          onClick={book}
          disabled={remaining <= 0}
          className="mt-3 w-full bg-gov-green-800 text-white py-2 rounded-md text-sm font-medium hover:bg-gov-green-900 disabled:bg-gov-gray-400 disabled:cursor-not-allowed"
        >
          {remaining <= 0 ? "Slot full" : "Book this slot"}
        </button>
      )}
    </div>
  );
}
