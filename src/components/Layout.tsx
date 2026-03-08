import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Key, 
  Users, 
  Building2, 
  ClipboardList, 
  History, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Shield
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/", roles: ['admin', 'usuario'] },
    { icon: ClipboardList, label: "Cautelas", path: "/cautelas", roles: ['admin', 'usuario'] },
    { icon: Key, label: "Chaves", path: "/chaves", roles: ['admin', 'usuario'] },
    { icon: Users, label: "Técnicos", path: "/tecnicos", roles: ['admin', 'usuario'] },
    { icon: Building2, label: "Empresas", path: "/empresas", roles: ['admin', 'usuario'] },
    { icon: History, label: "Histórico", path: "/historico", roles: ['admin', 'usuario'] },
    { icon: Shield, label: "Usuários", path: "/usuarios", roles: ['admin'] },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.perfil));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full bg-slate-900 text-white z-50 transition-all duration-300 ease-in-out flex flex-col",
        isOpen ? "w-64" : "w-0 lg:w-20 overflow-hidden"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className={cn("flex items-center gap-3", !isOpen && "lg:justify-center w-full")}>
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 text-white" />
            </div>
            {isOpen && <span className="font-bold text-xl tracking-tight">KeyGuard</span>}
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {filteredMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group",
                location.pathname === item.path 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <item.icon className={cn("w-6 h-6 shrink-0", location.pathname === item.path ? "text-white" : "group-hover:text-emerald-400")} />
              {isOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          {isOpen && (
            <div className="mb-4 px-2">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Usuário</p>
              <p className="text-sm font-medium truncate">{user.nome || "Usuário"}</p>
              <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">{user.perfil}</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-4 p-3 w-full rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all duration-200",
              !isOpen && "lg:justify-center"
            )}
          >
            <LogOut className="w-6 h-6 shrink-0" />
            {isOpen && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export function Navbar({ setIsOpen }: { setIsOpen: (open: boolean) => void }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
      >
        <Menu className="w-6 h-6 text-slate-600" />
      </button>
      
      <div className="hidden lg:block">
        <h2 className="text-lg font-semibold text-slate-800">Sistema de Controle Operacional</h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100 rounded-full relative">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
          <Users className="w-4 h-4 text-slate-600" />
        </div>
      </div>
    </header>
  );
}
