// Environment configuration utility
export const env = {
  AUTHING_APP_ID: process.env.NEXT_PUBLIC_AUTHING_APP_ID,
  AUTHING_USERPOOL_ID: process.env.NEXT_PUBLIC_AUTHING_USERPOOL_ID,
  AUTHING_APP_HOST: process.env.NEXT_PUBLIC_AUTHING_APP_HOST,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

// Validate required environment variables
export function validateEnv() {
  const requiredVars = [
    'NEXT_PUBLIC_AUTHING_APP_ID',
    'NEXT_PUBLIC_AUTHING_USERPOOL_ID',
    'NEXT_PUBLIC_AUTHING_APP_HOST',
  ];

  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      `⚠️  Missing environment variables: ${missingVars.join(', ')}`
    );
    console.warn('Please create a .env.local file with these variables');
    console.warn('Your app may not work properly without these variables');
  } else {
    console.log('✅ All required environment variables are loaded!');
  }

  return env;
}

// Helper function to get environment variable with fallback
export function getEnvVar(key: keyof typeof env, fallback?: string): string {
  const value = env[key];
  if (!value && fallback) {
    console.warn(`⚠️  Environment variable ${key} is undefined, using fallback: ${fallback}`);
    return fallback;
  }
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
} 