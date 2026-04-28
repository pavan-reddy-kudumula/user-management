require('dotenv').config();

const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const User = require('../src/models/User');
const { createUserRecords } = require('./userFactory');

async function seed() {
  await connectDatabase();

  const total = Number(process.env.SEED_COUNT || 5000);
  const users = createUserRecords(total);

  await User.deleteMany({});
  await User.insertMany(users, { ordered: false });

  console.log(`Seeded ${total} users`);
}

seed()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });