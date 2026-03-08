import { useState, useEffect } from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  Outlet
} from "react-router-dom";
import { Sidebar, Navbar } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Cautelas from "./pages/Cautelas";
import Technicians from "./pages/Technicians";
import Keys from "./pages/Keys";
import Companies from "./pages/Companies";
import HistoryPage from "./pages/History";
import UsersPage from "./pages/Users";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast";

const PrivateRoute = () => {
  const token = localStorage.getItem("token");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!token) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
        <Navbar setIsOpen={setSidebarOpen} />
        <main className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cautelas" element={<Cautelas />} />
            <Route path="/tecnicos" element={<Technicians />} />
            <Route path="/chaves" element={<Keys />} />
            <Route path="/empresas" element={<Companies />} />
            <Route path="/historico" element={<HistoryPage />} />
            <Route path="/usuarios" element={<UsersPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}
