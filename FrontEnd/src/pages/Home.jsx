import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const userName = 'Mamoun';

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
      <h1 className="text-3xl font-semibold mb-6">Hello, {userName}!</h1>
      <Link
        to="/dashboard"
        className="px-6 py-3 bg-cyan-700 text-white rounded-lg shadow hover:bg-cyan-800 transition"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default Home;
