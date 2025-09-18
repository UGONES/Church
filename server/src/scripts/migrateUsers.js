// scripts/migrateUsers.js
import mongoose from 'mongoose';
import User from '../../models/User.mjs';
import dotenv from 'dotenv';

dotenv.config();

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update existing users to have authMethod: 'local'
    const result = await User.updateMany(
      { 
        password: { $exists: true, $ne: null },
        authMethod: { $exists: false }
      },
      { 
        $set: { authMethod: 'local' }
      }
    );

    console.log(`Updated ${result.modifiedCount} users with authMethod: 'local'`);

    // Remove any empty password fields
    const cleanupResult = await User.updateMany(
      { 
        password: { $exists: true, $in: [null, ''] }
      },
      { 
        $unset: { password: '' }
      }
    );

    console.log(`Cleaned up ${cleanupResult.modifiedCount} users with empty passwords`);

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateUsers();