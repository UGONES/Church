import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env file securely
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Connection configuration - FIXED SSL/TLS conflict
const MONGODB_CONFIG = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  w: 'majority',
  authSource: 'admin',
  compressors: ['zlib'],
  zlibCompressionLevel: 6,

  // Security enhancements
  autoIndex: process.env.NODE_ENV === 'development',

  // FIXED: Use either ssl OR tls, not both
  ssl: process.env.NODE_ENV === 'production',
  // Remove conflicting tls settings when using ssl
  ...(process.env.NODE_ENV === 'production' && {
    sslValidate: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
  }),

  // Replica set options
  replicaSet: process.env.MONGODB_REPLICA_SET || null,
  readPreference: 'primary',
};

// Connection state management
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 10;
const RETRY_DELAY = 5000;
const connectionHandlers = new Set();

// Synchronize isConnected with actual mongoose connection state
const updateConnectionStatus = () => {
  const previousState = isConnected;
  isConnected = mongoose.connection.readyState === 1;

  // Only log if state actually changed
  if (previousState !== isConnected) {
    console.log(`🔄 Connection state changed: ${previousState ? 'Connected' : 'Disconnected'} → ${isConnected ? 'Connected' : 'Disconnected'}`);
  }
  return isConnected;
};

// Event handlers for connection monitoring
const setupConnectionEvents = () => {
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
    isConnected = true;
    connectionRetries = 0;
    notifyConnectionHandlers(true);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
    isConnected = false;
    notifyConnectionHandlers(false);
  });

  mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error.message);
    isConnected = false;
    notifyConnectionHandlers(false, error);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
    isConnected = true;
    connectionRetries = 0;
    notifyConnectionHandlers(true);
  });

  mongoose.connection.on('reconnectFailed', () => {
    console.error('💥 MongoDB reconnect failed');
    isConnected = false;
    notifyConnectionHandlers(false, new Error('Reconnection failed'));
  });
};

// Notify all registered connection handlers
const notifyConnectionHandlers = (connected, error = null) => {
  connectionHandlers.forEach(handler => {
    try {
      handler(connected, error);
    } catch (err) {
      console.error('Error in connection handler:', err);
    }
  });
};

// Validate MongoDB URI for security
const validateMongoDBURI = (uri) => {
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  // Basic URI validation
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('Invalid MongoDB URI format');
  }

  // Check for common security issues
  if (uri.includes('<') || uri.includes('>')) {
    throw new Error('MongoDB URI contains invalid characters');
  }

  return uri;
};

// Secure connection function with exponential backoff
const connectDB = async (retries = MAX_RETRIES, delay = RETRY_DELAY) => {
  if (updateConnectionStatus()) {
    console.log('✅ Using existing MongoDB connection');
    return mongoose.connection;
  }

  try {
    // Prevent multiple connection attempts
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      console.log('📡 MongoDB connection already established or connecting');
      updateConnectionStatus();
      return mongoose.connection;
    }

    console.log(`⏳ Attempting MongoDB connection (attempt ${connectionRetries + 1}/${MAX_RETRIES})...`);

    // Validate and secure the connection URI
    const mongoURI = validateMongoDBURI(process.env.MONGODB_URI);

    // FIXED: Simplified configuration to avoid SSL/TLS conflicts
    const connectionConfig = {
      ...MONGODB_CONFIG,
      // Use simplified SSL configuration for MongoDB Atlas
      ssl: true, // Always use SSL for MongoDB Atlas
      sslValidate: true,
    };

    // Set mongoose global options for security
    mongoose.set('strictQuery', true);
    mongoose.set('autoIndex', MONGODB_CONFIG.autoIndex);
    mongoose.set('bufferCommands', MONGODB_CONFIG.bufferCommands);

    const conn = await mongoose.connect(mongoURI, connectionConfig);

    console.log(`🚀 MongoDB Connected successfully to: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`👤 User: ${conn.connection.user || 'Not authenticated'}`);
    console.log(`🔗 Connection state: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    isConnected = true;
    connectionRetries = 0;

    return conn;

  } catch (error) {
    console.error(`❌ Database connection error (attempt ${connectionRetries + 1}):`, error.message);

    isConnected = false;

    // Enhanced error handling with specific recommendations
    if (error.message.includes("EAI_AGAIN")) {
      console.warn("🌐 DNS resolution issue — check network connectivity");
    } else if (error.message.includes("Authentication failed")) {
      console.warn("🔐 Authentication failed — check credentials");
    } else if (error.message.includes("ENOTFOUND")) {
      console.warn("🌐 Host not found — check MongoDB URI");
    } else if (error.message.includes("ETIMEDOUT")) {
      console.warn("⏰ Connection timeout — check network/firewall");
    } else if (error.message.includes("tls/ssl must be the same")) {
      console.warn("🔧 SSL/TLS configuration conflict — using simplified SSL settings");
    }

    connectionRetries++;

    if (connectionRetries <= retries) {
      const nextDelay = Math.min(delay * Math.pow(1.5, connectionRetries - 1), 30000);
      console.log(`🔁 Retrying in ${nextDelay / 1000}s... (${retries - connectionRetries + 1} attempts left)`);

      await new Promise(resolve => setTimeout(resolve, nextDelay));
      return connectDB(retries, delay);
    } else {
      console.error("💥 All MongoDB connection attempts failed.");

      isConnected = false;

      // Try one more time with minimal configuration
      console.log("🔄 Attempting connection with minimal configuration...");
      try {
        const minimalConfig = {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 10000,
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, minimalConfig);
        console.log('✅ Connected with minimal configuration');
        isConnected = true;
        return conn;
      } catch (finalError) {
        console.error('💥 Final connection attempt failed:', finalError.message);

        isConnected = false;

        // Notify handlers of final failure
        notifyConnectionHandlers(false, finalError);

        // In production, we might want to exit gracefully
        if (process.env.NODE_ENV === 'production') {
          console.error('🚨 Critical: Database connection failed in production');
          process.exit(1);
        }

        throw finalError;
      }
    }
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed gracefully');
    }

    isConnected = false;

    console.log('👋 Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    isConnected = false;
    process.exit(1);
  }
};

// Setup graceful shutdown handlers
const setupGracefulShutdown = () => {
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    isConnected = false;
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    isConnected = false;
    gracefulShutdown('unhandledRejection');
  });
};

// Connection status utility functions
export const getConnectionStatus = () => ({
  isConnected: isConnected && mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host,
  name: mongoose.connection.name,
  models: Object.keys(mongoose.connection.models),
});

export const waitForConnection = (timeout = 30000) => {
  return new Promise((resolve, reject) => {
    if (updateConnectionStatus()) {
      resolve(getConnectionStatus());
      return;
    }

    const timeoutId = setTimeout(() => {
      connectionHandlers.delete(handler);
      reject(new Error('Connection timeout'));
    }, timeout);

    const handler = (connected, error) => {
      if (connected) {
        clearTimeout(timeoutId);
        connectionHandlers.delete(handler);
        resolve(getConnectionStatus());
      } else if (error) {
        clearTimeout(timeoutId);
        connectionHandlers.delete(handler);
        reject(error);
      }
    };

    connectionHandlers.add(handler);
  });
};

// Register connection event handler
export const onConnectionChange = (handler) => {
  if (typeof handler !== 'function') {
    throw new Error('Connection handler must be a function');
  }

  connectionHandlers.add(handler);

  // Return unsubscribe function
  return () => connectionHandlers.delete(handler);
};

// Initialize connection management
setupConnectionEvents();
setupGracefulShutdown();

export default connectDB;