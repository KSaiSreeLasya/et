import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Briefcase, Calendar, Plus, Ticket, User as UserIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge, Button, Card, Input } from "../components/ui";
import { formatDate } from "../lib/utils";
import { clientTasks, clientTickets, clientUsers } from "../lib/client-api";
import { Ticket as TicketType, User } from "../types";

export function TicketsPage({ user }: { user: User }) {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [triageMode, setTriageMode] = useState(user.role === "admin");
  const [createFromTicket, setCreateFromTicket] = useState<TicketType | null>(null);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "Technical",
    priority: "Medium",
  });
  const [newTaskFromTicket, setNewTaskFromTicket] = useState({
    title: "",
    description: "",
    priority: "Medium",
    deadline: "",
    assigned_to: "",
  });

  const fetchTickets = async () => {
    try {
      const data = await clientTickets.getAll(user);
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setTickets([]);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        await fetchTickets();
        if (user.role === "admin") {
          const allUsers = await clientUsers.getAll();
          setEmployees(
            Array.isArray(allUsers)
              ? allUsers.filter((u: User) => u.role === "employee")
              : []
          );
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user.role]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesQuery =
        !query ||
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(query.toLowerCase()) ||
        (t.raised_by_name || "").toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : t.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [tickets, query, statusFilter]);

  const byStatus = useMemo(() => {
    const groups: Record<string, TicketType[]> = {
      Open: [],
      "In Progress": [],
      Resolved: [],
      Closed: [],
    };
    for (const t of filteredTickets) groups[t.status]?.push(t);
    return groups;
  }, [filteredTickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    await clientTickets.create(newTicket as any, user);
    setIsModalOpen(false);
    setNewTicket({ title: "", description: "", category: "Technical", priority: "Medium" });
    fetchTickets();
  };

  const handleStatusUpdate = async (ticketId: number, status: string) => {
    if (user.role !== "admin") return;
    await clientTickets.update(ticketId, { status: status as any }, user);
    fetchTickets();
  };

  const handleAssignUpdate = async (ticketId: number, assigned_to: string) => {
    if (user.role !== "admin") return;
    await clientTickets.update(ticketId, { assigned_to: assigned_to ? Number(assigned_to) : null }, user);
    fetchTickets();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-500">Raise and track support issues.</p>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "admin" && (
            <Button
              variant="outline"
              onClick={() => setTriageMode((v) => !v)}
            >
              {triageMode ? "List view" : "Triage view"}
            </Button>
          )}
          {user.role === "employee" && (
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus size={18} />
              Raise Ticket
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets..." />
          <select
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <div />
        </div>
      </div>

      {user.role === "admin" && triageMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {(["Open", "In Progress", "Resolved", "Closed"] as const).map((col) => (
            <div key={col} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="font-semibold text-gray-900">{col}</div>
                <div className="text-xs text-gray-500">{byStatus[col].length}</div>
              </div>
              <div className="p-3 space-y-3">
                {byStatus[col].map((t) => (
                  <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-3 hover:border-indigo-200 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-sm text-gray-900">{t.title}</div>
                      <Badge variant={t.status === "Closed" ? "default" : t.status === "Resolved" ? "success" : "warning"}>
                        {t.priority}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t.category} • {formatDate(t.created_at)}
                    </div>
                    <div className="mt-3 space-y-2">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusUpdate(t.id, e.target.value)}
                        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                      <select
                        value={t.assigned_to ? String(t.assigned_to) : ""}
                        onChange={(e) => handleAssignUpdate(t.id, e.target.value)}
                        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={String(emp.id)}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setCreateFromTicket(t);
                          setNewTaskFromTicket({
                            title: t.title,
                            description: t.description || "",
                            priority: "Medium",
                            deadline: "",
                            assigned_to: t.assigned_to ? String(t.assigned_to) : "",
                          });
                        }}
                      >
                        Create task from ticket
                      </Button>
                    </div>
                  </div>
                ))}
                {byStatus[col].length === 0 && (
                  <div className="text-xs text-gray-500 text-center py-6">No tickets</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTickets.map((t) => (
            <Card key={t.id} className="p-6 hover:border-indigo-200 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <Ticket size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900">{t.title}</h3>
                      <Badge variant={t.status === "Closed" ? "default" : t.status === "Resolved" ? "success" : "warning"}>
                        {t.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{t.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><AlertCircle size={14} /> {t.priority} Priority</span>
                      <span className="flex items-center gap-1"><Briefcase size={14} /> {t.category}</span>
                      <span className="flex items-center gap-1"><UserIcon size={14} /> Raised by {t.raised_by_name}</span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(t.created_at)}</span>
                    </div>
                  </div>
                </div>
                {user.role === "admin" && (
                  <div className="flex flex-col gap-2 min-w-[220px]">
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusUpdate(t.id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-indigo-500"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <select
                      value={t.assigned_to ? String(t.assigned_to) : ""}
                      onChange={(e) => handleAssignUpdate(t.id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-indigo-500"
                    >
                      <option value="">Unassigned</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={String(emp.id)}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCreateFromTicket(t);
                        setNewTaskFromTicket({
                          title: t.title,
                          description: t.description || "",
                          priority: "Medium",
                          deadline: "",
                          assigned_to: t.assigned_to ? String(t.assigned_to) : "",
                        });
                      }}
                    >
                      Create task
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
          {filteredTickets.length === 0 && (
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">No tickets found.</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {createFromTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateFromTicket(null)}
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Create Task</h2>
                <p className="text-sm text-gray-500 mt-1">From ticket: {createFromTicket.title}</p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await clientTasks.create(newTaskFromTicket as any, user);
                  setCreateFromTicket(null);
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <Input value={newTaskFromTicket.title} onChange={(e) => setNewTaskFromTicket({ ...newTaskFromTicket, title: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTaskFromTicket.description}
                    onChange={(e) => setNewTaskFromTicket({ ...newTaskFromTicket, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newTaskFromTicket.priority}
                      onChange={(e) => setNewTaskFromTicket({ ...newTaskFromTicket, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <Input type="date" required value={newTaskFromTicket.deadline} onChange={(e) => setNewTaskFromTicket({ ...newTaskFromTicket, deadline: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select
                    required
                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTaskFromTicket.assigned_to}
                    onChange={(e) => setNewTaskFromTicket({ ...newTaskFromTicket, assigned_to: e.target.value })}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={String(emp.id)}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={() => setCreateFromTicket(null)}>Cancel</Button>
                  <Button type="submit">Create Task</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Raise Support Ticket</h2>
              </div>
              <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
                  <Input required value={newTicket.title} onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    >
                      <option value="Technical">Technical</option>
                      <option value="HR">HR</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Ticket</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

