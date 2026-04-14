/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Repairs from "./pages/Repairs";
import Staff from "./pages/Staff";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
// Super Admin Imports
import AdminLayout from "./admin/components/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminShops from "./admin/pages/AdminShops";
import AdminWallet from "./admin/pages/AdminWallet";
import AdminTransactions from "./admin/pages/AdminTransactions";
import AdminSubscriptions from "./admin/pages/AdminSubscriptions";
import AdminSettings from "./admin/pages/AdminSettings";
import Layout from "./components/Layout";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to={user?.role === "admin" ? "/admin" : "/"} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={user?.role === "admin" ? "/admin" : "/"} />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to={user?.role === "admin" ? "/admin" : "/"} />} />
        
        <Route element={user ? <Layout user={user} onLogout={() => { localStorage.clear(); setUser(null); }} /> : <Navigate to="/login" />}>
          <Route path="/" element={user?.role === "admin" ? <Navigate to="/admin" /> : <Dashboard user={user} />} />
          <Route path="/repairs" element={<Repairs />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/settings" element={<Settings user={user} onUpdate={setUser} />} />
          <Route path="/billing" element={<Billing onUpdate={setUser} />} />
        </Route>

        {/* Standalone Super Admin Portal */}
        <Route path="/admin" element={user?.role === "admin" ? <AdminLayout user={user} onLogout={() => { localStorage.clear(); setUser(null); }} /> : <Navigate to="/login" />}>
           <Route index element={<AdminDashboard />} />
           <Route path="shops" element={<AdminShops />} />
           <Route path="subscriptions" element={<AdminSubscriptions />} />
           <Route path="wallet" element={<AdminWallet />} />
           <Route path="transactions" element={<AdminTransactions />} />
           <Route path="logs" element={<div className="p-8 text-center text-slate-500">System Logs coming soon.</div>} />
           <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Catch-all: redirect unknown routes to login */}
        <Route path="*" element={<Navigate to={user ? (user.role === "admin" ? "/admin" : "/") : "/login"} />} />
      </Routes>
    </Router>
  );
}

