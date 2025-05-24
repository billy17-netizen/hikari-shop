/**
 * Midtrans API Configuration
 * 
 * Configuration for the Midtrans payment gateway integration.
 * We use environment variables for secure configuration.
 */

const MIDTRANS_CONFIG = {
  isProduction: process.env.MIDTRANS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-_xxxxxxxxxxxxxxxxxxxxxxxxx',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-_xxxxxxxxxxxxxxxxxxxxxxxxx',
};

// Base URLs for Midtrans API (automatically set based on environment)
const API_URL = MIDTRANS_CONFIG.isProduction 
  ? 'https://app.midtrans.com' 
  : 'https://app.sandbox.midtrans.com';

// Base URLs for Midtrans Snap.js (automatically set based on environment)
const SNAP_URL = MIDTRANS_CONFIG.isProduction
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';

module.exports = { 
  MIDTRANS_CONFIG,
  API_URL,
  SNAP_URL
}; 