export default function DashboardPage() {
  const stats = [
    { label: "Total Units", value: "—", icon: "🏠", color: "bg-blue-50 text-blue-700" },
    { label: "Residents", value: "—", icon: "👥", color: "bg-green-50 text-green-700" },
    { label: "Payments Due", value: "—", icon: "💶", color: "bg-yellow-50 text-yellow-700" },
    { label: "Open Requests", value: "—", icon: "🔧", color: "bg-red-50 text-red-700" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to HOA Manager</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${stat.color}`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Announcements</h2>
          <p className="text-sm text-gray-400">No announcements yet.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Maintenance Requests</h2>
          <p className="text-sm text-gray-400">No open requests.</p>
        </div>
      </div>
    </div>
  );
}
