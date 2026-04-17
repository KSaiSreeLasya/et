import React, { useEffect, useState } from "react";
import { CheckCircle2, CheckSquare, Clock, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Card } from "../components/ui";
import { cn, formatDate } from "../lib/utils";
import { clientTasks, clientTickets } from "../lib/client-api";
import { Task, Ticket as TicketType, User } from "../types";

export function DashboardPage({ user }: { user: User }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksData, ticketsData] = await Promise.all([
          clientTasks.getAll(user),
          clientTickets.getAll(user),
        ]);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      } catch {
        setTasks([]);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      label: "Active Tasks",
      value: tasks.filter((t) => t.status !== "Completed").length,
      icon: CheckSquare,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Open Tickets",
      value: tickets.filter((t) => t.status === "Open").length,
      icon: Ticket,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Completed Tasks",
      value: tasks.filter((t) => t.status === "Completed").length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Pending Review",
      value: tickets.filter((t) => t.status === "In Progress").length,
      icon: Clock,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name}
        </h1>
        <p className="text-gray-500">
          Here's what's happening with your projects today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  stat.bg,
                  stat.color
                )}
              >
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Recent Tasks</h2>
            <Link
              to="/tasks"
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    task.priority === "High"
                      ? "bg-rose-500"
                      : task.priority === "Medium"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  )}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Due {formatDate(task.deadline)}
                  </p>
                </div>
                <Badge
                  variant={
                    task.status === "Completed"
                      ? "success"
                      : task.status === "In Progress"
                        ? "info"
                        : "default"
                  }
                >
                  {task.status}
                </Badge>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No tasks found
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Recent Tickets</h2>
            <Link
              to="/tickets"
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {tickets.slice(0, 5).map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                  <Ticket size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {ticket.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ticket.category} • {formatDate(ticket.created_at)}
                  </p>
                </div>
                <Badge
                  variant={
                    ticket.status === "Closed"
                      ? "default"
                      : ticket.status === "Resolved"
                        ? "success"
                        : "warning"
                  }
                >
                  {ticket.status}
                </Badge>
              </div>
            ))}
            {tickets.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No tickets found
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

