// globals.ts
// Use Parcel's process.env.NODE_ENV to set DEV
export const DEV: boolean = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';

// Log the environment for debugging
console.log('[globals.ts] Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  DEV: DEV,
  processEnv: process.env
});
