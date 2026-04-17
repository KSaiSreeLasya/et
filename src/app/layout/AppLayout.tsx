import React from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckSquare, LayoutDashboard, LogOut, Ticket, Users } from "lucide-react";
import { cn } from "../../lib/utils";
import { User } from "../../types";

const AXIVOLT_LOGO_PATH = "/axivolt-logo.png";

export function AppLayout({
  user,
  onLogout,
  children,
}: {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Tasks", path: "/tasks", icon: CheckSquare },
    { label: "Tickets", path: "/tickets", icon: Ticket },
    ...(user.role === "admin"
      ? [{ label: "Users", path: "/users", icon: Users }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <img src={AXIVOLT_LOGO_PATH} alt="AXIVOLT logo" className="h-10 w-auto object-contain" />
          <div className="leading-tight">
            <span className="block font-bold text-lg text-gray-900">AXIVOLT</span>
            <span className="block text-[10px] text-gray-500 uppercase tracking-wide">
              Green Energy Task Management
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 md:hidden">
          <div className="flex items-center gap-3">
            <img src={AXIVOLT_LOGO_PATH} alt="AXIVOLT logo" className="h-8 w-auto object-contain" />
            <span className="font-bold text-xl text-gray-900">AXIVOLT</span>
          </div>
          <button onClick={onLogout} className="text-rose-600">
            <LogOut size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}

