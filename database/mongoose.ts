// Next.js can run server code multiple times, which would normally create multiple MongoDB connections and cause performance issues. 
// To prevent this, we store and reuse a cached database connection across hot reloads and server executions. 
// This ensures only one connection is created and reused throughout the app lifecycle.

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;              // resolved connection
        promise: Promise<typeof mongoose> | null;  // connection in-progress
    }
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {

    if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined in env');


    if (cached.conn) return cached.conn;

    // prevents multiple connections from being created simultaneously
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }

    try {
        // await the connection and store it in the cache
        cached.conn = await cached.promise;
    } catch (error) {
        // reset cache if connection fails, so we can retry later
        cached.promise = null;
        throw error;
    }

    console.log(`MongoDB connected: ${process.env.NODE_ENV} - ${MONGODB_URI}`);
};