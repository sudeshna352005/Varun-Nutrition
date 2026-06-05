const mongoose = require('mongoose');
const Worker = require('./models/Worker');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/varun-nutrition';

async function migrate() {
  try {
    console.log('Connecting to MongoDB for migration...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const workers = await Worker.find();
    console.log(`Found ${workers.length} workers.`);

    for (const worker of workers) {
      const originalUsername = worker.username;
      const normalizedUsername = originalUsername.toLowerCase().trim();

      if (originalUsername !== normalizedUsername) {
        console.log(`Normalizing ${originalUsername} -> ${normalizedUsername}`);
        worker.username = normalizedUsername;
        await worker.save();
      }
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
