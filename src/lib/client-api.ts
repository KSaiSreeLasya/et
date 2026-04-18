import { supabase } from './supabase';
import { User } from '../types';

// Authentication
export const clientAuth = {
  login: async (email: string, password: string) => {
    // Temporary admin bypass for static site deployment
    if (email === 'admin@axisogreen.in' && password === 'Axiso@2024') {
      const adminUser = {
        id: 1,
        name: 'AXIVOLT Admin',
        email: 'admin@axisogreen.in',
        role: 'admin',
        created_at: new Date().toISOString()
      };
      localStorage.setItem('taskflow_user', JSON.stringify(adminUser));
      return adminUser;
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error) throw error;
    
    const user = users?.[0];
    if (user && user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('taskflow_user', JSON.stringify(userWithoutPassword));
      return userWithoutPassword;
    }
    throw new Error('Invalid credentials');
  },

  logout: () => {
    localStorage.removeItem('taskflow_user');
  },

  getCurrentUser: (): User | null => {
    try {
      const stored = localStorage.getItem('taskflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
};

// Tasks API
export const clientTasks = {
  getAll: async (user: User) => {
    let query = supabase
      .from('tasks')
      .select('id, title, description, priority, status, deadline, assigned_to, created_by, created_at, assigned_to_all')
      .order('created_at', { ascending: false });

    if (user.role !== 'admin') {
      query = query.or(`assigned_to.eq.${Number(user.id)},assigned_to_all.eq.true`);
    }

    const { data: tasks, error } = await query;
    if (error) throw error;

    // Get assigned user names
    const assignedIds = Array.from(new Set((tasks || []).map(t => t.assigned_to).filter(Boolean)));
    let usersById = new Map<number, string>();
    if (assignedIds.length > 0) {
      const { data: assignees } = await supabase
        .from('users')
        .select('id, name')
        .in('id', assignedIds as any);
      if (assignees) {
        usersById = new Map(assignees.map(u => [Number(u.id), u.name]));
      }
    }

    return (tasks || []).map((t: any) => ({
      ...t,
      assigned_to_name: t.assigned_to ? usersById.get(Number(t.assigned_to)) : undefined,
    }));
  },

  create: async (task: any, user: User) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        created_by: Number(user.id),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Task creation error:', error);
      throw error;
    }
    return { id: data?.id };
  },

  update: async (id: number, updates: any, user: User) => {
    let patch: any = {};
    
    if (user.role === 'admin') {
      // Admin can update all fields
      if (typeof updates.title !== 'undefined') patch.title = updates.title;
      if (typeof updates.description !== 'undefined') patch.description = updates.description;
      if (typeof updates.priority !== 'undefined') patch.priority = updates.priority;
      if (typeof updates.deadline !== 'undefined') patch.deadline = updates.deadline;
      if (typeof updates.status !== 'undefined') patch.status = updates.status;
      if (typeof updates.assigned_to !== 'undefined') {
        // Handle "All Employees" assignment
        if (updates.assigned_to === 0) {
          // For "All Employees", set assigned_to to null and assigned_to_all to true
          patch.assigned_to = null;
          patch.assigned_to_all = true;
        } else {
          patch.assigned_to = updates.assigned_to ? Number(updates.assigned_to) : null;
          patch.assigned_to_all = false;
        }
      }
      if (typeof updates.assigned_to_all !== 'undefined') {
        patch.assigned_to_all = updates.assigned_to_all;
      }
    } else {
      // Employees can only update status
      patch.status = updates.status;
    }

    const { error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  delete: async (id: number) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }
};

// Tickets API
export const clientTickets = {
  getAll: async (user: User) => {
    let query = supabase
      .from('tickets')
      .select('id, title, description, category, priority, status, raised_by, assigned_to, created_at')
      .order('created_at', { ascending: false });

    if (user.role !== 'admin') {
      query = query.eq('raised_by', Number(user.id));
    }

    const { data: tickets, error } = await query;
    if (error) throw error;

    const raisedByIds = Array.from(new Set((tickets || []).map(t => t.raised_by).filter(Boolean)));
    let usersById = new Map<number, string>();
    if (raisedByIds.length > 0) {
      const { data: raisers } = await supabase.from('users').select('id, name').in('id', raisedByIds as any);
      if (raisers) usersById = new Map(raisers.map(u => [Number(u.id), u.name]));
    }

    return (tickets || []).map((t: any) => ({ ...t, raised_by_name: usersById.get(Number(t.raised_by)) }));
  },

  create: async (ticket: any, user: User) => {
    const { data, error } = await supabase
      .from('tickets')
      .insert({ ...ticket, raised_by: Number(user.id) })
      .select('id')
      .single();

    if (error) throw error;
    return { id: data?.id };
  },

  update: async (id: number, updates: any, user: User) => {
    if (user.role !== 'admin') {
      throw new Error('Only admins can update tickets');
    }

    const patch: any = {};
    if (typeof updates.status !== 'undefined') patch.status = updates.status;
    if (typeof updates.assigned_to !== 'undefined') {
      patch.assigned_to = updates.assigned_to ? Number(updates.assigned_to) : null;
    }

    const { error } = await supabase
      .from('tickets')
      .update(patch)
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }
};

// Users API (Admin only)
export const clientUsers = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  create: async (user: any) => {
    const hashedPassword = user.password; // In production, hash this properly
    const { data, error } = await supabase
      .from('users')
      .insert({ ...user, password: hashedPassword })
      .select('id, name, email, role, created_at')
      .single();

    if (error) {
      const msg = /duplicate key|unique/i.test(error.message) ? 'Email already exists' : 'Failed to create user';
      throw new Error(msg);
    }

    return data;
  },

  update: async (id: number, updates: any) => {
    const patch: any = { ...updates };
    if (updates.password) {
      patch.password = updates.password; // In production, hash this properly
    }

    const { error } = await supabase.from('users').update(patch).eq('id', id);
    if (error) {
      const msg = /duplicate key|unique/i.test(error.message) ? 'Email already exists or invalid data' : 'Failed to update user';
      throw new Error(msg);
    }
    return { success: true };
  },

  delete: async (id: number, currentUserId: number) => {
    if (id === currentUserId) {
      throw new Error('Cannot delete your own account');
    }
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }
};

// Comments API
export const clientComments = {
  getByTask: async (taskId: number, user: User) => {
    // Check if user has access to this task
    const { data: task } = await supabase
      .from('tasks')
      .select('id, assigned_to')
      .eq('id', taskId)
      .single();

    if (!task) throw new Error('Task not found');
    if (user.role !== 'admin' && Number(task.assigned_to) !== Number(user.id)) {
      throw new Error('Forbidden');
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select('id, task_id, ticket_id, user_id, content, created_at')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get user names
    const userIds = Array.from(new Set((comments || []).map((c: any) => c.user_id).filter(Boolean)));
    let usersById = new Map<number, string>();
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, name').in('id', userIds as any);
      if (users) usersById = new Map(users.map((u: any) => [Number(u.id), u.name]));
    }

    return (comments || []).map((c: any) => ({ ...c, user_name: usersById.get(Number(c.user_id)) }));
  },

  getByTicket: async (ticketId: number, user: User) => {
    // Check if user has access to this ticket
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, raised_by')
      .eq('id', ticketId)
      .single();

    if (!ticket) throw new Error('Ticket not found');
    if (user.role !== 'admin' && Number(ticket.raised_by) !== Number(user.id)) {
      throw new Error('Forbidden');
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select('id, task_id, ticket_id, user_id, content, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get user names
    const userIds = Array.from(new Set((comments || []).map((c: any) => c.user_id).filter(Boolean)));
    let usersById = new Map<number, string>();
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, name').in('id', userIds as any);
      if (users) usersById = new Map(users.map((u: any) => [Number(u.id), u.name]));
    }

    return (comments || []).map((c: any) => ({ ...c, user_name: usersById.get(Number(c.user_id)) }));
  },

  create: async (comment: any, user: User) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        ...comment,
        task_id: comment.task_id ? Number(comment.task_id) : null,
        ticket_id: comment.ticket_id ? Number(comment.ticket_id) : null,
        user_id: Number(user.id),
        content: String(comment.content).trim(),
      })
      .select('id, task_id, ticket_id, user_id, content, created_at')
      .single();

    if (error) throw error;

    // Attach user name
    const { data: u } = await supabase.from('users').select('name').eq('id', Number(user.id)).single();
    return { ...data, user_name: u?.name };
  }
};

// Analytics API (Admin only)
export const clientAnalytics = {
  get: async () => {
    const [{ data: tasks, error: tasksError }, { data: tickets, error: ticketsError }, { data: employees, error: employeesError }] =
      await Promise.all([
        supabase.from('tasks').select('status, assigned_to'),
        supabase.from('tickets').select('status'),
        supabase.from('users').select('id, name, role').eq('role', 'employee'),
      ]);

    if (tasksError || ticketsError || employeesError) {
      throw new Error('Failed to load analytics data');
    }

    const taskStatsMap = new Map<string, number>();
    for (const t of tasks || []) taskStatsMap.set(t.status, (taskStatsMap.get(t.status) || 0) + 1);
    const ticketStatsMap = new Map<string, number>();
    for (const t of tickets || []) ticketStatsMap.set(t.status, (ticketStatsMap.get(t.status) || 0) + 1);

    const completedCounts = new Map<number, number>();
    for (const t of tasks || []) {
      if (t.status === 'Completed' && t.assigned_to) {
        const id = Number(t.assigned_to);
        completedCounts.set(id, (completedCounts.get(id) || 0) + 1);
      }
    }

    const employeePerformance =
      (employees || []).map((u: any) => ({
        name: u.name,
        completed_tasks: completedCounts.get(Number(u.id)) || 0,
      })) ?? [];

    return {
      taskStats: Array.from(taskStatsMap.entries()).map(([status, count]) => ({ status, count })),
      ticketStats: Array.from(ticketStatsMap.entries()).map(([status, count]) => ({ status, count })),
      employeePerformance,
    };
  }
};
