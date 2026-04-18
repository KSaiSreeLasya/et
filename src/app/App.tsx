import React, { useEffect, useState } from "react";
import { HashRouter as Router, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./layout/AppLayout";
import { Button } from "../components/ui";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { TasksPage } from "../pages/TasksPage";
import { TicketsPage } from "../pages/TicketsPage";
import { UsersPage } from "../pages/UsersPage";
import { User } from "../types";
import { clientAuth } from "../lib/client-api";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For static site, check localStorage for user session
    const timeoutId = setTimeout(() => {
      const user = clientAuth.getCurrentUser();
      setUser(user);
      setLoading(false);
      clearTimeout(timeoutId);
    }, 500);
  }, []);

  const handleLogout = async () => {
    clientAuth.logout();
    setUser(null);
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-6 p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-500 animate-pulse font-medium">
            Checking authentication...
          </p>
        </div>

        <div className="flex flex-col items-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <p className="text-xs text-gray-400 max-w-xs text-center">
            If this takes too long, the server might be starting up or your session might have expired.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLoading(false)}>
              Skip Check
            </Button>
          </div>
        </div>
      </div>
    );

  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <Router>
      <AppLayout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<DashboardPage user={user} />} />
          <Route path="/tasks" element={<TasksPage user={user} />} />
          <Route path="/tickets" element={<TicketsPage user={user} />} />
          {user.role === "admin" && <Route path="/users" element={<UsersPage />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

