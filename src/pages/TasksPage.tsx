import React, { useEffect, useState } from "react";
import { CheckSquare, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge, Button, Card, Input } from "../components/ui";
import { CommentsPanel } from "../components/comments/CommentsPanel";
import { cn, formatDate } from "../lib/utils";
import { clientTasks, clientUsers } from "../lib/client-api";
import { Task, User } from "../types";

export function TasksPage({ user }: { user: User }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
    deadline: "",
    assigned_to: "",
  });

  const fetchTasks = async () => {
    try {
      const data = await clientTasks.getAll(user);
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTasks();
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
    fetchData();
  }, [user.role]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await clientTasks.create(newTask as any, user);
    setIsModalOpen(false);
    setNewTask({
      title: "",
      description: "",
      priority: "Medium",
      deadline: "",
      assigned_to: "",
    });
    fetchTasks();
  };

  const handleStatusUpdate = async (taskId: number, newStatus: string) => {
    await clientTasks.update(taskId, { status: newStatus }, user);
    fetchTasks();
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await clientTasks.delete(taskId);
      fetchTasks();
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );

  const filtered = tasks.filter((t) => {
    const matchesQuery =
      !query ||
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(query.toLowerCase()) ||
      (t.assigned_to_name || "").toLowerCase().includes(query.toLowerCase());

    const matchesStatus = statusFilter === "all" ? true : t.status === statusFilter;
    const matchesPriority = priorityFilter === "all" ? true : t.priority === priorityFilter;
    const matchesAssignee =
      user.role !== "admin" || assigneeFilter === "all"
        ? true
        : String(t.assigned_to) === assigneeFilter;

    return matchesQuery && matchesStatus && matchesPriority && matchesAssignee;
  });

  const openDetails = async (taskId: number) => {
    setDetailsLoading(true);
    setDetailsTask(null);
    try {
      const tasks = await clientTasks.getAll(user);
      const t = tasks.find(task => task.id === taskId);
      if (t) {
        setDetailsTask(t);
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500">Manage and track your project tasks.</p>
        </div>
        {user.role === "admin" && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus size={18} />
            New Task
          </Button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." />
          <select
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          {user.role === "admin" ? (
            <select
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="all">All assignees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={String(emp.id)}>
                  {emp.name}
                </option>
              ))}
            </select>
          ) : (
            <div />
          )}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">
                      {task.description}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        task.priority === "High"
                          ? "error"
                          : task.priority === "Medium"
                            ? "warning"
                            : "success"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleStatusUpdate(task.id, e.target.value)
                      }
                      className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer font-medium text-gray-700"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(task.deadline)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                        {task.assigned_to_name?.charAt(0) || "?"}
                      </div>
                      <span className="text-sm text-gray-700">
                        {task.assigned_to_name || "Unassigned"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetails(task.id)}
                      >
                        View
                      </Button>
                      {user.role === "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-400">
                <CheckSquare size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
              <p className="text-gray-500">Get started by creating a new task.</p>
            </div>
          )}
        </div>
      </Card>

      <AnimatePresence>
        {(detailsLoading || detailsTask) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailsTask(null)}
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
                <Button variant="ghost" onClick={() => setDetailsTask(null)}>
                  Close
                </Button>
              </div>
              <div className="p-6 space-y-4">
                {detailsLoading && <div className="text-sm text-gray-500">Loading…</div>}
                {detailsTask && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
                      <Input
                        value={detailsTask.title}
                        onChange={(e) => setDetailsTask({ ...detailsTask, title: e.target.value })}
                        disabled={user.role !== "admin"}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                        value={detailsTask.description || ""}
                        onChange={(e) => setDetailsTask({ ...detailsTask, description: e.target.value })}
                        disabled={user.role !== "admin"}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                        <select
                          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
                          value={detailsTask.status}
                          onChange={(e) => setDetailsTask({ ...detailsTask, status: e.target.value as any })}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Priority</label>
                        <select
                          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm disabled:opacity-60"
                          value={detailsTask.priority}
                          onChange={(e) => setDetailsTask({ ...detailsTask, priority: e.target.value as any })}
                          disabled={user.role !== "admin"}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Deadline</label>
                        <Input
                          type="date"
                          value={(detailsTask.deadline || "").slice(0, 10)}
                          onChange={(e) => setDetailsTask({ ...detailsTask, deadline: e.target.value })}
                          disabled={user.role !== "admin"}
                        />
                      </div>
                    </div>
                    {user.role === "admin" && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Assignee</label>
                        <select
                          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
                          value={String(detailsTask.assigned_to || "")}
                          onChange={(e) => setDetailsTask({ ...detailsTask, assigned_to: Number(e.target.value) as any })}
                        >
                          <option value="">Unassigned</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={String(emp.id)}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        variant="secondary"
                        onClick={() => setDetailsTask(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!detailsTask) return;
                          await clientTasks.update(detailsTask.id, {
                            title: detailsTask.title,
                            description: detailsTask.description,
                            status: detailsTask.status,
                            priority: detailsTask.priority,
                            deadline: detailsTask.deadline,
                            assigned_to: detailsTask.assigned_to,
                          }, user);
                          setDetailsTask(null);
                          fetchTasks();
                        }}
                      >
                        Save
                      </Button>
                    </div>
                    <CommentsPanel taskId={detailsTask.id} />
                  </>
                )}
              </div>
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
                <h2 className="text-xl font-bold text-gray-900">
                  Create New Task
                </h2>
              </div>
              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <Input
                    required
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    placeholder="Describe the task..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask({ ...newTask, priority: e.target.value })
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <Input
                      type="date"
                      required
                      value={newTask.deadline}
                      onChange={(e) =>
                        setNewTask({ ...newTask, deadline: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To
                  </label>
                  <select
                    required
                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTask.assigned_to}
                    onChange={(e) =>
                      setNewTask({ ...newTask, assigned_to: e.target.value })
                    }
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Task</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

