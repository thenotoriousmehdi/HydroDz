import React from 'react';
import { Link } from 'react-router-dom';

const Forbidden = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-6xl font-bold text-red-600">403</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mt-2">Access Denied</h2>
      <p className="text-gray-600 mt-4">
        You do not have permission to access this page.
      </p>
      <Link
        to="/"
        className="mt-6 px-6 py-3 bg-cyan-700 text-white text-lg font-medium rounded-lg shadow hover:bg-green/80 transition"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default Forbidden;
