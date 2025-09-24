// functions/src/common/cors.ts
import { Response } from 'express';

/**
 * Set CORS headers for HTTP responses
 */
export function setCORSHeaders(res: Response, origin?: string): void {
  // Allow specific origins based on your authorized domains
  const allowedOrigins = [
    // Firebase hosting domains
    'https://sakoonapp-9574c.web.app',
    'https://sakoonapp-9574c.firebaseapp.com',
    
    // Production domains
    'https://sakoonapp.in',
    'https://www.sakoonapp.in',
    'https://admin.sakoonapp.in',
    
    // Netlify domains
    'https://sakoonuserrready.netlify.app',
    'https://sakoonapplistener.netlify.app',
    
    // Development domains
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:8080',
    'http://localhost:4200',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:4200'
  ];

  // Check if the origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    // Allow all origins in development
    res.set('Access-Control-Allow-Origin', '*');
  } else {
    // In production, be more restrictive
    res.set('Access-Control-Allow-Origin', 'https://sakoonapp.in');
  }

  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', [
    'Origin',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Requested-With',
    'X-Webhook-Signature',
    'X-Webhook-Timestamp',
    'X-API-Key'
  ].join(', '));
  res.set('Access-Control-Max-Age', '3600');
}