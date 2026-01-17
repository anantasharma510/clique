// eSewa Configuration
// This file manages all eSewa-related configuration with proper environment handling

export interface ESewaConfig {
  // Core eSewa settings
  SECRET_KEY: string;
  PRODUCT_CODE: string;
  MERCHANT_ID: string;
  
  // URLs
  SUCCESS_URL: string;
  FAILURE_URL: string;
  VERIFICATION_URL: string;
  
  // Security settings
  ENABLE_STRICT_SIGNATURE: boolean;
  ENABLE_IP_WHITELIST: boolean;
  ENABLE_TIMESTAMP_VALIDATION: boolean;
  
  // Rate limiting
  WEBHOOK_RATE_LIMIT: number;
  WEBHOOK_WINDOW_MS: number;
  
  // IP whitelist for production
  IP_WHITELIST: string[];
  
  // Development settings
  DEVELOPMENT_IPS: string[];
}

// Environment-based configuration
const getESewaConfig = (): ESewaConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  // Base configuration - ALL credentials must come from environment variables
  const baseConfig: ESewaConfig = {
    // Core settings - ALWAYS use environment variables
    SECRET_KEY: process.env.ESEWA_SECRET_KEY || "",
    PRODUCT_CODE: process.env.ESEWA_PRODUCT_CODE || "",
    MERCHANT_ID: process.env.ESEWA_MERCHANT_ID || "",
    
    // URLs
    SUCCESS_URL: process.env.ESEWA_SUCCESS_URL || "",
    FAILURE_URL: process.env.ESEWA_FAILURE_URL || "",
    VERIFICATION_URL: process.env.ESEWA_VERIFICATION_URL || "https://esewa.com.np/epay/transrec",
    
    // Security settings - strict in production, relaxed in development
    ENABLE_STRICT_SIGNATURE: isProduction,
    ENABLE_IP_WHITELIST: isProduction,
    ENABLE_TIMESTAMP_VALIDATION: isProduction,
    
    // Rate limiting
    WEBHOOK_RATE_LIMIT: parseInt(process.env.ESEWA_WEBHOOK_RATE_LIMIT || "10"),
    WEBHOOK_WINDOW_MS: parseInt(process.env.ESEWA_WEBHOOK_WINDOW_MS || "60000"),
    
    // IP whitelist for production (get these from eSewa)
    IP_WHITELIST: [
      '103.21.244.0/22',
      '103.22.200.0/22',
      '104.16.0.0/12',
      '172.64.0.0/13',
      // Add more eSewa IP ranges as provided by eSewa
    ],
    
    // Development IPs
    DEVELOPMENT_IPS: [
      '127.0.0.1',
      '::1',
      'localhost'
    ]
  };
  
  // Production overrides
  if (isProduction) {
    // Ensure all required environment variables are set in production
    const requiredEnvVars = [
      'ESEWA_SECRET_KEY',
      'ESEWA_PRODUCT_CODE', 
      'ESEWA_MERCHANT_ID',
      'ESEWA_SUCCESS_URL',
      'ESEWA_FAILURE_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required eSewa environment variables in production: ${missingVars.join(', ')}`);
    }
    
    // Override with production values
    baseConfig.SECRET_KEY = process.env.ESEWA_SECRET_KEY!;
    baseConfig.PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE!;
    baseConfig.MERCHANT_ID = process.env.ESEWA_MERCHANT_ID!;
    baseConfig.SUCCESS_URL = process.env.ESEWA_SUCCESS_URL!;
    baseConfig.FAILURE_URL = process.env.ESEWA_FAILURE_URL!;
    baseConfig.VERIFICATION_URL = process.env.ESEWA_VERIFICATION_URL || "";
    
    // Strict security in production
    baseConfig.ENABLE_STRICT_SIGNATURE = true;
    baseConfig.ENABLE_IP_WHITELIST = true;
    baseConfig.ENABLE_TIMESTAMP_VALIDATION = true;
  }
  
  // Development overrides - NO HARDCODED CREDENTIALS
  if (isDevelopment || isTest) {
    // Relaxed security for development
    baseConfig.ENABLE_STRICT_SIGNATURE = false;
    baseConfig.ENABLE_IP_WHITELIST = false;
    baseConfig.ENABLE_TIMESTAMP_VALIDATION = false;
    
    // Check if development credentials are provided in environment
    if (!process.env.ESEWA_SECRET_KEY || !process.env.ESEWA_PRODUCT_CODE || !process.env.ESEWA_MERCHANT_ID) {
      console.warn('[eSewa Config] Development mode: Missing eSewa credentials in environment variables.');
      console.warn('[eSewa Config] Please set ESEWA_SECRET_KEY, ESEWA_PRODUCT_CODE, and ESEWA_MERCHANT_ID in your .env file.');
      console.warn('[eSewa Config] You can get test credentials from eSewa developer portal.');
    }
  }
  
  return baseConfig;
};

// Export the configuration
export const ESEWA_CONFIG = getESewaConfig();

// Validation function
export const validateESewaConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!ESEWA_CONFIG.SECRET_KEY) {
    errors.push('ESEWA_SECRET_KEY is required');
  }
  
  if (!ESEWA_CONFIG.PRODUCT_CODE) {
    errors.push('ESEWA_PRODUCT_CODE is required');
  }
  
  if (!ESEWA_CONFIG.MERCHANT_ID) {
    errors.push('ESEWA_MERCHANT_ID is required');
  }
  
  if (!ESEWA_CONFIG.SUCCESS_URL) {
    errors.push('ESEWA_SUCCESS_URL is required');
  }
  
  if (!ESEWA_CONFIG.FAILURE_URL) {
    errors.push('ESEWA_FAILURE_URL is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Log configuration status (without sensitive data)
export const logESewaConfigStatus = (): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('[eSewa Config] Environment:', process.env.NODE_ENV);
  console.log('[eSewa Config] Product Code:', ESEWA_CONFIG.PRODUCT_CODE);
  console.log('[eSewa Config] Merchant ID:', ESEWA_CONFIG.MERCHANT_ID);
  console.log('[eSewa Config] Success URL:', ESEWA_CONFIG.SUCCESS_URL);
  console.log('[eSewa Config] Failure URL:', ESEWA_CONFIG.FAILURE_URL);
  console.log('[eSewa Config] Strict Signature:', ESEWA_CONFIG.ENABLE_STRICT_SIGNATURE);
  console.log('[eSewa Config] IP Whitelist:', ESEWA_CONFIG.ENABLE_IP_WHITELIST);
  console.log('[eSewa Config] Timestamp Validation:', ESEWA_CONFIG.ENABLE_TIMESTAMP_VALIDATION);
  
  if (!isProduction) {
    console.log('[eSewa Config] Development mode: Using environment variables for credentials');
    if (!process.env.ESEWA_SECRET_KEY) {
      console.warn('[eSewa Config] ⚠️  ESEWA_SECRET_KEY not set in environment');
    }
    if (!process.env.ESEWA_PRODUCT_CODE) {
      console.warn('[eSewa Config] ⚠️  ESEWA_PRODUCT_CODE not set in environment');
    }
    if (!process.env.ESEWA_MERCHANT_ID) {
      console.warn('[eSewa Config] ⚠️  ESEWA_MERCHANT_ID not set in environment');
    }
  }
  
  const validation = validateESewaConfig();
  if (!validation.valid) {
    console.error('[eSewa Config] Configuration errors:', validation.errors);
  } else {
    console.log('[eSewa Config] ✅ Configuration is valid');
  }
}; 