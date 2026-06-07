const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Mock database state
let mockDb = {
  shops: [
    { _id: 's1', id: 's1', name: 'Cauvery Stores', address: 'Malleswaram 8th Cross', phone: '080-1234567', routeGroup: 'Malleswaram', mapsLink: 'https://goo.gl/maps/example1' },
    { _id: 's2', id: 's2', name: 'Layout Provisions', address: 'Mahalakshmi Layout, Opp Metro', phone: '080-7654321', routeGroup: 'Mahalakshmi Layout', mapsLink: 'https://goo.gl/maps/example2' },
    { _id: 's3', id: 's3', name: 'Sagar Pharma', address: 'Gayathri Nagar Main Road', phone: '080-9998887', routeGroup: 'Gayathri Nagar', mapsLink: 'https://goo.gl/maps/example3' },
  ],
  routes: [
    { _id: 'r1', id: 'r1', name: 'Malleswaram' },
    { _id: 'r2', id: 'r2', name: 'Mahalakshmi Layout' },
    { _id: 'r3', id: 'r3', name: 'Gayathri Nagar' },
    { _id: 'r4', id: 'r4', name: 'Sheshadripuram' },
    { _id: 'r5', id: 'r5', name: 'Rajajinagar' },
    { _id: 'r6', id: 'r6', name: 'Others' },
  ],
  workers: [],
  attendance: [],
  visits: [],
  products: [
    { _id: 'p1', id: 'p1', name: 'Ragi Flour', packSize: '1 Kg', defaultPrice: 60 },
    { _id: 'p2', id: 'p2', name: 'Wheat Flour', packSize: '1 Kg', defaultPrice: 55 },
    { _id: 'p3', id: 'p3', name: 'Jowar Flour', packSize: '1 Kg', defaultPrice: 65 },
    { _id: 'p4', id: 'p4', name: 'Rice Flour', packSize: '1 Kg', defaultPrice: 50 },
  ],
  orders: []
};

// Seed initial worker with hashed password
async function initMockWorkers() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('worker123', salt);
  mockDb.workers.push({
    _id: 'w1',
    id: 'w1',
    name: 'Sales Worker',
    username: 'worker',
    password: hashedPassword,
    role: 'Sales Worker',
    assignedRoutes: ['Malleswaram', 'Gayathri Nagar']
  });
  console.log('Mock workers initialized');
}
initMockWorkers();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../client/dist')));

// Cloudinary configuration (skipped for mock if env missing, but keeping structure)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'varun-nutrition',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});

const upload = multer({ storage });

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'mock-in-memory',
    timestamp: new Date()
  });
});

// Shops API
app.get('/api/shops', (req, res) => {
  const { workerId } = req.query;
  let filteredShops = [...mockDb.shops];

  if (workerId && workerId !== 'undefined' && workerId !== 'null') {
    const worker = mockDb.workers.find(w => w.id === workerId || w._id === workerId);
    if (worker && worker.assignedRoutes && worker.assignedRoutes.length > 0) {
      filteredShops = filteredShops.filter(s => worker.assignedRoutes.includes(s.routeGroup));
    } else if (worker) {
      return res.json([]);
    }
  }
  res.json(filteredShops);
});

app.post('/api/shops', (req, res) => {
  const shop = { ...req.body, _id: Date.now().toString(), id: Date.now().toString() };
  mockDb.shops.push(shop);
  res.status(201).json(shop);
});

app.put('/api/shops/:id', (req, res) => {
  const index = mockDb.shops.findIndex(s => s.id === req.params.id || s._id === req.params.id);
  if (index !== -1) {
    mockDb.shops[index] = { ...mockDb.shops[index], ...req.body };
    res.json(mockDb.shops[index]);
  } else {
    res.status(404).json({ message: 'Shop not found' });
  }
});

app.delete('/api/shops/:id', (req, res) => {
  mockDb.shops = mockDb.shops.filter(s => s.id !== req.params.id && s._id !== req.params.id);
  res.status(204).send();
});

// Routes API
app.get('/api/routes', (req, res) => {
  const { workerId } = req.query;
  let filteredRoutes = [...mockDb.routes];

  if (workerId && workerId !== 'undefined' && workerId !== 'null') {
    const worker = mockDb.workers.find(w => w.id === workerId || w._id === workerId);
    if (worker && worker.assignedRoutes && worker.assignedRoutes.length > 0) {
      filteredRoutes = filteredRoutes.filter(r => worker.assignedRoutes.includes(r.name));
    } else if (worker) {
      return res.json([]);
    }
  }
  res.json(filteredRoutes);
});

app.post('/api/routes', (req, res) => {
  const route = { ...req.body, _id: Date.now().toString(), id: Date.now().toString() };
  mockDb.routes.push(route);
  res.status(201).json(route);
});

// Workers API
app.get('/api/workers', (req, res) => {
  res.json(mockDb.workers);
});

app.post('/api/workers', async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  const worker = {
    ...req.body,
    _id: Date.now().toString(),
    id: Date.now().toString(),
    password: hashedPassword,
    username: req.body.username.toLowerCase().trim()
  };
  mockDb.workers.push(worker);
  res.status(201).json(worker);
});

app.put('/api/workers/:id', async (req, res) => {
  const index = mockDb.workers.findIndex(w => w.id === req.params.id || w._id === req.params.id);
  if (index !== -1) {
    const update = { ...req.body };
    if (update.username) update.username = update.username.toLowerCase().trim();
    if (update.password && !update.password.startsWith('$2a$')) {
       const salt = await bcrypt.genSalt(10);
       update.password = await bcrypt.hash(update.password, salt);
    } else if (!update.password) {
       delete update.password;
    }
    mockDb.workers[index] = { ...mockDb.workers[index], ...update };
    res.json(mockDb.workers[index]);
  } else {
    res.status(404).json({ message: 'Worker not found' });
  }
});

app.delete('/api/workers/:id', (req, res) => {
  mockDb.workers = mockDb.workers.filter(w => w.id !== req.params.id && w._id !== req.params.id);
  res.status(204).send();
});

// Login API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === 'owner' && password === 'owner123') {
    return res.json({ role: 'owner', name: 'Varun Owner' });
  }

  const worker = mockDb.workers.find(w => w.username.toLowerCase() === username.toLowerCase().trim());
  if (worker && await bcrypt.compare(password, worker.password)) {
    return res.json({
      role: 'worker',
      name: worker.name,
      id: worker.id,
      _id: worker._id,
      username: worker.username,
      assignedRoutes: worker.assignedRoutes || []
    });
  }
  res.status(401).json({ message: 'Invalid username or password' });
});

// Attendance API
app.post('/api/attendance/start', upload.single('photo'), (req, res) => {
  const entry = {
    _id: Date.now().toString(),
    id: Date.now().toString(),
    workerName: req.body.workerName,
    photo: req.file ? req.file.path : 'https://via.placeholder.com/150',
    startTime: new Date(),
    status: 'working'
  };
  mockDb.attendance.push(entry);
  res.status(201).json(entry);
});

app.post('/api/attendance/end', (req, res) => {
  const entry = mockDb.attendance.find(a => a.workerName === req.body.workerName && a.status === 'working');
  if (entry) {
    entry.endTime = new Date();
    entry.status = 'completed';
    res.json(entry);
  } else {
    res.status(404).json({ message: 'Active session not found' });
  }
});

app.get('/api/attendance', (req, res) => {
  res.json(mockDb.attendance);
});

// Visits API
app.post('/api/visits', upload.single('photo'), (req, res) => {
  const visit = {
    _id: Date.now().toString(),
    id: Date.now().toString(),
    shopName: req.body.shopName,
    workerName: req.body.workerName,
    notes: req.body.notes,
    photo: req.file ? req.file.path : 'https://via.placeholder.com/150',
    timestamp: new Date()
  };
  mockDb.visits.push(visit);
  res.status(201).json(visit);
});

app.get('/api/visits', (req, res) => {
  const { workerName, shopName } = req.query;
  let filteredVisits = [...mockDb.visits];
  if (workerName) filteredVisits = filteredVisits.filter(v => v.workerName === workerName);
  if (shopName) filteredVisits = filteredVisits.filter(v => v.shopName === shopName);
  res.json(filteredVisits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

// Products API
app.get('/api/products', (req, res) => {
  res.json(mockDb.products);
});

app.post('/api/products', (req, res) => {
  const product = { ...req.body, _id: Date.now().toString(), id: Date.now().toString() };
  mockDb.products.push(product);
  res.status(201).json(product);
});

app.put('/api/products/:id', (req, res) => {
  const index = mockDb.products.findIndex(p => p.id === req.params.id || p._id === req.params.id);
  if (index !== -1) {
    mockDb.products[index] = { ...mockDb.products[index], ...req.body };
    res.json(mockDb.products[index]);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  mockDb.products = mockDb.products.filter(p => p.id !== req.params.id && p._id !== req.params.id);
  res.status(204).send();
});

// Orders API
app.get('/api/orders', (req, res) => {
  const { workerId, shopName, workerName, routeName } = req.query;
  let filteredOrders = [...mockDb.orders];
  if (workerId) filteredOrders = filteredOrders.filter(o => o.workerId === workerId);
  if (shopName) filteredOrders = filteredOrders.filter(o => o.shopName === shopName);
  if (workerName) filteredOrders = filteredOrders.filter(o => o.workerName === workerName);
  if (routeName) filteredOrders = filteredOrders.filter(o => o.routeName === routeName);
  res.json(filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

app.post('/api/orders', (req, res) => {
  const order = { ...req.body, _id: Date.now().toString(), id: Date.now().toString(), timestamp: new Date() };
  mockDb.orders.push(order);
  res.status(201).json(order);
});

app.put('/api/orders/:id', (req, res) => {
  const index = mockDb.orders.findIndex(o => o.id === req.params.id || o._id === req.params.id);
  if (index !== -1) {
    mockDb.orders[index] = { ...mockDb.orders[index], ...req.body };
    res.json(mockDb.orders[index]);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

app.delete('/api/orders/:id', (req, res) => {
  mockDb.orders = mockDb.orders.filter(o => o.id !== req.params.id && o._id !== req.params.id);
  res.status(204).send();
});

// The "catchall" handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} (MOCK MODE)`);
});
