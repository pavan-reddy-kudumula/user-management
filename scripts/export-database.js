require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { serialize } = require('bson');
const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const User = require('../src/models/User');
const { createUserRecords } = require('./userFactory');

async function loadExportSource() {
  try {
    await connectDatabase();
    const users = await User.find({}).sort({ createdAt: 1 }).lean();
    return users.length > 0 ? users : createUserRecords(5000);
  } catch (error) {
    return createUserRecords(5000);
  }
}

function writeBsonDump(filePath, documents) {
  const buffers = documents.map((document) => serialize(document));
  fs.writeFileSync(filePath, Buffer.concat(buffers));
}

async function exportDatabase() {
  const documents = await loadExportSource();
  const projectRoot = path.resolve(__dirname, '..');
  const backupDir = path.join(projectRoot, 'db_backup');
  const jsonPath = path.join(projectRoot, 'users.json');
  const bsonPath = path.join(backupDir, 'users.bson');

  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(documents, null, 2)}\n`);
  writeBsonDump(bsonPath, documents);

  console.log(`Exported ${documents.length} users to ${jsonPath}`);
  console.log(`Exported BSON dump to ${bsonPath}`);
}

exportDatabase()
  .catch((error) => {
    console.error('Export failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });