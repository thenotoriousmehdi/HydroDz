import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigate } from 'react-router-dom';
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";
import React from 'react';
import Login from "./pages/Login";
import Forbidden from "./pages/Forbidden";
import Home from "./pages/Home";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/Login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home/>} />
          <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="Dashboard" element={<Dashboard />} />
          </Route>
          <Route path="/403" element={<Forbidden />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;