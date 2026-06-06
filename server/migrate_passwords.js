const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Worker = require('./models/Worker');

async function migrate() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/varun-nutrition';
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const workers = await Worker.find();
    console.log(`Checking ${workers.length} workers...`);

    let count = 0;
    for (const worker of workers) {
      if (!worker.password.startsWith('$2a$') && !worker.password.startsWith('$2b$')) {
        console.log(`Hashing password for worker: ${worker.username}`);
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(worker.password, salt);
        await Worker.updateOne({ _id: worker._id }, { password: hashed });
        count++;
      }
    }

    console.log(`Migration complete. ${count} passwords hashed.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
