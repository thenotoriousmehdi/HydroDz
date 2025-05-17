import { useState } from "react"
import React from 'react';
// Import the logo directly - assuming it's in the right path
// You'll need to adjust this path based on your project structure
import logo from "../assets/logohydrodz.png"
const damsData = [
  {
    timestamp: "2025-05-14T08:00:00Z",
    barrage_id: "BRG01",
    barrage_name: "Barrage Beni Haroun",
    capteur_id: "CAP001",
    temperature: 22.4,
    pression: 1012.3,
    niveau_eau: 4.5,
    humidite: 60.2,
    status: "normal",
    location: "Constantine",
    wilaya: "Constantine",
  },
  {
    timestamp: "2025-05-14T08:05:00Z",
    barrage_id: "BRG02",
    barrage_name: "Barrage Koudiat Acerdoune",
    capteur_id: "CAP002",
    temperature: 23.1,
    pression: 1010.8,
    niveau_eau: 3.8,
    humidite: 58.7,
    status: "warning",
    location: "Bouira",
    wilaya: "Bouira",
  },
  {
    timestamp: "2025-05-14T08:10:00Z",
    barrage_id: "BRG03",
    barrage_name: "Barrage Taksebt",
    capteur_id: "CAP003",
    temperature: 21.9,
    pression: 1013.5,
    niveau_eau: 5.2,
    humidite: 62.4,
    status: "normal",
    location: "Tizi Ouzou",
    wilaya: "Tizi Ouzou",
  },
  {
    timestamp: "2025-05-14T08:15:00Z",
    barrage_id: "BRG04",
    barrage_name: "Barrage Ghrib",
    capteur_id: "CAP004",
    temperature: 24.3,
    pression: 1009.7,
    niveau_eau: 2.9,
    humidite: 55.1,
    status: "critical",
    location: "Ain Defla",
    wilaya: "Ain Defla",
  },
  {
    timestamp: "2025-05-14T08:20:00Z",
    barrage_id: "BRG05",
    barrage_name: "Barrage Foum El Gherza",
    capteur_id: "CAP005",
    temperature: 26.7,
    pression: 1008.2,
    niveau_eau: 3.4,
    humidite: 48.9,
    status: "normal",
    location: "Biskra",
    wilaya: "Biskra",
  },
  {
    timestamp: "2025-05-14T08:25:00Z",
    barrage_id: "BRG06",
    barrage_name: "Barrage Béni Bahdel",
    capteur_id: "CAP006",
    temperature: 22.8,
    pression: 1011.6,
    niveau_eau: 4.1,
    humidite: 59.5,
    status: "normal",
    location: "Tlemcen",
    wilaya: "Tlemcen",
  },
]

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Status indicator component
const StatusIndicator = ({ status }) => {
  let bgColor = "bg-green-500"
  let statusText = "Normal"

  if (status === "warning") {
    bgColor = "bg-yellow-500"
    statusText = "Warning"
  } else if (status === "critical") {
    bgColor = "bg-red-500"
    statusText = "Critical"
  }

  return (
    <div className="flex items-center">
      <div className={`w-3 h-3 rounded-full ${bgColor} mr-2`}></div>
      <span className="text-sm font-medium">{statusText}</span>
    </div>
  )
}

// Gauge component for visualizing metrics
const Gauge = ({ value, max, label, unit, color }) => {
  const percentage = (value / max) * 100
  const gaugeColor = color || "bg-cyan-700"

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`absolute top-0 left-0 h-full ${gaugeColor}`} style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="text-sm font-medium mt-1">
        {value} {unit}
      </div>
    </div>
  )
}

// Dam card component
const DamCard = ({ dam }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">{dam.barrage_name}</h3>
          <StatusIndicator status={dam.status} />
        </div>
        <div className="text-sm text-gray-500 mt-1">
          ID: {dam.barrage_id} • {dam.location}
        </div>
        <div className="text-sm text-gray-500 mt-1">Wilaya: {dam.wilaya}</div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Temperature</span>
            <span className="text-xl font-semibold text-gray-900">{dam.temperature}°C</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Water Level</span>
            <span className="text-xl font-semibold text-gray-900">{dam.niveau_eau}m</span>
          </div>
        </div>

        <div className="space-y-3">
          <Gauge value={dam.humidite} max={100} label="Humidity" unit="%" color="bg-cyan-700" />
          <Gauge value={dam.pression} max={1030} label="Pressure" unit="hPa" color="bg-cyan-700" />
        </div>

        <div className="mt-4 text-xs text-gray-500">Last updated: {formatDate(dam.timestamp)}</div>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <button
          type="button"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-700 hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600 transition-all duration-200"
          onClick={() => alert(`View details for ${dam.barrage_name}`)}
        >
          View Details
        </button>
      </div>
    </div>
  )
}

function DamMonitoring() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Filter dams based on search query
  const filteredDams = damsData.filter(
    (dam) =>
      dam.barrage_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dam.barrage_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dam.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dam.wilaya.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Count dams by status
  const statusCounts = damsData.reduce(
    (acc, dam) => {
      acc[dam.status] = (acc[dam.status] || 0) + 1
      return acc
    },
    { normal: 0, warning: 0, critical: 0 },
  )

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={logo || "/placeholder.svg"} alt="HydroDZ Logo" className="h-8 w-auto" />
              <span className="ml-3 text-xl font-semibold text-gray-900">Dam Monitoring</span>
            </div>

            <div className="flex items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search dams..."
                  className="w-64 px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600 focus:border-transparent transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <div className="ml-4 relative">
                <button
                  type="button"
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-cyan-700 flex items-center justify-center text-white">
                    <span>AD</span>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50">
                    <a href="#profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Your Profile
                    </a>
                    <a href="#settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Settings
                    </a>
                    <a href="#signout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Sign out
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`${
                activeTab === "overview"
                  ? "border-cyan-700 text-cyan-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`${
                activeTab === "alerts"
                  ? "border-cyan-700 text-cyan-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200`}
              onClick={() => setActiveTab("alerts")}
            >
              Alerts
            </button>
            <button
              className={`${
                activeTab === "reports"
                  ? "border-cyan-700 text-cyan-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200`}
              onClick={() => setActiveTab("reports")}
            >
              Reports
            </button>
            <button
              className={`${
                activeTab === "settings"
                  ? "border-cyan-700 text-cyan-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Normal</div>
              <div className="text-2xl font-semibold text-gray-900">{statusCounts.normal} Dams</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Warning</div>
              <div className="text-2xl font-semibold text-gray-900">{statusCounts.warning} Dams</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className="rounded-full bg-red-100 p-3 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Critical</div>
              <div className="text-2xl font-semibold text-gray-900">{statusCounts.critical} Dams</div>
            </div>
          </div>
        </div>

        {/* Dam cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDams.length > 0 ? (
            filteredDams.map((dam) => <DamCard key={dam.barrage_id} dam={dam} />)
          ) : (
            <div className="col-span-3 text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No dams found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search query.</p>
            </div>
          )}
        </div>
      </main>

      {/* CSS for custom styling */}
      <style>
        {`
          /* Custom colors */
          .bg-cyan-700 { background-color: #087cb2; }
          .bg-cyan-800 { background-color: #065d85; }
          .text-cyan-700 { color: #087cb2; }
          .border-cyan-700 { border-color: #087cb2; }
          .hover\\:bg-cyan-800:hover { background-color: #065d85; }
          .hover\\:text-cyan-800:hover { color: #065d85; }
          .focus\\:ring-cyan-600:focus { --tw-ring-color: rgba(8, 124, 178, 0.6); }
          
          /* Transitions */
          .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 200ms; }
          .duration-200 { transition-duration: 200ms; }
          
          /* Animations */
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}
      </style>
    </div>
  )
}

export default DamMonitoring