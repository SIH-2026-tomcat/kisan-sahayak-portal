"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

export function CapacityChart({ data }: { data: any[] }) {
  const rows = data.slice(0, 20).map((d) => ({
    label: `${d.centre.split(" ")[0]} ${d.slotDate.slice(5)} ${d.startTime}`,
    capacity: d.capacity,
    booked: d.booked,
  }));
  if (rows.length === 0) return <p className="text-sm text-muted">No slot data yet.</p>;
  return (
    <div className="h-64 w-full overflow-x-auto">
      <div style={{ minWidth: Math.max(600, rows.length * 60) }} className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="label" angle={-35} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="capacity" fill="#CFE5D6" name="Capacity" />
            <Bar dataKey="booked" fill="#1F6B3A" name="Booked" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
