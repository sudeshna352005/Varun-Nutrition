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

const Shop = require('./models/Shop');
const Route = require('./models/Route');
const Worker = require('./models/Worker');
const Attendance = require('./models/Attendance');
const Visit = require('./models/Visit');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Payroll = require('./models/Payroll');

// Fallback Mock database state
let mockDb = {
  shops: [],
  routes: [],
  workers: [],
  attendance: [],
  visits: [],
  products: [],
  orders: []
};

let useMock = false;

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI || 'mongodb://localhost:27017/varun-nutrition', {
  serverSelectionTimeoutMS: 5000,
})
  .then(async () => {
    console.log('Successfully connected to MongoDB.');
    await seedData();
  })
  .catch(err => {
    console.warn('CRITICAL: MongoDB connection failed. Falling back to in-memory MOCK MODE.', err.message);
    useMock = true;
    initMockData();
  });

async function seedData() {
  try {
    const shopCount = await Shop.countDocuments();
    if (shopCount === 0) {
      await Shop.insertMany([
        { name: 'Cauvery Stores', address: 'Malleswaram 8th Cross', phone: '080-1234567', routeGroup: 'Malleswaram', mapsLink: 'https://goo.gl/maps/example1' },
        { name: 'Layout Provisions', address: 'Mahalakshmi Layout, Opp Metro', phone: '080-7654321', routeGroup: 'Mahalakshmi Layout', mapsLink: 'https://goo.gl/maps/example2' },
        { name: 'Sagar Pharma', address: 'Gayathri Nagar Main Road', phone: '080-9998887', routeGroup: 'Gayathri Nagar', mapsLink: 'https://goo.gl/maps/example3' },
      ]);
    }

    const routeCount = await Route.countDocuments();
    if (routeCount === 0) {
      await Route.insertMany([
        { name: 'Malleswaram' }, { name: 'Mahalakshmi Layout' }, { name: 'Gayathri Nagar' },
        { name: 'Sheshadripuram' }, { name: 'Rajajinagar' }, { name: 'Others' },
      ]);
    }

    const defaultWorker = await Worker.findOne({ username: 'worker' });
    if (!defaultWorker) {
      await Worker.create({ name: 'Sales Worker', username: 'worker', password: 'worker123', role: 'Sales Worker', assignedRoutes: ['Malleswaram'], dailySalary: 700, additionalAllowance: 100 });
    }

    // Specific Requirements: Lavanya (Sales), Naveen (Sales), Gopi (Delivery)
    const lavanya = await Worker.findOne({ username: 'lavanya' });
    if (!lavanya) {
      await Worker.create({ name: 'Lavanya', username: 'lavanya', password: 'worker123', role: 'Sales Worker', assignedRoutes: ['Malleswaram'], dailySalary: 700, additionalAllowance: 100 });
    }

    const naveen = await Worker.findOne({ username: 'naveen' });
    if (!naveen) {
      await Worker.create({ name: 'Naveen', username: 'naveen', password: 'worker123', role: 'Sales Worker', assignedRoutes: ['Gayathri Nagar'], dailySalary: 700, additionalAllowance: 100 });
    }

    const gopi = await Worker.findOne({ username: 'gopi' });
    if (!gopi) {
      await Worker.create({ name: 'Gopi', username: 'gopi', password: 'delivery123', role: 'Delivery Staff', assignedRoutes: ['Mahalakshmi Layout'], dailySalary: 800, additionalAllowance: 100 });
    }

    const rohith = await Worker.findOne({ username: 'rohith' });
    if (!rohith) {
      await Worker.create({ name: 'Rohith', username: 'rohith', password: 'delivery123', role: 'Delivery Staff', assignedRoutes: ['Malleswaram'], dailySalary: 700, additionalAllowance: 100 });
    }

    // Legacy password migration: ensure all existing workers have hashed passwords
    const allWorkers = await Worker.find();
    for (const w of allWorkers) {
      if (w.password && !w.password.startsWith('$2a$') && !w.password.startsWith('$2b$')) {
        console.log(`Hashing legacy password for user: ${w.username}`);
        // Worker.js has a pre-save hook that hashes the password.
        // We just need to save the plain text password and it will be hashed.
        await w.save();
      }
    }

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany([
        { name: 'Ragi Flour', packSize: '1 Kg', defaultPrice: 60 },
        { name: 'Wheat Flour', packSize: '1 Kg', defaultPrice: 55 },
        { name: 'Jowar Flour', packSize: '1 Kg', defaultPrice: 65 },
        { name: 'Rice Flour', packSize: '1 Kg', defaultPrice: 50 },
      ]);
    }
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

async function initMockData() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('worker123', salt);
  mockDb.workers.push({
    _id: 'w1', id: 'w1', name: 'Sales Worker', username: 'worker',
    password: hashedPassword, role: 'Sales Worker', assignedRoutes: ['Malleswaram'], dailySalary: 700, additionalAllowance: 100
  });
  mockDb.workers.push({
    _id: 'w2', id: 'w2', name: 'Rohith', username: 'rohith',
    password: hashedPassword, role: 'Delivery Staff', assignedRoutes: ['Malleswaram'], dailySalary: 700, additionalAllowance: 100
  });
  mockDb.workers.push({
    _id: 'w3', id: 'w3', name: 'Gopi', username: 'gopi',
    password: hashedPassword, role: 'Delivery Staff', assignedRoutes: ['Mahalakshmi Layout'], dailySalary: 800, additionalAllowance: 100
  });
  mockDb.workers.push({
    _id: 'w4', id: 'w4', name: 'Lavanya', username: 'lavanya',
    password: hashedPassword, role: 'Sales Worker', assignedRoutes: ['Malleswaram'], dailySalary: 700, additionalAllowance: 100
  });
  mockDb.workers.push({
    _id: 'w5', id: 'w5', name: 'Naveen', username: 'naveen',
    password: hashedPassword, role: 'Sales Worker', assignedRoutes: ['Gayathri Nagar'], dailySalary: 700, additionalAllowance: 100
  });
  mockDb.shops = [
    { _id: 's1', id: 's1', name: 'Cauvery Stores', address: 'Malleswaram', routeGroup: 'Malleswaram' }
  ];
  mockDb.routes = [{ _id: 'r1', id: 'r1', name: 'Malleswaram' }];
  mockDb.products = [{ _id: 'p1', id: 'p1', name: 'Ragi Flour', packSize: '1 Kg', defaultPrice: 60 }];
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'varun-nutrition',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});
const upload = multer({ storage });

// --- API ROUTES ---

app.get('/api/payroll', async (req, res) => {
  if (useMock) return res.json(mockDb.payroll || []);
  try {
    const { month, startDate, endDate } = req.query;
    let query = {};
    if (month) query.month = month;
    else if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const data = await Payroll.find(query);
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/payroll/calculate', async (req, res) => {
  const { month, customStartDate, customEndDate } = req.body;

  let startDate, endDate, periodLabel;

  if (customStartDate && customEndDate) {
    startDate = new Date(customStartDate);
    endDate = new Date(customEndDate);
    endDate.setHours(23, 59, 59, 999);
    periodLabel = `${customStartDate} to ${customEndDate}`;
  } else if (month) {
    startDate = new Date(`${month}-01T00:00:00Z`);
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    periodLabel = month;
  } else {
    return res.status(400).json({ message: 'Month or Custom Date Range is required' });
  }

  if (useMock) {
    // Basic mock calculation
    const payrolls = mockDb.workers.map(w => ({
      id: `pr-${w.id}-${periodLabel}`,
      workerId: w.id,
      workerName: w.name,
      month: periodLabel,
      presentDays: 20,
      dailySalary: w.dailySalary || 700,
      additionalAllowance: w.additionalAllowance || 100,
      baseSalary: (w.dailySalary || 700) * 20,
      additionalAmount: (w.additionalAllowance || 100) * 20,
      bonus: 0,
      deductions: 0,
      netSalary: ((w.dailySalary || 700) + (w.additionalAllowance || 100)) * 20,
      status: 'draft'
    }));
    mockDb.payroll = payrolls;
    return res.json(payrolls);
  }

  try {
    const workers = await Worker.find();
    const payrollRecords = [];

    for (const worker of workers) {
      const attendance = await Attendance.find({
        workerName: worker.name,
        startTime: { $gte: startDate, $lt: endDate },
        status: 'completed'
      });

      // Implement UNIQUE attendance dates only
      const uniqueDates = new Set(attendance.map(a => new Date(a.startTime).toDateString()));
      const presentDays = uniqueDates.size;

      const dailySalary = worker.dailySalary || 0;
      const additionalAllowance = worker.additionalAllowance || 0;

      const baseSalary = presentDays * dailySalary;
      const additionalAmount = presentDays * additionalAllowance;

      let payroll = await Payroll.findOne({ workerId: worker._id, month: periodLabel });

      if (payroll) {
        payroll.presentDays = presentDays;
        payroll.dailySalary = dailySalary;
        payroll.additionalAllowance = additionalAllowance;
        payroll.baseSalary = baseSalary;
        payroll.additionalAmount = additionalAmount;
        payroll.netSalary = baseSalary + additionalAmount + (payroll.bonus || 0) - (payroll.deductions || 0);
      } else {
        payroll = new Payroll({
          workerId: worker._id,
          workerName: worker.name,
          month: periodLabel,
          presentDays,
          dailySalary,
          additionalAllowance,
          baseSalary,
          additionalAmount,
          netSalary: baseSalary + additionalAmount
        });
      }

      await payroll.save();
      payrollRecords.push(payroll);
    }

    res.json(payrollRecords);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/payroll/:id', async (req, res) => {
  if (useMock) {
    const idx = (mockDb.payroll || []).findIndex(p => p.id === req.params.id);
    if (idx !== -1) {
      mockDb.payroll[idx] = { ...mockDb.payroll[idx], ...req.body };
      const p = mockDb.payroll[idx];
      p.netSalary = p.baseSalary + p.additionalAmount + (p.bonus || 0) - (p.deductions || 0);
      return res.json(p);
    }
    return res.status(404).json({ message: 'Payroll not found' });
  }
  try {
    const { bonus, deductions, notes, status } = req.body;
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });

    if (bonus !== undefined) payroll.bonus = bonus;
    if (deductions !== undefined) payroll.deductions = deductions;
    if (notes !== undefined) payroll.notes = notes;
    if (status !== undefined) payroll.status = status;

    payroll.netSalary = payroll.baseSalary + payroll.additionalAmount + (payroll.bonus || 0) - (payroll.deductions || 0);

    await payroll.save();
    res.json(payroll);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: useMock ? 'mock-in-memory' : 'connected-mongodb',
    timestamp: new Date()
  });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = (username || '').toLowerCase().trim();
  console.log(`Login attempt: ${normalizedUsername}`);

  if (normalizedUsername === 'owner' && password === 'owner123') {
    return res.json({ role: 'owner', name: 'Varun Owner' });
  }

  if (useMock) {
    const worker = mockDb.workers.find(w => w.username.toLowerCase() === normalizedUsername);
    if (worker && await bcrypt.compare(password, worker.password)) {
      return res.json({ role: worker.role, name: worker.name, id: worker.id, username: worker.username, assignedRoutes: worker.assignedRoutes });
    }
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  if (mongoose.connection.readyState !== 1) {
    // If not connected to DB, we can't do anything else unless we fallback to mockDb
    console.warn('DB not ready, attempting mock lookup');
    const worker = mockDb.workers.find(w => w.username.toLowerCase() === normalizedUsername);
    if (worker && await bcrypt.compare(password, worker.password)) {
      return res.json({ role: worker.role, name: worker.name, id: worker.id, username: worker.username, assignedRoutes: worker.assignedRoutes });
    }
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  try {
    const worker = await Worker.findOne({ username: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') } });
    if (worker && await worker.comparePassword(password)) {
      return res.json({ role: worker.role, name: worker.name, id: worker._id, username: worker.username, assignedRoutes: worker.assignedRoutes });
    }
    res.status(401).json({ message: 'Invalid username or password' });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/shops', async (req, res) => {
  if (useMock) {
    const { workerId } = req.query;
    if (workerId && workerId !== 'undefined' && workerId !== 'null') {
      const worker = mockDb.workers.find(w => w.id === workerId);
      return res.json(mockDb.shops.filter(s => worker?.assignedRoutes?.includes(s.routeGroup)));
    }
    return res.json(mockDb.shops);
  }
  try {
    const { workerId } = req.query;
    let query = {};
    if (workerId && mongoose.Types.ObjectId.isValid(workerId)) {
      const worker = await Worker.findById(workerId);
      if (worker?.assignedRoutes?.length > 0) {
        query.routeGroup = { $in: worker.assignedRoutes };
      } else { return res.json([]); }
    }
    const shops = await Shop.find(query);
    res.json(shops);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/shops', async (req, res) => {
  if (useMock) {
    const shop = { ...req.body, _id: Date.now().toString(), id: Date.now().toString() };
    mockDb.shops.push(shop);
    return res.status(201).json(shop);
  }
  try {
    const shop = new Shop(req.body);
    await shop.save();
    res.status(201).json(shop);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/shops/:id', async (req, res) => {
  if (useMock) {
    const idx = mockDb.shops.findIndex(s => s.id === req.params.id);
    if (idx !== -1) { mockDb.shops[idx] = { ...mockDb.shops[idx], ...req.body }; return res.json(mockDb.shops[idx]); }
    return res.status(404).json({ message: 'Shop not found' });
  }
  try {
    const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(shop);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/shops/:id', async (req, res) => {
  if (useMock) {
    mockDb.shops = mockDb.shops.filter(s => s.id !== req.params.id);
    return res.status(204).send();
  }
  try {
    await Shop.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/routes', async (req, res) => {
  if (useMock) {
    const { workerId } = req.query;
    if (workerId && workerId !== 'undefined' && workerId !== 'null') {
      const worker = mockDb.workers.find(w => w.id === workerId);
      return res.json(mockDb.routes.filter(r => worker?.assignedRoutes?.includes(r.name)));
    }
    return res.json(mockDb.routes);
  }
  try {
    const { workerId } = req.query;
    let query = {};
    if (workerId && mongoose.Types.ObjectId.isValid(workerId)) {
      const worker = await Worker.findById(workerId);
      if (worker?.assignedRoutes?.length > 0) {
        query.name = { $in: worker.assignedRoutes };
      } else { return res.json([]); }
    }
    const routesList = await Route.find(query);
    res.json(routesList);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/routes', async (req, res) => {
  if (useMock) {
    const route = { ...req.body, _id: Date.now().toString(), id: Date.now().toString() };
    mockDb.routes.push(route);
    return res.status(201).json(route);
  }
  try {
    const route = new Route(req.body);
    await route.save();
    res.status(201).json(route);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.get('/api/workers', async (req, res) => {
  if (useMock) return res.json(mockDb.workers);
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/workers', async (req, res) => {
  if (useMock) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const worker = { ...req.body, _id: Date.now().toString(), id: Date.now().toString(), password: hashedPassword };
    if (worker.dailySalary < 0 || worker.additionalAllowance < 0) {
      return res.status(400).json({ message: 'Salary/Allowance cannot be negative' });
    }
    mockDb.workers.push(worker);
    return res.status(201).json(worker);
  }
  try {
    const { dailySalary, additionalAllowance } = req.body;
    if (dailySalary < 0 || additionalAllowance < 0) {
      return res.status(400).json({ message: 'Salary/Allowance cannot be negative' });
    }
    const worker = new Worker(req.body);
    await worker.save();
    res.status(201).json(worker);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/workers/:id', async (req, res) => {
  if (useMock) {
    const idx = mockDb.workers.findIndex(w => w.id === req.params.id);
    if (idx !== -1) {
      const update = { ...req.body };
      if (update.password && !update.password.startsWith('$2a$')) {
        const salt = await bcrypt.genSalt(10);
        update.password = await bcrypt.hash(update.password, salt);
      }
      mockDb.workers[idx] = { ...mockDb.workers[idx], ...update };
      return res.json(mockDb.workers[idx]);
    }
    return res.status(404).json({ message: 'Worker not found' });
  }
  try {
    const { name, username, password, role, assignedRoutes, dailySalary, additionalAllowance } = req.body;
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    if (name) worker.name = name;
    if (username) worker.username = username.toLowerCase().trim();
    if (role) worker.role = role;
    if (assignedRoutes) worker.assignedRoutes = assignedRoutes;
    if (password && !password.startsWith('$2a$')) worker.password = password;

    if (dailySalary !== undefined) {
      if (dailySalary < 0) return res.status(400).json({ message: 'Daily salary cannot be negative' });
      worker.dailySalary = dailySalary;
    }

    if (additionalAllowance !== undefined) {
      if (additionalAllowance < 0) return res.status(400).json({ message: 'Allowance cannot be negative' });
      worker.additionalAllowance = additionalAllowance;
    }

    await worker.save();
    res.json(worker);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/workers/:id', async (req, res) => {
  if (useMock) {
    mockDb.workers = mockDb.workers.filter(w => w.id !== req.params.id);
    return res.status(204).send();
  }
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/attendance', async (req, res) => {
  if (useMock) {
    const { workerName, startDate, endDate, status } = req.query;
    let result = [...mockDb.attendance];
    if (workerName) result = result.filter(a => a.workerName === workerName);
    if (status) result = result.filter(a => a.status === status);
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      result = result.filter(a => new Date(a.startTime) >= s && new Date(a.startTime) <= e);
    }
    return res.json(result);
  }
  try {
    const { workerName, startDate, endDate, status } = req.query;
    let query = {};
    if (workerName) query.workerName = workerName;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.startTime = { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    }
    res.json(await Attendance.find(query).sort({ startTime: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/attendance/start', upload.single('photo'), async (req, res) => {
  if (useMock) {
    const entry = { _id: Date.now().toString(), id: Date.now().toString(), workerName: req.body.workerName, startTime: new Date(), status: 'working', photo: 'mock-selfie-url' };
    mockDb.attendance.push(entry);
    return res.status(201).json(entry);
  }
  try {
    const entry = new Attendance({
      workerName: req.body.workerName,
      photo: req.file ? req.file.path : null,
      status: 'working'
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.post('/api/attendance/end', async (req, res) => {
  if (useMock) {
    const entry = mockDb.attendance.find(a => a.workerName === req.body.workerName && a.status === 'working');
    if (entry) { entry.endTime = new Date(); entry.status = 'completed'; return res.json(entry); }
    return res.status(404).json({ message: 'Active session not found' });
  }
  try {
    const entry = await Attendance.findOne({ workerName: req.body.workerName, status: 'working' });
    if (entry) { entry.endTime = new Date(); entry.status = 'completed'; await entry.save(); return res.json(entry); }
    res.status(404).json({ message: 'Active session not found' });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.get('/api/visits', async (req, res) => {
  if (useMock) {
    const { workerName, shopName, startDate, endDate } = req.query;
    let result = [...mockDb.visits];
    if (workerName) result = result.filter(v => v.workerName === workerName);
    if (shopName) result = result.filter(v => v.shopName === shopName);
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      result = result.filter(v => new Date(v.timestamp) >= s && new Date(v.timestamp) <= e);
    }
    return res.json(result);
  }
  try {
    const { workerName, shopName, startDate, endDate } = req.query;
    let query = {};
    if (workerName) query.workerName = workerName;
    if (shopName) query.shopName = shopName;
    if (startDate && endDate) {
      query.timestamp = { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    }
    res.json(await Visit.find(query).sort({ timestamp: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/visits', upload.single('photo'), async (req, res) => {
  if (useMock) {
    const visit = {
      _id: Date.now().toString(),
      id: Date.now().toString(),
      shopName: req.body.shopName,
      workerName: req.body.workerName,
      workerRole: req.body.workerRole,
      routeName: req.body.routeName,
      notes: req.body.notes,
      photo: 'mock-photo-url',
      timestamp: new Date()
    };
    mockDb.visits.push(visit);
    return res.status(201).json(visit);
  }
  try {
    const visit = new Visit({
      shopName: req.body.shopName,
      workerName: req.body.workerName,
      workerRole: req.body.workerRole,
      routeName: req.body.routeName,
      notes: req.body.notes,
      photo: req.file ? req.file.path : null
    });
    await visit.save();
    res.status(201).json(visit);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.get('/api/products', async (req, res) => {
  if (useMock) return res.json(mockDb.products);
  try { res.json(await Product.find()); } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/products', async (req, res) => {
  if (useMock) {
    const product = { ...req.body, _id: Date.now().toString(), id: Date.now().toString() };
    mockDb.products.push(product);
    return res.status(201).json(product);
  }
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/products/:id', async (req, res) => {
  if (useMock) {
    const idx = mockDb.products.findIndex(p => p.id === req.params.id);
    if (idx !== -1) {
      mockDb.products[idx] = { ...mockDb.products[idx], ...req.body };
      return res.json(mockDb.products[idx]);
    }
    return res.status(404).json({ message: 'Product not found' });
  }
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  if (useMock) {
    mockDb.products = mockDb.products.filter(p => p.id !== req.params.id);
    return res.status(204).send();
  }
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(204).send();
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/orders', async (req, res) => {
  if (useMock) {
    const { workerId, workerName, shopName, deliveryStaffId, startDate, endDate } = req.query;
    let result = [...mockDb.orders];
    if (workerId) result = result.filter(o => o.workerId === workerId);
    if (workerName) result = result.filter(o => o.workerName === workerName);
    if (shopName) result = result.filter(o => o.shopName === shopName);
    if (deliveryStaffId) result = result.filter(o => o.assignedDeliveryStaff?.id === deliveryStaffId);
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.timestamp) >= s && new Date(o.timestamp) <= e);
    }
    return res.json(result);
  }
  try {
    const { workerId, workerName, shopName, deliveryStaffId, startDate, endDate } = req.query;
    let query = {};
    if (workerId) query.workerId = workerId;
    if (workerName) query.workerName = workerName;
    if (shopName) query.shopName = shopName;
    if (deliveryStaffId) query['assignedDeliveryStaff.id'] = deliveryStaffId;
    if (startDate && endDate) {
      query.timestamp = { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    }
    res.json(await Order.find(query).sort({ timestamp: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/orders', async (req, res) => {
  if (useMock) {
    const order = { ...req.body, _id: Date.now().toString(), id: Date.now().toString(), timestamp: new Date() };
    mockDb.orders.push(order);
    return res.status(201).json(order);
  }
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/orders/:id', async (req, res) => {
  if (useMock) {
    const idx = mockDb.orders.findIndex(o => o.id === req.params.id);
    if (idx !== -1) {
      mockDb.orders[idx] = { ...mockDb.orders[idx], ...req.body };
      return res.json(mockDb.orders[idx]);
    }
    return res.status(404).json({ message: 'Order not found' });
  }
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// --- STATIC FILES & SPA SUPPORT ---

// Important: express.static must be defined AFTER API routes to avoid intercepting POST requests
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} ${useMock ? '(MOCK MODE)' : ''}`);
});
