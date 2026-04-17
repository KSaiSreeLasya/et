import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

declare module 'express-session' {
  interface SessionData {
    user: any;
  }
}

const app = express();
const PORT = 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY). ' +
      'API routes that require Supabase will fail until .env is configured.'
  );
}

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null;

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(session({
  secret: 'taskflow-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Auth Middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session.user) return next();
  console.log(`[Auth] Unauthorized access attempt to ${req.url}. Session ID: ${req.sessionID}`);
  res.status(401).json({ error: 'Unauthorized' });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.session.user?.role === 'admin') return next();
  console.log(`[Auth] Forbidden access attempt by ${req.session.user?.email || 'unknown'}`);
  res.status(403).json({ error: 'Forbidden' });
};

// --- API ROUTES ---

async function ensureDefaultAdmin() {
  if (!supabase) return;
  try {
    console.log('[Supabase] Checking for default admin...');
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (existingError) {
      console.error('[Supabase] Failed checking admin user:', existingError.message);
      return;
    }

    if (existing && existing.length > 0) {
      console.log('[Supabase] Admin user already exists.');
      return;
    }

    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const { error: insertError } = await supabase.from('users').insert({
      name: 'System Admin',
      email: 'admin@taskflow.com',
      password: hashedPassword,
      role: 'admin',
    });

    if (insertError) {
      console.error('[Supabase] Failed seeding default admin:', insertError.message);
    } else {
      console.log('[Supabase] Default admin created: admin@taskflow.com / admin123');
    }
  } catch (e: any) {
    console.error('[Supabase] ensureDefaultAdmin unexpected error:', e?.message || e);
  }
}

app.get('/api/supabase/health', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({
      ok: false,
      error: 'Supabase is not configured on the server',
      missing: {
        SUPABASE_URL: !process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: !process.env.SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
  }

  const { error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
      hint:
        'If you see "relation \\"users\\" does not exist", create the tables in Supabase. If you see an RLS error, set SUPABASE_SERVICE_ROLE_KEY on the server or adjust policies.',
    });
  }
  res.json({ ok: true });
});

app.get('/api/supabase/debug-user', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end();
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });

  const email = String(req.query.email || '');
  if (!email) return res.status(400).json({ error: 'Missing email query param' });

  const { data: users, error } = await supabase.from('users').select('id, email, role, password, created_at').eq('email', email).limit(1);
  if (error) return res.status(500).json({ error: error.message });

  const u: any = users?.[0];
  if (!u) return res.json({ found: false });

  const pw: string = u.password || '';
  res.json({
    found: true,
    id: u.id,
    email: u.email,
    role: u.role,
    created_at: u.created_at,
    password: {
      length: pw.length,
      prefix: pw.slice(0, 10),
      looksLikeBcrypt: pw.startsWith('$2a$') || pw.startsWith('$2b$') || pw.startsWith('$2y$'),
    },
  });
});

app.post('/api/supabase/check-password', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end();
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const { data: users, error } = await supabase.from('users').select('password').eq('email', email).limit(1);
  if (error) return res.status(500).json({ error: error.message });

  const u: any = users?.[0];
  if (!u?.password) return res.json({ found: false, match: false });

  res.json({ found: true, match: bcrypt.compareSync(String(password), String(u.password)) });
});

app.post('/api/supabase/reset-password', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end();
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });

  const { email, newPassword } = req.body || {};
  if (!email || !newPassword) return res.status(400).json({ error: 'Missing email or newPassword' });

  const hashedPassword = bcrypt.hashSync(String(newPassword), 10);
  const { error } = await supabase.from('users').update({ password: hashedPassword }).eq('email', String(email));
  if (error) return res.status(500).json({ error: 'Failed to reset password', details: error.message });

  res.json({ success: true, hashLength: hashedPassword.length });
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured on the server' });
  }

  const { data: users, error } = await supabase.from('users').select('*').eq('email', email).limit(1);
  if (error) return res.status(500).json({ error: 'Failed to query users', details: error.message });

  const user: any = users?.[0];
  if (user && bcrypt.compareSync(password, user.password)) {
    const { password: _pw, ...userWithoutPassword } = user;
    req.session.user = userWithoutPassword;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session.user) res.json(req.session.user);
  else res.status(401).json({ error: 'Not logged in' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Users (Admin only)
app.get('/api/users', isAuthenticated, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });
  const { data, error } = await supabase.from('users').select('id, name, email, role, created_at').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Failed to load users', details: error.message });
  res.json(data || []);
});

app.post('/api/users', isAuthenticated, isAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashedPassword, role })
      .select('id, name, email, role, created_at')
      .single();

    if (error) {
      const msg = /duplicate key|unique/i.test(error.message) ? 'Email already exists' : 'Failed to create user';
      return res.status(400).json({ error: msg, details: error.message });
    }

    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to create user', details: e?.message || String(e) });
  }
});

app.patch('/api/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });
  const { name, email, password, role } = req.body;
  const userId = Number(req.params.id);

  try {
    const patch: any = { name, email, role };
    if (password) patch.password = bcrypt.hashSync(password, 10);

    const { error } = await supabase.from('users').update(patch).eq('id', userId);
    if (error) {
      const msg = /duplicate key|unique/i.test(error.message) ? 'Email already exists or invalid data' : 'Failed to update user';
      return res.status(400).json({ error: msg, details: error.message });
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to update user', details: e?.message || String(e) });
  }
});

app.delete('/api/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });
  const userId = Number(req.params.id);
  // Prevent deleting self
  if (userId === Number(req.session.user.id)) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) return res.status(500).json({ error: 'Failed to delete user', details: error.message });
  res.json({ success: true });
});

// Tasks
app.get('/api/tasks', isAuthenticated, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });
  const user = req.session.user;

  let query = supabase
    .from('tasks')
    .select('id, title, description, priority, status, deadline, assigned_to, created_by, created_at')
    .order('created_at', { ascending: false });

  if (user.role !== 'admin') {
    query = query.eq('assigned_to', Number(user.id));
  }

  const { data: tasks, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to load tasks', details: error.message });

  const assignedIds = Array.from(new Set((tasks || []).map(t => t.assigned_to).filter(Boolean)));
  let usersById = new Map<number, string>();
  if (assignedIds.length > 0) {
    const { data: assignees, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .in('id', assignedIds as any);
    if (!usersError && assignees) {
      usersById = new Map(assignees.map(u => [Number(u.id), u.name]));
    }
  }

  res.json(
    (tasks || []).map((t: any) => ({
      ...t,
      assigned_to_name: t.assigned_to ? usersById.get(Number(t.assigned_to)) : undefined,
    }))
  );
});

app.post('/api/tasks', isAuthenticated, isAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });
  const { title, description, priority, deadline, assigned_to } = req.body;
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      priority,
      deadline,
      assigned_to: assigned_to ? Number(assigned_to) : null,
      created_by: Number(req.session.user.id),
    })
    .select('id')
    .single();

  if (error) return res.status(400).json({ error: 'Failed to create task', details: error.message });
  res.json({ id: data?.id });
});

app.patch('/api/tasks/:id', isAuthenticated, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });
  const { status, description, title, priority, deadline, assigned_to } = req.body;
  const user = req.session.user;
  
  if (user.role === 'admin') {
    const { error } = await supabase
      .from('tasks')
      .update({
        title,
        description,
        priority,
        deadline,
        assigned_to: assigned_to ? Number(assigned_to) : null,
        status,
      })
      .eq('id', Number(req.params.id));
    if (error) return res.status(400).json({ error: 'Failed to update task', details: error.message });
  } else {
    // Employees can only update status
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', Number(req.params.id))
      .eq('assigned_to', Number(user.id));
    if (error) return res.status(400).json({ error: 'Failed to update task', details: error.message });
  }
  res.json({ success: true });
});

app.delete('/api/tasks/:id', isAuthenticated, isAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });
  const { error } = await supabase.from('tasks').delete().eq('id', Number(req.params.id));
  if (error) return res.status(500).json({ error: 'Failed to delete task', details: error.message });
  res.json({ success: true });
});

// Tickets
app.get('/api/tickets', isAuthenticated, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });
  const user = req.session.user;

  let query = supabase
    .from('tickets')
    .select('id, title, description, category, priority, status, raised_by, assigned_to, created_at')
    .order('created_at', { ascending: false });

  if (user.role !== 'admin') {
    query = query.eq('raised_by', Number(user.id));
  }

  const { data: tickets, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to load tickets', details: error.message });

  const raisedByIds = Array.from(new Set((tickets || []).map(t => t.raised_by).filter(Boolean)));
  let usersById = new Map<number, string>();
  if (raisedByIds.length > 0) {
    const { data: raisers } = await supabase.from('users').select('id, name').in('id', raisedByIds as any);
    if (raisers) usersById = new Map(raisers.map(u => [Number(u.id), u.name]));
  }

  res.json((tickets || []).map((t: any) => ({ ...t, raised_by_name: usersById.get(Number(t.raised_by)) })));
});

app.post('/api/tickets', isAuthenticated, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });
  const { title, description, category, priority } = req.body;
  const { data, error } = await supabase
    .from('tickets')
    .insert({ title, description, category, priority, raised_by: Number(req.session.user.id) })
    .select('id')
    .single();
  if (error) return res.status(400).json({ error: 'Failed to create ticket', details: error.message });
  res.json({ id: data?.id });
});

app.patch('/api/tickets/:id', isAuthenticated, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });
  const { status, assigned_to } = req.body;
  const user = req.session.user;
  
  if (user.role === 'admin') {
    const { error } = await supabase
      .from('tickets')
      .update({ status, assigned_to: assigned_to ? Number(assigned_to) : null })
      .eq('id', Number(req.params.id));
    if (error) return res.status(400).json({ error: 'Failed to update ticket', details: error.message });
  } else {
    res.status(403).json({ error: 'Only admins can update tickets' });
  }
  res.json({ success: true });
});

// Analytics (Admin only)
app.get('/api/analytics', isAuthenticated, isAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase is not configured on the server' });
  try {
    const [{ data: tasks, error: tasksError }, { data: tickets, error: ticketsError }, { data: employees, error: employeesError }] =
      await Promise.all([
        supabase.from('tasks').select('status, assigned_to'),
        supabase.from('tickets').select('status'),
        supabase.from('users').select('id, name, role').eq('role', 'employee'),
      ]);

    if (tasksError || ticketsError || employeesError) {
      return res.status(500).json({
        error: 'Internal Server Error',
        details: tasksError?.message || ticketsError?.message || employeesError?.message,
      });
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

    res.json({
      taskStats: Array.from(taskStatsMap.entries()).map(([status, count]) => ({ status, count })),
      ticketStats: Array.from(ticketStatsMap.entries()).map(([status, count]) => ({ status, count })),
      employeePerformance,
    });
  } catch (error: any) {
    console.error('[API] Analytics Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Global Error Handler]', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// --- VITE MIDDLEWARE ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server] Initializing Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware initialized.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

ensureDefaultAdmin().finally(() => startServer());
