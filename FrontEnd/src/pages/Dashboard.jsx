import { useState, useEffect } from "react"
import React from 'react';

import logo from "../assets/logohydrodz.png"

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
  // Extract data differently based on the API response format
  const barrageData = dam.valeurs || dam;
  const damName = getDamNameById(barrageData.barrageId);
  const location = getLocationByWilaya(barrageData.wilaya);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">{damName}</h3>
          <StatusIndicator status={dam.status} />
        </div>
        <div className="text-sm text-gray-500 mt-1">
          ID: {barrageData.barrageId} • {location}
        </div>
        <div className="text-sm text-gray-500 mt-1">Wilaya: {barrageData.wilaya}</div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Temperature</span>
            <span className="text-xl font-semibold text-gray-900">{barrageData.temperature.toFixed(3)}°C</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Water Level</span>
            <span className="text-xl font-semibold text-gray-900">{barrageData.niveau_eau.toFixed(3)}m</span>
          </div>
        </div>

        <div className="space-y-3">
          <Gauge value={barrageData.humidite.toFixed(3) } max={100} label="Humidity" unit="%" color="bg-cyan-700" />
          <Gauge value={barrageData.pression.toFixed(3)} max={1030} label="Pressure" unit="hPa" color="bg-cyan-700" />
        </div>

        <div className="mt-4 text-xs text-gray-500">Last updated: {formatDate(barrageData.timestamp)}</div>
        {barrageData.confiance && (
          <div className="mt-1 text-xs text-gray-500">Confidence: {barrageData.confiance}</div>
        )}
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <button
          type="button"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-700 hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600 transition-all duration-200"
          onClick={() => alert(`View details for ${damName}`)}
        >
          View Details
        </button>
      </div>
    </div>
  )
}

// Queue Status Card Component
const QueueStatusCard = ({ title, value, icon, bgColor, textColor }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
      <div className={`rounded-full ${bgColor} p-3 mr-4`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 ${textColor}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {icon}
        </svg>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  )
}

// Helper function to get dam name from ID
const getDamNameById = (id) => {
  const damNames = {
    "DAM001": "Barrage Beni Haroun",
    "BRG01": "Barrage Beni Haroun",
    "BRG02": "Barrage Koudiat Acerdoune",
    "BRG03": "Barrage Taksebt",
    "BRG04": "Barrage Ghrib",
    "BRG05": "Barrage Foum El Gherza",
    "BRG06": "Barrage Béni Bahdel",
    "DAM002": "Barrage Keddara",
    "DAM003": "Barrage Taksebt",
    "DAM004": "Barrage Ghrib",
    "DAM005": "Barrage Foum El Gherza",
    "DAM006": "Barrage Béni Bahdel",
  };
  return damNames[id] || `Dam ${id}`;
};


const getLocationByWilaya = (wilaya) => {
  return wilaya || "Unknown";
};

function DamMonitoring() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [damsData, setDamsData] = useState([])
  const [queueData, setQueueData] = useState({
    queuesLength: { high: 0, medium: 0, low: 0 },
    status: { kafkaConnected: false, stats: { processed: 0, failed: 0, retried: 0 } }
  })
  const [loading, setLoading] = useState(true)
  const [queueLoading, setQueueLoading] = useState(true)
  const [error, setError] = useState(null)
  const [queueError, setQueueError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [queueLastUpdated, setQueueLastUpdated] = useState(null)

  // Fetch dam data from API
  const fetchDamData = async () => {
    try {
      const response = await fetch("http://localhost:5100/data");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setDamsData(data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dam data:", error);
      setError("Failed to load dam data. Please try again later.");
      setLoading(false);
    }
  };

  // Fetch queue data from API
  const fetchQueueData = async () => {
    try {
      const response = await fetch("http://localhost:4000/queue-status");
      if (!response.ok) {
        throw new Error("Queue API response was not ok");
      }
      const data = await response.json();
      setQueueData(data);
      setQueueLastUpdated(new Date());
      setQueueLoading(false);
    } catch (error) {
      console.error("Error fetching queue data:", error);
      setQueueError("Failed to load queue data. Please try again later.");
      setQueueLoading(false);
    }
  };
  
  useEffect(() => {
    // Initial data fetch
    fetchDamData();
    fetchQueueData();

    // Set up intervals for data refresh
    const damIntervalId = setInterval(() => {
      fetchDamData();
    }, 5000);

    const queueIntervalId = setInterval(() => {
      fetchQueueData();
    }, 5000);

    // Clean up intervals on component unmount
    return () => {
      clearInterval(damIntervalId);
      clearInterval(queueIntervalId);
    };
  }, []);
  
  const filteredDams = damsData.filter(
    (dam) => {
      const damId = dam.valeurs?.barrageId || "";
      const damName = getDamNameById(damId);
      const wilaya = dam.valeurs?.wilaya || "";
      
      return damName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        damId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wilaya.toLowerCase().includes(searchQuery.toLowerCase());
    }
  );
  
  const statusCounts = damsData.reduce(
    (acc, dam) => {
      acc[dam.status] = (acc[dam.status] || 0) + 1;
      return acc;
    },
    { normal: 0, warning: 0, critical: 0 }
  );

  // Calculate total items in queue
  const totalQueueItems = queueData.queuesLength 
    ? Object.values(queueData.queuesLength).reduce((sum, current) => sum + current, 0)
    : 0;

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
                    <span>MM</span>
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
                activeTab === "queue"
                  ? "border-cyan-700 text-cyan-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200`}
              onClick={() => setActiveTab("queue")}
            >
              Queue Monitor
            </button>
          </nav>
        </div>

        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Data loading status */}
            {lastUpdated && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">
                  Last data update: {formatDate(lastUpdated)}
                </span>
                <button 
                  onClick={fetchDamData}
                  className="text-sm text-cyan-700 hover:text-cyan-800 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            )}

            {loading && !error && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-700"></div>
                <span className="ml-3 text-cyan-700">Loading data...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 p-4 rounded-md mb-8">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={fetchDamData}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && (
              <>
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
                      <div className="text-2xl font-semibold text-gray-900">{statusCounts.normal || 0} Dams</div>
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
                      <div className="text-2xl font-semibold text-gray-900">{statusCounts.warning || 0} Dams</div>
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
                      <div className="text-2xl font-semibold text-gray-900">{statusCounts.critical || 0} Dams</div>
                    </div>
                  </div>
                </div>

                {/* Dam cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDams.length > 0 ? (
                    filteredDams.map((dam, index) => <DamCard key={index} dam={dam} />)
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
              </>
            )}
          </>
        )}

        {/* Queue Monitor Tab Content */}
        {activeTab === "queue" && (
          <>
            {/* Queue data loading status */}
            {queueLastUpdated && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">
                  Last queue update: {formatDate(queueLastUpdated)}
                </span>
                <button 
                  onClick={fetchQueueData}
                  className="text-sm text-cyan-700 hover:text-cyan-800 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            )}

            {queueLoading && !queueError && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-700"></div>
                <span className="ml-3 text-cyan-700">Loading queue data...</span>
              </div>
            )}

            {queueError && (
              <div className="bg-red-50 p-4 rounded-md mb-8">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{queueError}</div>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={fetchQueueData}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!queueLoading && !queueError && (
              <>
                {/* Kafka Connection Status */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`rounded-full ${queueData.status.kafkaConnected ? 'bg-green-100' : 'bg-red-100'} p-3 mr-4`}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-6 w-6 ${queueData.status.kafkaConnected ? 'text-green-600' : 'text-red-600'}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={queueData.status.kafkaConnected ? 
                              "M5 13l4 4L19 7" : 
                              "M6 18L18 6M6 6l12 12"}
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Kafka Connection</div>
                        <div className="text-xl font-semibold text-gray-900">
                          {queueData.status.kafkaConnected ? "Connected" : "Disconnected"}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Total Items in Queue: <span className="font-semibold">{totalQueueItems}</span>
                    </div>
                  </div>
                </div>

                {/* Queue Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <QueueStatusCard
                    title="High Priority Queue"
                    value={queueData.queuesLength.high}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
                    bgColor="bg-red-100"
                    textColor="text-red-600"
                  />
                  
                  <QueueStatusCard
                    title="Medium Priority Queue"
                    value={queueData.queuesLength.medium}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />}
                    bgColor="bg-yellow-100"
                    textColor="text-yellow-600"
                  />
                  
                  <QueueStatusCard
                    title="Low Priority Queue"
                    value={queueData.queuesLength.low}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />}
                    bgColor="bg-blue-100"
                    textColor="text-blue-600"
                  />

                  <QueueStatusCard
                    title="Processed"
                    value={queueData.status.stats.processed}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                    bgColor="bg-green-100"
                    textColor="text-green-600"
                  />
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default DamMonitoring;