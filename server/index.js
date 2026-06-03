const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Shop = require('./models/Shop');
const Route = require('./models/Route');
const Worker = require('./models/Worker');
const Attendance = require('./models/Attendance');
const Visit = require('./models/Visit');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in environment variables.');
}

mongoose.connect(MONGO_URI || 'mongodb://localhost:27017/varun-nutrition')
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedData();
  })
  .catch(err => console.error('MongoDB connection error:', err));

async function seedData() {
  const shopCount = await Shop.countDocuments();
  if (shopCount === 0) {
    await Shop.insertMany([
      { name: 'Cauvery Stores', address: 'Malleswaram 8th Cross', phone: '080-1234567', routeGroup: 'Malleswaram', mapsLink: 'https://goo.gl/maps/example1' },
      { name: 'Layout Provisions', address: 'Mahalakshmi Layout, Opp Metro', phone: '080-7654321', routeGroup: 'Mahalakshmi Layout', mapsLink: 'https://goo.gl/maps/example2' },
      { name: 'Sagar Pharma', address: 'Gayathri Nagar Main Road', phone: '080-9998887', routeGroup: 'Gayathri Nagar', mapsLink: 'https://goo.gl/maps/example3' },
    ]);
    console.log('Shops seeded');
  }

  const routeCount = await Route.countDocuments();
  if (routeCount === 0) {
    await Route.insertMany([
      { name: 'Malleswaram' },
      { name: 'Mahalakshmi Layout' },
      { name: 'Gayathri Nagar' },
      { name: 'Sheshadripuram' },
      { name: 'Rajajinagar' },
      { name: 'Others' },
    ]);
    console.log('Routes seeded');
  }

  const workerCount = await Worker.countDocuments();
  if (workerCount === 0) {
    await Worker.create({ name: 'Sales Worker', username: 'worker', password: 'worker123' });
    console.log('Initial worker seeded');
  } else {
    // Ensure the default worker exists or update it to be lowercase
    const worker = await Worker.findOne({ username: 'worker' });
    if (!worker) {
      await Worker.create({ name: 'Sales Worker', username: 'worker', password: 'worker123' });
    }
  }
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Multer setup for simulated photo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Routes
app.get('/api/shops', async (req, res) => {
  const shops = await Shop.find();
  res.json(shops);
});
app.post('/api/shops', async (req, res) => {
  const shop = new Shop(req.body);
  await shop.save();
  res.status(201).json(shop);
});
app.put('/api/shops/:id', async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (shop) {
    res.json(shop);
  } else {
    res.status(404).json({ message: 'Shop not found' });
  }
});
app.delete('/api/shops/:id', async (req, res) => {
  await Shop.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

app.get('/api/routes', async (req, res) => {
  const routeGroups = await Route.find();
  res.json(routeGroups);
});
app.post('/api/routes', async (req, res) => {
  const route = new Route(req.body);
  await route.save();
  res.status(201).json(route);
});

// Workers API
app.get('/api/workers', async (req, res) => {
  const workersList = await Worker.find();
  res.json(workersList);
});
app.post('/api/workers', async (req, res) => {
  const workerData = { ...req.body };
  if (workerData.username) {
    workerData.username = workerData.username.toLowerCase().trim();
  }
  const worker = new Worker(workerData);
  await worker.save();
  res.status(201).json(worker);
});
app.put('/api/workers/:id', async (req, res) => {
  const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (worker) {
    res.json(worker);
  } else {
    res.status(404).json({ message: 'Worker not found' });
  }
});
app.delete('/api/workers/:id', async (req, res) => {
  await Worker.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === 'owner' && password === 'owner123') {
    return res.json({ role: 'owner', name: 'Varun Owner' });
  }

  const worker = await Worker.findOne({
    username: username.toLowerCase().trim(),
    password: password
  });
  if (worker) {
    return res.json({ role: 'worker', name: worker.name, id: worker.id });
  }

  res.status(401).json({ message: 'Invalid credentials' });
});

app.post('/api/attendance/start', upload.single('photo'), async (req, res) => {
  const entry = new Attendance({
    workerName: req.body.workerName,
    photo: req.file ? `uploads/${req.file.filename}` : null,
    status: 'working'
  });
  await entry.save();
  res.status(201).json(entry);
});

app.post('/api/attendance/end', async (req, res) => {
  const entry = await Attendance.findOne({ workerName: req.body.workerName, status: 'working' });
  if (entry) {
    entry.endTime = new Date();
    entry.status = 'completed';
    await entry.save();
    res.json(entry);
  } else {
    res.status(404).json({ message: 'Active session not found' });
  }
});

app.get('/api/attendance', async (req, res) => {
  const attendance = await Attendance.find();
  res.json(attendance);
});

app.post('/api/visits', upload.single('photo'), async (req, res) => {

  const visit = new Visit({
    shopName: req.body.shopName,
    workerName: req.body.workerName,
    notes: req.body.notes,
    photo: req.file ? `uploads/${req.file.filename}` : null
  });

  await visit.save();

  res.status(201).json(visit);
});

app.get('/api/visits', async (req, res) => {
  const visits = await Visit.find();
  res.json(visits);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
