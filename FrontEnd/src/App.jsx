import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigate } from 'react-router-dom';

import React from 'react';
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        {/* <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="users" element={<Dashboard />} />
        </Route> */}
      </Routes>
    </Router>
  );
}

export default App;