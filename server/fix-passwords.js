const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Worker = require('./models/Worker');

async function fix() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/varun-nutrition';
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const workers = await Worker.find();
    for (const worker of workers) {
      // Check if password looks like a bcrypt hash
      if (!worker.password.startsWith('$2a$') && !worker.password.startsWith('$2b$')) {
        console.log(`Hashing password for worker: ${worker.username}`);
        // We need to re-save to trigger the pre-save hook,
        // OR manually hash it here.
        // Re-saving might not work if we just set the same plain text password because of isModified('password')
        // Actually isModified checks the field value.
        // Let's just manually hash and update to be sure.
        const salt = await bcrypt.genSalt(10);
        worker.password = await bcrypt.hash(worker.password, salt);
        await worker.save();
        console.log(`Done for ${worker.username}`);
      } else {
        console.log(`Worker ${worker.username} already has a hashed password.`);
      }
    }

    // Specifically ensure 'worker' / 'worker123' exists and is correct
    let demoWorker = await Worker.findOne({ username: 'worker' });
    if (!demoWorker) {
       console.log('Creating demo worker...');
       demoWorker = new Worker({ name: 'Sales Worker', username: 'worker', password: 'worker123' });
       await demoWorker.save();
       console.log('Demo worker created');
    } else {
       // If it exists but we want to make sure it's worker123?
       // The user said "Verify that: username: worker password: worker123 exists"
       // If we already hashed it, we can't easily know if it was 'worker123'
       // But if the user is having trouble, let's just reset it to 'worker123' (hashed)
       const isCorrect = await demoWorker.comparePassword('worker123');
       if (!isCorrect) {
         console.log('Resetting demo worker password to worker123');
         demoWorker.password = 'worker123'; // pre-save hook will hash it
         await demoWorker.save();
       }
    }

    console.log('Finished fixing passwords');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
