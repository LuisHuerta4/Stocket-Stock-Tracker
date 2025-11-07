// Initializes Better Auth and connects it to MongoDB using the mongodbAdapter.
// Automatically handles creating and managing user, session, and account collections.
// Manages password hashing, session handling, and OAuth providers out of the box.
// Uses a singleton pattern to prevent multiple Better Auth instances or DB connections
// from being created during hot reloads or multiple API calls in Next.js.

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";

// Keep a single shared instance of Better Auth to prevent reinitialization
let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {

    if (authInstance) return authInstance;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) throw new Error("Database connection is not established");

    authInstance = betterAuth({
        database: mongodbAdapter(db as any),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },
        plugins: [nextCookies()], // Handles authentication state via Next.js cookies
    });

    return authInstance;
};

export const auth = await getAuth();
