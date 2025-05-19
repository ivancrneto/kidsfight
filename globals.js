"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEV = void 0;
// globals.ts
// Use Parcel's process.env.NODE_ENV to set DEV
exports.DEV = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
// Log the environment for debugging
console.log('[globals.ts] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    DEV: exports.DEV,
    processEnv: process.env
});
