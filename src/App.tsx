/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useLocation,
  useNavigate
} from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Ticket, 
  Users, 
  LogOut, 
  Plus, 
  Search, 
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  User as UserIcon,
  Briefcase,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from './lib/utils';
import { User, Task, Ticket as TicketType } from './types';

// --- COMPONENTS ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
      secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm',
      outline: 'bg-transparent text-indigo-600 border border-indigo-600 hover:bg-indigo-50',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    return (
      <button
        ref={ref}
        className={cn('inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none', variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50', className)}
      {...props}
    />
  )
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-rose-100 text-rose-800',
    info: 'bg-sky-100 text-sky-800',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant])}>
      {children}
    </span>
  );
};

const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden', className)} {...props}>
    {children}
  </div>
);

// --- PAGES ---

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [email, setEmail] = useState('admin@taskflow.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) onLogin(data);
      else setError(data.error);
    } catch (err) {
      setError('Failed to connect to server');
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4">
            <CheckSquare size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TaskFlow Pro</h1>
          <p className="text-gray-500 mt-2">Manage tasks and tickets with ease</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Default Admin: admin@taskflow.com / admin123
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

const Layout = ({ user, onLogout, children }: { user: User, onLogout: () => void, children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Tickets', path: '/tickets', icon: Ticket },
    ...(user.role === 'admin' ? [
      { label: 'Users', path: '/users', icon: Users },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <CheckSquare size={20} />
          </div>
          <span className="font-bold text-xl text-gray-900">TaskFlow</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                location.pathname === item.path 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-bottom border-gray-200 flex items-center justify-between px-8 md:hidden">
           <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <CheckSquare size={20} />
            </div>
            <span className="font-bold text-xl text-gray-900">TaskFlow</span>
          </div>
          <button onClick={onLogout} className="text-rose-600"><LogOut size={20}/></button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

const Dashboard = ({ user }: { user: User }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, ticketsRes] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/tickets')
        ]);
        const tasksData = await tasksRes.json();
        const ticketsData = await ticketsRes.json();
        
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      } catch (err) {
        console.error('Fetch error:', err);
        setTasks([]);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'Completed').length, icon: CheckSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Open Tickets', value: tickets.filter(t => t.status === 'Open').length, icon: Ticket, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed Tasks', value: tasks.filter(t => t.status === 'Completed').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Review', value: tickets.filter(t => t.status === 'In Progress').length, icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}</h1>
        <p className="text-gray-500">Here's what's happening with your projects today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.bg, stat.color)}>
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
            <Link to="/tasks" className="text-sm text-indigo-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  task.priority === 'High' ? 'bg-rose-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                )} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">Due {formatDate(task.deadline)}</p>
                </div>
                <Badge variant={task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'info' : 'default'}>
                  {task.status}
                </Badge>
              </div>
            ))}
            {tasks.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">No tasks found</div>}
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Recent Tickets</h2>
            <Link to="/tickets" className="text-sm text-indigo-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {tickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                  <Ticket size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                  <p className="text-xs text-gray-500">{ticket.category} • {formatDate(ticket.created_at)}</p>
                </div>
                <Badge variant={ticket.status === 'Closed' ? 'default' : ticket.status === 'Resolved' ? 'success' : 'warning'}>
                  {ticket.status}
                </Badge>
              </div>
            ))}
             {tickets.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">No tickets found</div>}
          </div>
        </Card>
      </div>
    </div>
  );
};

const TasksPage = ({ user }: { user: User }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', deadline: '', assigned_to: '' });

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setTasks([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTasks();
        if (user.role === 'admin') {
          const res = await fetch('/api/users');
          if (res.ok) {
            const allUsers = await res.json();
            setEmployees(Array.isArray(allUsers) ? allUsers.filter((u: User) => u.role === 'employee') : []);
          }
        }
      } catch (err) {
        console.error('Error fetching tasks/users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.role]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    });
    if (res.ok) {
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', priority: 'Medium', deadline: '', assigned_to: '' });
      fetchTasks();
    }
  };

  const handleStatusUpdate = async (taskId: number, newStatus: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchTasks();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500">Manage and track your project tasks.</p>
        </div>
        {user.role === 'admin' && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus size={18} />
            New Task
          </Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">{task.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'success'}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={task.status}
                      onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
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
                        {task.assigned_to_name?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm text-gray-700">{task.assigned_to_name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' && (
                        <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDeleteTask(task.id)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
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

      {/* New Task Modal */}
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
                <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
              </div>
              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <Input required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="Task title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Describe the task..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select 
                      className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newTask.priority}
                      onChange={e => setNewTask({...newTask, priority: e.target.value})}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <Input type="date" required value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select 
                    required
                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTask.assigned_to}
                    onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Task</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TicketsPage = ({ user }: { user: User }) => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', category: 'Technical', priority: 'Medium' });

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setTickets([]);
    }
  };

  useEffect(() => {
    fetchTickets().then(() => setLoading(false));
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    });
    if (res.ok) {
      setIsModalOpen(false);
      setNewTicket({ title: '', description: '', category: 'Technical', priority: 'Medium' });
      fetchTickets();
    }
  };

  const handleStatusUpdate = async (ticketId: number, newStatus: string) => {
    if (user.role !== 'admin') return;
    await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTickets();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-500">Raise and track support issues.</p>
        </div>
        {user.role === 'employee' && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus size={18} />
            Raise Ticket
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="p-6 hover:border-indigo-200 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                  <Ticket size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-gray-900">{ticket.title}</h3>
                    <Badge variant={ticket.status === 'Closed' ? 'default' : ticket.status === 'Resolved' ? 'success' : 'warning'}>
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><AlertCircle size={14}/> {ticket.priority} Priority</span>
                    <span className="flex items-center gap-1"><Briefcase size={14}/> {ticket.category}</span>
                    <span className="flex items-center gap-1"><UserIcon size={14}/> Raised by {ticket.raised_by_name}</span>
                    <span className="flex items-center gap-1"><Calendar size={14}/> {formatDate(ticket.created_at)}</span>
                  </div>
                </div>
              </div>
              {user.role === 'admin' && (
                <select 
                  value={ticket.status}
                  onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-indigo-500"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              )}
            </div>
          </Card>
        ))}
        {tickets.length === 0 && (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No tickets found.</p>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
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
                  <Input required value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} placeholder="Brief summary of the issue" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    className="flex min-h-[100px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTicket.description}
                    onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                    placeholder="Provide details about the issue..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select 
                      className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newTicket.category}
                      onChange={e => setNewTicket({...newTicket, category: e.target.value as any})}
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
                      onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Submit Ticket</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchUsers = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch('/api/users', { signal: controller.signal });
      if (res.status === 401) {
        window.location.href = '/';
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    fetchUsers().then(() => setLoading(false));
  }, []);

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'employee' });
    }
    setFormMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    setFormMessage(null);
    
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PATCH' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.status === 401) {
        window.location.href = '/';
        return;
      }

      const data = await res.json();
      
      if (res.ok) {
        setFormMessage({ type: 'success', text: `User ${editingUser ? 'updated' : 'created'} successfully!` });
        fetchUsers();
        setTimeout(() => {
          setIsModalOpen(false);
          setFormMessage(null);
        }, 1500);
      } else {
        setFormMessage({ type: 'error', text: data.error || 'Failed to save user' });
      }
    } catch (err) {
      setFormMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('Are you sure you want to remove this user?')) {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Create and manage system users and employees.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus size={18} />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => (
          <Card key={u.id} className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{u.name}</h3>
                <p className="text-sm text-gray-500 truncate">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <Badge variant={u.role === 'admin' ? 'info' : 'default'}>{u.role}</Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleOpenModal(u)}>
                  Edit
                </Button>
                {u.role !== 'admin' && (
                  <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => handleDeleteUser(u.id)}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-[101] my-8"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formMessage && (
                  <div className={cn(
                    "p-3 rounded-lg text-sm font-medium mb-4",
                    formMessage.type === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  )}>
                    {formMessage.text}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? 'New Password (leave blank to keep current)' : 'Initial Password'}
                  </label>
                  <Input type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select 
                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthCheck] Starting...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[AuthCheck] Timeout reached, aborting...');
      controller.abort();
    }, 5000);

    fetch('/api/auth/me', { signal: controller.signal })
      .then(res => {
        console.log('[AuthCheck] Response received:', res.status);
        return res.ok ? res.json() : null;
      })
      .then(data => {
        console.log('[AuthCheck] Data parsed:', data ? 'User found' : 'No user');
        setUser(data);
      })
      .catch(err => {
        console.error('[AuthCheck] Error:', err.name === 'AbortError' ? 'Timeout' : err.message);
        setUser(null);
      })
      .finally(() => {
        console.log('[AuthCheck] Finished, setting loading to false');
        setLoading(false);
        clearTimeout(timeoutId);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-6 p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 animate-pulse font-medium">Checking authentication...</p>
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
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/tasks" element={<TasksPage user={user} />} />
          <Route path="/tickets" element={<TicketsPage user={user} />} />
          {user.role === 'admin' && (
            <>
              <Route path="/users" element={<UsersPage />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
