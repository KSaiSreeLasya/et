import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CheckSquare, Clock, MessageSquare, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Card } from "../components/ui";
import { cn, formatDate } from "../lib/utils";
import { clientTasks, clientTickets, clientComments } from "../lib/client-api";
import { Task, Ticket as TicketType, User } from "../types";

export function DashboardPage({ user }: { user: User }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestComment, setLatestComment] = useState<any>(null);
  const [taskComments, setTaskComments] = useState<{[key: number]: any}>({});

  const fetchData = useCallback(async () => {
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
  }, [user]);

  const fetchTaskComments = useCallback(async () => {
    try {
      const tasksData = await clientTasks.getAll(user);
      const commentsMap: {[key: number]: any} = {};
      
      for (const task of tasksData || []) {
        if (task.id) {
          const comments = await clientComments.getByTask(task.id, { id: 1, name: 'Admin', email: 'admin@axisogreen.in', role: 'admin', created_at: new Date().toISOString() });
          if (comments.length > 0) {
            commentsMap[task.id] = comments[comments.length - 1];
          }
        }
      }
      
      setTaskComments(commentsMap);
    } catch {
      setTaskComments({});
    }
  }, [user]);

  const fetchLatestComment = useCallback(async () => {
    try {
      // Get all tasks and tickets to find latest comments
      const [tasksData, ticketsData] = await Promise.all([
        clientTasks.getAll(user),
        clientTickets.getAll(user),
      ]);
      
      const allItems = [...(tasksData || []), ...(ticketsData || [])];
      let latestComment: any = null;
      let latestDate = new Date(0);
      
      for (const item of allItems) {
        if (item.id) {
          const comments = await clientComments.getByTask(item.id, { id: 1, name: 'Admin', email: 'admin@axisogreen.in', role: 'admin', created_at: new Date().toISOString() });
          if (comments.length > 0) {
            const comment = comments[comments.length - 1];
            if (new Date(comment.created_at) > latestDate) {
              latestDate = new Date(comment.created_at);
              latestComment = comment;
            }
          }
        }
      }
      
      setLatestComment(latestComment);
    } catch {
      setLatestComment(null);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    fetchLatestComment();
    fetchTaskComments();
  }, [fetchData, fetchLatestComment, fetchTaskComments]);

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

      {latestComment && (
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-white shadow-lg">
                <MessageSquare size={20} className="text-white" />
              </div>
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg text-gray-900">Latest Comment</h3>
                <Link
                  to="/tasks"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-700 hover:underline transition-colors"
                >
                  View all comments
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7 7s-1m0 0l-3 3m3 9a9 9 9l-3-3 9a9 9 9l-3-3m-6 0a6 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white shadow-xl">
                  <span className="text-lg font-bold">
                    {latestComment.user_name?.charAt(0) || "?"}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-xl p-4 shadow-sm border border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{latestComment.user_name || 'Unknown User'}</h4>
                    <Badge variant="default">
                      {formatDate(latestComment.created_at)}
                    </Badge>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{latestComment.content}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

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
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-2",
                      task.priority === "High"
                        ? "bg-rose-500"
                        : task.priority === "Medium"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {task.title}
                      </p>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Due:</span> {formatDate(task.deadline)}
                      </div>
                      <div>
                        <span className="font-medium">Assigned:</span> {task.assigned_to_name || 'Unassigned'}
                      </div>
                      <div>
                        <span className="font-medium">Action:</span> {task.status}
                      </div>
                    </div>
                    {taskComments[task.id] && (
                      <div className="mt-2 p-2 bg-indigo-50 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-indigo-700 mb-1">
                          <span className="font-medium">Latest Comment:</span>
                          <span>{formatDate(taskComments[task.id].created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-700">{taskComments[task.id].content}</p>
                      </div>
                    )}
                  </div>
                </div>
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

