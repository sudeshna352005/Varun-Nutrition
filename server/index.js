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

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in environment variables.');
}

mongoose.connect(MONGO_URI || 'mongodb://localhost:27017/varun-nutrition', {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('Successfully connected to MongoDB.');
    await seedData();
  })
  .catch(err => {
    console.error('CRITICAL: MongoDB connection failed:', err.message);
  });

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
    // 1. Ensure the default worker exists
    let worker = await Worker.findOne({ username: 'worker' });
    if (!worker) {
      await Worker.create({ name: 'Sales Worker', username: 'worker', password: 'worker123' });
    }

    // 2. Fix legacy plain-text passwords
    const allWorkers = await Worker.find();
    for (const w of allWorkers) {
      if (!w.password.startsWith('$2a$') && !w.password.startsWith('$2b$')) {
        console.log(`Hashing plain-text password for worker: ${w.username}`);
        const salt = await bcrypt.genSalt(10);
        w.password = await bcrypt.hash(w.password, salt);
        // Using updateOne to bypass the pre-save hook since we already hashed it
        await Worker.updateOne({ _id: w._id }, { password: w.password });
      }
    }
  }

  const visitCount = await Visit.countDocuments();
  if (visitCount === 0) {
    await Visit.insertMany([
      { shopName: 'Cauvery Stores', workerName: 'Sales Worker', notes: 'Mock visit 1', timestamp: new Date() },
      { shopName: 'Layout Provisions', workerName: 'Sales Worker', notes: 'Mock visit 2', timestamp: new Date() },
      { shopName: 'Sagar Pharma', workerName: 'Sales Worker', notes: 'Mock visit 3', timestamp: new Date() },
    ]);
    console.log('Mock visits seeded');
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.insertMany([
      { name: 'Ragi Flour', packSize: '1 Kg', defaultPrice: 60 },
      { name: 'Wheat Flour', packSize: '1 Kg', defaultPrice: 55 },
      { name: 'Jowar Flour', packSize: '1 Kg', defaultPrice: 65 },
      { name: 'Rice Flour', packSize: '1 Kg', defaultPrice: 50 },
      { name: 'Ragi Malt', packSize: '250 g', defaultPrice: 80 },
      { name: 'Ragi Malt', packSize: '500 g', defaultPrice: 150 },
      { name: 'Millet Malt', packSize: '250 g', defaultPrice: 90 },
      { name: 'Millet Malt', packSize: '500 g', defaultPrice: 170 },
    ]);
    console.log('Products seeded');
  }
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
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1000, crop: "limit" }, // Resize to max 1000px width
      { quality: "auto:good" },      // Auto-quality optimization
      { fetch_format: "auto" }      // Auto-format (WebP when supported)
    ]
  }
});

const upload = multer({ storage });

// Health check
app.get('/api/health', (req, res) => {
  const models = mongoose.modelNames();
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mongoState: mongoose.connection.readyState,
    modelsLoaded: models,
    timestamp: new Date()
  });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const products = await Product.find().limit(1);
    const orders = await Order.find().limit(1);
    res.json({
      productsFound: products.length,
      ordersFound: orders.length,
      mongoState: mongoose.connection.readyState
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.get('/api/shops', async (req, res) => {
  try {
    const { workerId } = req.query;
    console.log("GET /api/shops - Received workerId query param:", workerId);
    let query = {};

    if (workerId && workerId !== 'undefined' && workerId !== 'null') {
      if (!mongoose.Types.ObjectId.isValid(workerId)) {
        console.warn("GET /api/shops - Invalid workerId format:", workerId);
        return res.status(400).json({ message: "Invalid worker ID format" });
      }

      const worker = await Worker.findById(workerId);
      if (!worker) {
        console.warn("GET /api/shops - Worker not found for ID:", workerId);
        return res.status(404).json({ message: "Worker not found" });
      }

      console.log(`GET /api/shops - Worker: ${worker.name}, Assigned Routes: [${worker.assignedRoutes.join(', ')}]`);

      if (worker.assignedRoutes && worker.assignedRoutes.length > 0) {
        query.routeGroup = { $in: worker.assignedRoutes };
        console.log("GET /api/shops - Applying filter query:", JSON.stringify(query));
      } else {
        console.log("GET /api/shops - Worker has no assigned routes, returning empty shops list");
        return res.json([]);
      }
    } else {
      console.log("GET /api/shops - No valid workerId provided, returning all shops (Owner view)");
    }

    const shops = await Shop.find(query);
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/shops', async (req, res) => {
  try {
    const shop = new Shop(req.body);
    await shop.save();
    res.status(201).json(shop);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.put('/api/shops/:id', async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (shop) {
      res.json(shop);
    } else {
      res.status(404).json({ message: 'Shop not found' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.delete('/api/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.delete('/api/shops/:id', async (req, res) => {
  try {
    await Shop.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/routes', async (req, res) => {
  try {
    const { workerId } = req.query;
    console.log("GET /api/routes - Received workerId query param:", workerId);
    let query = {};

    if (workerId && workerId !== 'undefined' && workerId !== 'null') {
      if (!mongoose.Types.ObjectId.isValid(workerId)) {
        console.warn("GET /api/routes - Invalid workerId format:", workerId);
        return res.status(400).json({ message: "Invalid worker ID format" });
      }

      const worker = await Worker.findById(workerId);
      if (!worker) {
        console.warn("GET /api/routes - Worker not found for ID:", workerId);
        return res.status(404).json({ message: "Worker not found" });
      }

      console.log(`GET /api/routes - Worker: ${worker.name}, Assigned Routes: [${worker.assignedRoutes.join(', ')}]`);

      if (worker.assignedRoutes && worker.assignedRoutes.length > 0) {
        query.name = { $in: worker.assignedRoutes };
        console.log("GET /api/routes - Applying filter query:", JSON.stringify(query));
      } else {
        console.log("GET /api/routes - Worker has no assigned routes, returning empty routes list");
        return res.json([]);
      }
    } else {
      console.log("GET /api/routes - No valid workerId provided, returning all routes (Owner view)");
    }

    const routeGroups = await Route.find(query);
    res.json(routeGroups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/routes', async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    res.status(201).json(route);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Workers API
app.get('/api/workers', async (req, res) => {
  try {
    const workersList = await Worker.find();
    res.json(workersList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/workers', async (req, res) => {
  try {
    console.log("POST /api/workers - Incoming data:", JSON.stringify(req.body, null, 2));
    const workerData = { ...req.body };
    if (workerData.username) {
      workerData.username = workerData.username.toLowerCase().trim();
    }
    const worker = new Worker(workerData);
    await worker.save();
    console.log("POST /api/workers - Created worker:", worker.name, "with routes:", worker.assignedRoutes);
    res.status(201).json(worker);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.put('/api/workers/:id', async (req, res) => {
  try {
    console.log("PUT /api/workers/:id - body:", req.body);
    const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (worker) {
      console.log("Worker updated successfully:", worker.name, "assignedRoutes:", worker.assignedRoutes);
      res.json(worker);
    } else {
      res.status(404).json({ message: 'Worker not found' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.delete('/api/workers/:id', async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username === 'owner' && password === 'owner123') {
      return res.json({ role: 'owner', name: 'Varun Owner' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database connection is not ready. Please try again in a moment.' });
    }

    const worker = await Worker.findOne({
      username: { $regex: new RegExp(`^${username.trim()}$`, 'i') }
    });

    if (worker && await worker.comparePassword(password)) {
      console.log("Login successful for worker:", worker.username, "ID:", worker._id);
      return res.json({
        role: 'worker',
        name: worker.name,
        id: worker._id, // Use _id explicitly to be safe
        _id: worker._id,
        username: worker.username,
        assignedRoutes: worker.assignedRoutes || []
      });
    } else {
      console.log("Login failed for username:", username.trim(), "(case-insensitive search)");
    }

    res.status(401).json({ message: 'Invalid username or password' });
  } catch (err) {
    res.status(500).json({ message: 'An internal error occurred during login' });
  }
});

app.post('/api/attendance/start', upload.single('photo'), async (req, res) => {
  try {
    const entry = new Attendance({
      workerName: req.body.workerName,
      photo: req.file ? req.file.path : null,
      status: 'working'
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/attendance/end', async (req, res) => {
  try {
    const entry = await Attendance.findOne({ workerName: req.body.workerName, status: 'working' });
    if (entry) {
      entry.endTime = new Date();
      entry.status = 'completed';
      await entry.save();
      res.json(entry);
    } else {
      res.status(404).json({ message: 'Active session not found' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const attendance = await Attendance.find();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/visits', upload.single('photo'), async (req, res) => {
  try {
    const visit = new Visit({
      shopName: req.body.shopName,
      workerName: req.body.workerName,
      notes: req.body.notes,
      photo: req.file ? req.file.path : null
    });
    await visit.save();
    res.status(201).json(visit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Orders API
app.get('/api/orders', async (req, res) => {
  try {
    const { workerId, shopName, workerName, routeName } = req.query;
    const query = {};
    if (workerId) query.workerId = workerId;
    if (shopName) query.shopName = shopName;
    if (workerName) query.workerName = workerName;
    if (routeName) query.routeName = routeName;

    const orders = await Order.find(query).sort({ timestamp: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.put('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.delete('/api/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/visits', async (req, res) => {
  try {
    const { workerName, shopName } = req.query;
    const query = {};
    if (workerName) query.workerName = workerName;
    if (shopName) query.shopName = shopName;

    const visitsList = await Visit.find(query).sort({ timestamp: -1 });
    res.json(visitsList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
