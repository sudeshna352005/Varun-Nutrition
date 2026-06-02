const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// In-memory data store for demo
let shops = [
  { id: 101, name: 'Cauvery Stores', address: 'Malleswaram 8th Cross', phone: '080-1234567', routeGroup: 'Malleswaram', mapsLink: 'https://goo.gl/maps/example1' },
  { id: 102, name: 'Layout Provisions', address: 'Mahalakshmi Layout, Opp Metro', phone: '080-7654321', routeGroup: 'Mahalakshmi Layout', mapsLink: 'https://goo.gl/maps/example2' },
  { id: 103, name: 'Sagar Pharma', address: 'Gayathri Nagar Main Road', phone: '080-9998887', routeGroup: 'Gayathri Nagar', mapsLink: 'https://goo.gl/maps/example3' },
];
let routeGroups = [
  { id: 1, name: 'Malleswaram' },
  { id: 2, name: 'Mahalakshmi Layout' },
  { id: 3, name: 'Gayathri Nagar' },
  { id: 4, name: 'Sheshadripuram' },
  { id: 5, name: 'Rajajinagar' },
  { id: 6, name: 'Others' },
];
let attendance = [];
let visits = [];


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
app.get('/api/shops', (req, res) => res.json(shops));
app.post('/api/shops', (req, res) => {
  const shop = { ...req.body, id: Date.now() };
  shops.push(shop);
  res.status(201).json(shop);
});
app.put('/api/shops/:id', (req, res) => {
  const index = shops.findIndex(s => s.id == req.params.id);
  if (index !== -1) {
    shops[index] = { ...shops[index], ...req.body };
    res.json(shops[index]);
  } else {
    res.status(404).json({ message: 'Shop not found' });
  }
});
app.delete('/api/shops/:id', (req, res) => {
  shops = shops.filter(s => s.id != req.params.id);
  res.status(204).send();
});

app.get('/api/routes', (req, res) => res.json(routeGroups));
app.post('/api/routes', (req, res) => {
  const route = { ...req.body, id: Date.now() };
  routeGroups.push(route);
  res.status(201).json(route);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Simple demo login
  if (username === 'owner' && password === 'owner123') {
    res.json({ role: 'owner', name: 'Varun Owner' });
  } else if (username === 'worker' && password === 'worker123') {
    res.json({ role: 'worker', name: 'Sales Worker' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/attendance/start', upload.single('photo'), (req, res) => {
  const entry = {
    id: Date.now(),
    workerName: req.body.workerName,
    startTime: new Date(),
    photo: req.file ? req.file.path : null,
    status: 'working'
  };
  attendance.push(entry);
  res.status(201).json(entry);
});

app.post('/api/attendance/end', (req, res) => {
  const entry = attendance.find(a => a.workerName === req.body.workerName && a.status === 'working');
  if (entry) {
    entry.endTime = new Date();
    entry.status = 'completed';
    res.json(entry);
  } else {
    res.status(404).json({ message: 'Active session not found' });
  }
});

app.get('/api/attendance', (req, res) => res.json(attendance));

app.post('/api/visits', (req, res) => {
  const visit = { ...req.body, id: Date.now(), timestamp: new Date() };
  visits.push(visit);
  res.status(201).json(visit);
});

app.get('/api/visits', (req, res) => res.json(visits));


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});