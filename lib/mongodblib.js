// lib/mongodb.js
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nrbtalents';
let cachedClient = null;
let cachedDb = null;

async function getDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  if (!cachedClient) {
    try {
      cachedClient = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await cachedClient.connect();
      console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  cachedDb = cachedClient.db();
  return cachedDb;
}

module.exports = {
  getDatabase
};