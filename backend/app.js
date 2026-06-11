const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// ──────────────────────────────────────────────
// Detect if running on Vercel (serverless)
// ──────────────────────────────────────────────
const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL ? '/tmp' : __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// ──────────────────────────────────────────────
// Express App Setup
// ──────────────────────────────────────────────
const app = express();
const JWT_SECRET = process.env.JWT_SECRET;

// Validate JWT_SECRET is set — crash early instead of at runtime
if (!JWT_SECRET) {
  const errMsg = 'WARN: JWT_SECRET environment variable is missing. ' +
    'Set it in your .env file (local) or Vercel Environment Variables (production). ' +
    'Login will not work until this is configured.';
  console.error(errMsg);
}

// ──────────────────────────────────────────────
// CORS — allow known origins + dynamic production domains
// ──────────────────────────────────────────────
const corsOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

// Dynamically allow any Vercel deployment domain in production
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    // Check against known origins list
    if (corsOrigins.includes(origin)) return callback(null, true);
    // Allow any *.vercel.app domain
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow localhost in development
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// ──────────────────────────────────────────────
// Vercel route prefix handler
// ──────────────────────────────────────────────
// Vercel's experimentalServices routes /_/backend/* to this serverless function.
// The request may arrive with /_/backend still in the path.
// This middleware strips the prefix so Express routes (/api/auth/login) match.
const VERCEL_ROUTE_PREFIX = '/_/backend';
app.use((req, res, next) => {
  if (req.path.startsWith(VERCEL_ROUTE_PREFIX)) {
    req.url = req.url.replace(VERCEL_ROUTE_PREFIX, '');
    if (req.url === '') req.url = '/';
  }
  next();
});

// Serve uploaded files (only works for persistent storage in dev)
const uploadsDir = IS_VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!IS_VERCEL) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// ──────────────────────────────────────────────
// Data persistence helpers
// ──────────────────────────────────────────────
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (err) {
      console.error('Warning: Could not parse data.json, starting fresh:', err.message);
    }
  }
  return { users: [], issues: [], notifications: [], categories: [], permissions: {}, workers: [], websiteIssues: [] };
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users, issues, notifications, categories, permissions, workers, websiteIssues }, null, 2));
  } catch (err) {
    console.error('Warning: Could not save data.json:', err.message);
  }
}

// ──────────────────────────────────────────────
// In-memory data store — loaded on first invocation
// ──────────────────────────────────────────────
let data = loadData();
let users = data.users || [];
let issues = data.issues || [];
let notifications = data.notifications || [];
let categories = data.categories || [];
let permissions = data.permissions || {};
let workers = data.workers || [];
let websiteIssues = data.websiteIssues || [];

// ──────────────────────────────────────────────
// Seed default data if empty (SYNCHRONOUS — no async/await race condition)
// bcrypt hashes are pre-computed so this runs instantly at module load.
// ──────────────────────────────────────────────
function seedDefaults() {
  if (users.length === 0) {
    // Pre-hashed bcrypt passwords (salt rounds = 10) for default accounts:
    // admin123, supervisor123, official123, user123
    const defaultUsers = [
      { email: 'admin@example.com', password: '$2a$10$WMq2QOjwBRGb6.4CBYeP2Oy4TvTYMWLx9kn2Q6z/wJOLUP8k.gES2', name: 'System Admin', role: 'ADMIN' },
      { email: 'supervisor@example.com', password: '$2a$10$B6sGZbgieDLDetM6vnn9Rub0OI4l9cSwoGTNkoP7wwhLApaPTyWYK', name: 'Jane Supervisor', role: 'SUPERVISOR' },
      { email: 'official@example.com', password: '$2a$10$m8MnJMM9nuDeov3Jbv/j8.krHGLWRgn6pL4wZ/dvhT.lOUG6Cclom', name: 'John Official', role: 'OFFICIAL' },
      { email: 'user@example.com', password: '$2a$10$3a9cO5unBfi4xFXsCVirMOYgUVp/rdGJAc6xFJblhhm0yYlnThTC2', name: 'Regular User', role: 'USER' },
    ];
    for (const u of defaultUsers) {
      users.push({
        id: uuidv4(),
        email: u.email,
        password: u.password,
        name: u.name,
        role: u.role,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    }
    console.log('Seeded ' + defaultUsers.length + ' default users (synchronous)');
  }

  if (categories.length === 0) {
    categories.push(
      { id: 'wifi', name: 'Wi-Fi', value: 'WIFI' },
      { id: 'electricity', name: 'Electricity', value: 'ELECTRICITY' },
      { id: 'waste', name: 'Waste Management', value: 'WASTE_MANAGEMENT' },
      { id: 'water', name: 'Water', value: 'WATER' },
      { id: 'hostel', name: 'Hostel', value: 'HOSTEL' },
      { id: 'furniture', name: 'Furniture', value: 'FURNITURE' },
      { id: 'systems', name: 'Systems', value: 'SYSTEMS' }
    );
  }

  if (Object.keys(permissions).length === 0) {
    permissions = {
      USER: { canReport: true, canViewOwn: true },
      SUPERVISOR: { canReport: true, canViewAll: true, canAssign: true, canChangeStatus: true },
      OFFICIAL: { canViewAll: true, canViewReports: true, canViewAnalytics: true },
      ADMIN: { canReport: true, canViewAll: true, canAssign: true, canChangeStatus: true, canPrioritize: true, canManageUsers: true, canManageCategories: true, canManagePermissions: true, canViewReports: true, canViewAnalytics: true }
    };
  }

  if (workers.length === 0) {
    workers.push(
      { id: uuidv4(), name: 'Rahul', role: 'Electrician', department: 'Electrical', phone: '9876543210', availability: 'Available', status: 'ACTIVE', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Sasi', role: 'Cleaner', department: 'Housekeeping', phone: '9876543211', availability: 'Available', status: 'ACTIVE', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Jai', role: 'IT Support', department: 'IT', phone: '9876543212', availability: 'Available', status: 'ACTIVE', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Ram', role: 'Carpenter', department: 'Maintenance', phone: '9876543213', availability: 'Available', status: 'ACTIVE', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Arjun', role: 'Plumber', department: 'Plumbing', phone: '9876543214', availability: 'Available', status: 'ACTIVE', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Kiran', role: 'Gardener', department: 'Landscaping', phone: '9876543215', availability: 'Available', status: 'ACTIVE', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Naveen', role: 'Security', department: 'Security', phone: '9876543216', availability: 'Available', status: 'ACTIVE', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Akhil', role: 'Maintenance', department: 'Maintenance', phone: '9876543217', availability: 'Available', status: 'ACTIVE', createdAt: new Date().toISOString() }
    );
  }

  if (!IS_VERCEL) {
    saveData();
  }
}

// Run seeding synchronously — data will be ready before any request is handled
seedDefaults();

// ──────────────────────────────────────────────
// Multer — use /tmp on Vercel, local uploads/ otherwise
// ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

function findAssignee(id) {
  return users.find((u) => u.id === id) || workers.find((w) => w.id === id) || null;
}

// ──────────────────────────────────────────────
// Auth Routes
// ──────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'USER' } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
    if (users.find((u) => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
    const user = {
      id: uuidv4(),
      email,
      password: await bcrypt.hash(password, 10),
      name,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveData();
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Double-check data is loaded (defensive — handles edge case on cold start)
    if (users.length === 0) {
      // Re-initialize from file if available, or reseed
      const reloaded = loadData();
      if (reloaded.users && reloaded.users.length > 0) {
        users = reloaded.users;
        issues = reloaded.issues;
        notifications = reloaded.notifications;
        categories = reloaded.categories;
        permissions = reloaded.permissions;
        workers = reloaded.workers;
        websiteIssues = reloaded.websiteIssues;
      } else {
        seedDefaults();
      }
    }

    const user = users.find((u) => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Account deactivated. Contact admin.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(sanitizeUser(user));
});

// ──────────────────────────────────────────────
// Issues Routes
// ──────────────────────────────────────────────
app.post('/api/issues', authenticate, upload.array('attachments', 5), (req, res) => {
  try {
    const { title, description, category, location, priority, isAnonymous } = req.body;
    if (!title || !description || !category || !location || !priority) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const issue = {
      id: uuidv4(),
      title,
      description,
      category,
      location,
      priority,
      status: 'PENDING',
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      reporterId: req.userId,
      assigneeId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: (req.files || []).map((f) => ({
        id: uuidv4(),
        filename: f.originalname,
        filepath: `/uploads/${f.filename}`,
        mimetype: f.mimetype,
      })),
    };
    issues.push(issue);

    const supervisors = users.filter((u) => u.role === 'SUPERVISOR');
    supervisors.forEach((s) => {
      notifications.push({
        id: uuidv4(),
        message: `New issue reported: ${title}`,
        userId: s.id,
        issueId: issue.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });
    saveData();

    const reporter = users.find((u) => u.id === issue.reporterId);
    let responseReporter = reporter ? sanitizeUser(reporter) : null;
    if (issue.isAnonymous && req.userRole !== 'ADMIN') {
      responseReporter = { id: 'anonymous', name: 'Anonymous' };
    }
    const response = { ...issue, reporter: responseReporter };
    res.status(201).json(response);
  } catch (err) {
    console.error('Create issue error:', err);
    res.status(500).json({ error: 'Failed to create issue: ' + err.message });
  }
});

app.get('/api/issues', authenticate, (req, res) => {
  try {
    const { status, category, priority, search } = req.query;
    let result = issues;
    if (req.userRole === 'USER') result = result.filter((i) => i.reporterId === req.userId);
    if (status) result = result.filter((i) => i.status === status);
    if (category) result = result.filter((i) => i.category === category);
    if (priority) result = result.filter((i) => i.priority === priority);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    }
    const mapped = result.map((issue) => {
      const reporter = users.find((u) => u.id === issue.reporterId);
      const assignee = issue.assigneeId ? findAssignee(issue.assigneeId) : null;
      let outReporter = reporter ? sanitizeUser(reporter) : null;
      if (issue.isAnonymous && req.userRole !== 'ADMIN') {
        outReporter = { id: 'anonymous', name: 'Anonymous' };
      }
      const out = { ...issue, reporter: outReporter, assignee: assignee ? sanitizeUser(assignee) : null };
      return out;
    });
    res.json(mapped);
  } catch (err) {
    console.error('List issues error:', err);
    res.status(500).json({ error: 'Failed to list issues' });
  }
});

app.get('/api/issues/:id', authenticate, (req, res) => {
  try {
    const issue = issues.find((i) => i.id === req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    if (req.userRole === 'USER' && issue.reporterId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const reporter = users.find((u) => u.id === issue.reporterId);
    const assignee = issue.assigneeId ? findAssignee(issue.assigneeId) : null;
    let outReporter = reporter ? sanitizeUser(reporter) : null;
    if (issue.isAnonymous && req.userRole !== 'ADMIN') {
      outReporter = { id: 'anonymous', name: 'Anonymous' };
    }
    const out = { ...issue, reporter: outReporter, assignee: assignee ? sanitizeUser(assignee) : null };
    res.json(out);
  } catch (err) {
    console.error('Get issue error:', err);
    res.status(500).json({ error: 'Failed to get issue' });
  }
});

app.delete('/api/issues/:id', authenticate, authorize('ADMIN'), (req, res) => {
  try {
    const idx = issues.findIndex((i) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Issue not found' });
    issues.splice(idx, 1);
    saveData();
    res.json({ success: true });
  } catch (err) {
    console.error('Delete issue error:', err);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

app.patch('/api/issues/:id', authenticate, (req, res) => {
  try {
    const issue = issues.find((i) => i.id === req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    const { status, assigneeId, priority } = req.body;
    if (status) {
      if (req.userRole === 'USER') return res.status(403).json({ error: 'Users cannot change status' });
      if (req.userRole === 'OFFICIAL') return res.status(403).json({ error: 'Officials have read-only access' });
      if (issue.status !== status) {
        issue.status = status;
        issue.updatedAt = new Date().toISOString();
        notifications.push({
          id: uuidv4(),
          message: `Issue "${issue.title}" is now ${status}`,
          userId: issue.reporterId,
          issueId: issue.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
    if (priority) {
      if (req.userRole === 'USER') return res.status(403).json({ error: 'Users cannot change priority' });
      if (req.userRole === 'OFFICIAL') return res.status(403).json({ error: 'Officials have read-only access' });
      if (req.userRole === 'SUPERVISOR') return res.status(403).json({ error: 'Supervisors cannot change priority' });
      issue.priority = priority;
      issue.updatedAt = new Date().toISOString();
    }
    if (assigneeId !== undefined) {
      if (req.userRole === 'USER') return res.status(403).json({ error: 'Users cannot assign issues' });
      if (req.userRole === 'OFFICIAL') return res.status(403).json({ error: 'Officials have read-only access' });
      issue.assigneeId = assigneeId || null;
      issue.updatedAt = new Date().toISOString();
      const assignee = assigneeId ? findAssignee(assigneeId) : null;
      if (assignee && users.find((u) => u.id === assigneeId)) {
        notifications.push({
          id: uuidv4(),
          message: `You have been assigned to issue: ${issue.title}`,
          userId: assignee.id,
          issueId: issue.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
    saveData();
    const reporter = users.find((u) => u.id === issue.reporterId);
    const assignee = issue.assigneeId ? findAssignee(issue.assigneeId) : null;
    let outReporter = reporter ? sanitizeUser(reporter) : null;
    if (issue.isAnonymous && req.userRole !== 'ADMIN') {
      outReporter = { id: 'anonymous', name: 'Anonymous' };
    }
    const out = { ...issue, reporter: outReporter, assignee: assignee ? sanitizeUser(assignee) : null };
    res.json(out);
  } catch (err) {
    console.error('Update issue error:', err);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────
app.get('/api/notifications', authenticate, (req, res) => {
  try {
    const notifs = notifications
      .filter((n) => n.userId === req.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50)
      .map((n) => {
        const issue = issues.find((i) => i.id === n.issueId);
        return { ...n, issue: issue ? { id: issue.id, title: issue.title } : null };
      });
    res.json(notifs);
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

app.patch('/api/notifications/:id/read', authenticate, (req, res) => {
  try {
    const n = notifications.find((x) => x.id === req.params.id && x.userId === req.userId);
    if (n) { n.isRead = true; saveData(); }
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// ──────────────────────────────────────────────
// Workers
// ──────────────────────────────────────────────
app.get('/api/workers', authenticate, authorize('SUPERVISOR', 'ADMIN'), (req, res) => {
  try { res.json(workers.filter((w) => w.status === 'ACTIVE')); } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/workers/all', authenticate, authorize('ADMIN'), (req, res) => {
  try { res.json(workers); } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/workers', authenticate, authorize('ADMIN'), (req, res) => {
  try {
    const { name, role, department, phone, availability, status } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'Name and role are required' });
    const worker = { id: uuidv4(), name, role, department: department || '', phone: phone || '', availability: availability || 'Available', status: status || 'ACTIVE', createdAt: new Date().toISOString() };
    workers.push(worker);
    saveData();
    res.status(201).json(worker);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.patch('/api/workers/:id', authenticate, authorize('ADMIN'), (req, res) => {
  try {
    const worker = workers.find((w) => w.id === req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    Object.assign(worker, req.body, { id: worker.id, createdAt: worker.createdAt });
    saveData();
    res.json(worker);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.delete('/api/workers/:id', authenticate, authorize('ADMIN'), (req, res) => {
  try {
    const idx = workers.findIndex((w) => w.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Worker not found' });
    workers.splice(idx, 1);
    saveData();
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────
app.get('/api/users', authenticate, authorize('ADMIN', 'OFFICIAL'), (req, res) => {
  try { res.json(users.map(sanitizeUser).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))); } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.patch('/api/users/:id/role', authenticate, authorize('ADMIN'), (req, res) => {
  try {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.role = req.body.role;
    saveData();
    res.json(sanitizeUser(user));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.patch('/api/users/:id/active', authenticate, authorize('ADMIN'), (req, res) => {
  try {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isActive = req.body.isActive;
    saveData();
    res.json(sanitizeUser(user));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.patch('/api/users/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { name, email, role, isActive } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);
    saveData();
    res.json(sanitizeUser(user));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:id', authenticate, authorize('ADMIN'), (req, res) => {
  try {
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    users.splice(idx, 1);
    saveData();
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────
// Categories
// ──────────────────────────────────────────────
app.get('/api/categories', authenticate, (req, res) => {
  try { res.json(categories); } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/categories', authenticate, authorize('ADMIN'), (req, res) => {
  try {
    const { name, value } = req.body;
    if (!name || !value) return res.status(400).json({ error: 'Missing name or value' });
    if (categories.find((c) => c.value === value)) return res.status(409).json({ error: 'Category already exists' });
    const category = { id: uuidv4(), name, value };
    categories.push(category);
    saveData();
    res.status(201).json(category);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.delete('/api/categories/:id', authenticate, authorize('ADMIN'), (req, res) => {
  try {
    const idx = categories.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Category not found' });
    categories.splice(idx, 1);
    saveData();
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────
// Analytics
// ──────────────────────────────────────────────
app.get('/api/analytics', authenticate, authorize('ADMIN', 'OFFICIAL', 'SUPERVISOR'), (req, res) => {
  try {
    const totalIssues = issues.length;
    const byStatus = {
      PENDING: issues.filter((i) => i.status === 'PENDING').length,
      IN_PROGRESS: issues.filter((i) => i.status === 'IN_PROGRESS').length,
      RESOLVED: issues.filter((i) => i.status === 'RESOLVED').length,
    };
    const categoriesMap = {};
    issues.forEach((i) => { categoriesMap[i.category] = (categoriesMap[i.category] || 0) + 1; });
    const byCategory = Object.entries(categoriesMap).map(([category, count]) => ({ category, _count: { category: count } }));
    const priorities = {};
    issues.forEach((i) => { priorities[i.priority] = (priorities[i.priority] || 0) + 1; });
    const byPriority = Object.entries(priorities).map(([priority, count]) => ({ priority, _count: { priority: count } }));
    res.json({ totalIssues, byStatus, byCategory, byPriority });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/analytics/supervisors', authenticate, authorize('ADMIN', 'OFFICIAL', 'SUPERVISOR'), (req, res) => {
  try {
    const supervisors = users.filter((u) => u.role === 'SUPERVISOR');
    const data = supervisors.map((s) => {
      const assigned = issues.filter((i) => i.assigneeId === s.id);
      const resolved = assigned.filter((i) => i.status === 'RESOLVED');
      const avgResolutionTime = resolved.length > 0
        ? resolved.reduce((sum, i) => {
            const created = new Date(i.createdAt).getTime();
            const updated = new Date(i.updatedAt).getTime();
            return sum + (updated - created);
          }, 0) / resolved.length / (1000 * 60 * 60)
        : 0;
      return {
        id: s.id,
        name: s.name,
        totalAssigned: assigned.length,
        resolved: resolved.length,
        pending: assigned.filter((i) => i.status === 'PENDING').length,
        inProgress: assigned.filter((i) => i.status === 'IN_PROGRESS').length,
        resolutionRate: assigned.length > 0 ? Math.round((resolved.length / assigned.length) * 100) : 0,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      };
    });
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/analytics/trends', authenticate, authorize('ADMIN', 'OFFICIAL', 'SUPERVISOR'), (req, res) => {
  try {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });
    const daily = last30Days.map((date) => {
      const dayIssues = issues.filter((i) => i.createdAt.startsWith(date));
      return { date, total: dayIssues.length, pending: dayIssues.filter((i) => i.status === 'PENDING').length, inProgress: dayIssues.filter((i) => i.status === 'IN_PROGRESS').length, resolved: dayIssues.filter((i) => i.status === 'RESOLVED').length };
    });
    res.json(daily);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/analytics/users', authenticate, authorize('ADMIN', 'OFFICIAL', 'SUPERVISOR'), (req, res) => {
  try {
    const userStats = users.filter((u) => u.role !== 'ADMIN').map((u) => {
      const reported = issues.filter((i) => i.reporterId === u.id);
      const resolved = reported.filter((i) => i.status === 'RESOLVED');
      return { id: u.id, name: u.name, role: u.role, reported: reported.length, resolved: resolved.length, resolutionRate: reported.length > 0 ? Math.round((resolved.length / reported.length) * 100) : 0 };
    }).sort((a, b) => b.reported - a.reported);
    res.json(userStats);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/analytics/departments', authenticate, authorize('ADMIN', 'OFFICIAL', 'SUPERVISOR'), (req, res) => {
  try {
    const deptData = categories.map((cat) => {
      const catIssues = issues.filter((i) => i.category === cat.value);
      const resolved = catIssues.filter((i) => i.status === 'RESOLVED');
      const avgResolutionTime = resolved.length > 0
        ? resolved.reduce((sum, i) => {
            const created = new Date(i.createdAt).getTime();
            const updated = new Date(i.updatedAt).getTime();
            return sum + (updated - created);
          }, 0) / resolved.length / (1000 * 60 * 60)
        : 0;
      return { category: cat.name, total: catIssues.length, pending: catIssues.filter((i) => i.status === 'PENDING').length, inProgress: catIssues.filter((i) => i.status === 'IN_PROGRESS').length, resolved: resolved.length, resolutionRate: catIssues.length > 0 ? Math.round((resolved.length / catIssues.length) * 100) : 0, avgResolutionTime: Math.round(avgResolutionTime * 10) / 10 };
    });
    res.json(deptData);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────
// Permissions
// ──────────────────────────────────────────────
app.get('/api/permissions', authenticate, authorize('ADMIN'), (req, res) => {
  try { res.json(permissions); } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.patch('/api/permissions/:role', authenticate, authorize('ADMIN'), (req, res) => {
  try {
    const role = req.params.role;
    permissions[role] = { ...permissions[role], ...req.body };
    saveData();
    res.json(permissions[role]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────
// Website Issues
// ──────────────────────────────────────────────
app.get('/api/website-issues', authenticate, authorize('ADMIN', 'OFFICIAL', 'SUPERVISOR'), (req, res) => {
  try {
    const result = (req.userRole === 'OFFICIAL' || req.userRole === 'SUPERVISOR')
      ? websiteIssues.filter((wi) => wi.reporterId === req.userId)
      : websiteIssues;
    res.json(result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/website-issues', authenticate, authorize('OFFICIAL', 'SUPERVISOR'), upload.array('screenshots', 3), (req, res) => {
  try {
    const { title, description, priority } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
    const reporter = users.find((u) => u.id === req.userId);
    const wi = {
      id: uuidv4(),
      title,
      description,
      priority: priority || 'MEDIUM',
      status: 'PENDING',
      reporterId: req.userId,
      reporterName: reporter ? reporter.name : 'Unknown',
      screenshots: (req.files || []).map((f) => ({
        id: uuidv4(),
        filename: f.originalname,
        filepath: `/uploads/${f.filename}`,
        mimetype: f.mimetype,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    websiteIssues.push(wi);
    saveData();
    res.status(201).json(wi);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.patch('/api/website-issues/:id', authenticate, authorize('ADMIN'), (req, res) => {
  try {
    const wi = websiteIssues.find((w) => w.id === req.params.id);
    if (!wi) return res.status(404).json({ error: 'Website issue not found' });
    if (req.body.status) { wi.status = req.body.status; wi.updatedAt = new Date().toISOString(); }
    saveData();
    res.json(wi);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.delete('/api/website-issues/:id', authenticate, authorize('ADMIN'), (req, res) => {
  try {
    const idx = websiteIssues.findIndex((w) => w.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Website issue not found' });
    websiteIssues.splice(idx, 1);
    saveData();
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────
// Health
// ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    users: users.length,
    issues: issues.length
  });
});

// ──────────────────────────────────────────────
// Catch-all for unmatched API routes (prevent HTML 404)
// ──────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ──────────────────────────────────────────────
// Global error handler
// ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ──────────────────────────────────────────────
// Export for Vercel serverless
// ──────────────────────────────────────────────
console.log("=== SERVER STARTING ===");
console.log("VERCEL:", process.env.VERCEL);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("JWT:", !!process.env.JWT_SECRET);
console.log("DATA_FILE:", DATA_FILE);
console.log("USERS:", users.length);
console.log("ISSUES:", issues.length);
console.log("=== SERVER READY ===");

module.exports = app;
