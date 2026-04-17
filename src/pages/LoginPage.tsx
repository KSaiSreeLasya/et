import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";
import { Button, Card, Input } from "../components/ui";
import { clientAuth } from "../lib/client-api";

const AXIVOLT_LOGO_PATH = "/axivolt-logo.png";

export function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("admin@axisogreen.in");
  const [password, setPassword] = useState("Axiso@2024");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await clientAuth.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <img
            src={AXIVOLT_LOGO_PATH}
            alt="AXIVOLT logo"
            className="mx-auto h-24 w-auto object-contain mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">AXIVOLT</h1>
          <p className="text-gray-500 mt-2">
            GREEN ENERGY TASK MANAGEMENT
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Default Admin: admin@axisogreen.in / Axiso@2024
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

