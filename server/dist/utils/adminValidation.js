"use strict";
/**
 * Shared admin secret key validation utility
 * Used by all admin operations to ensure consistent validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAdminSecretKey = validateAdminSecretKey;
/**
 * Validate admin secret key
 * Trims whitespace and compares with environment variable
 * @param secretKey - The secret key to validate
 * @returns true if valid, false otherwise
 */
function validateAdminSecretKey(secretKey) {
    const requestKey = secretKey?.trim();
    const envKey = process.env.ADMIN_SECRET_KEY?.trim();
    console.log('[DEBUG] validateAdminSecretKey() called:');
    console.log('  Input secretKey:', JSON.stringify(secretKey));
    console.log('  Trimmed requestKey:', JSON.stringify(requestKey));
    console.log('  process.env.ADMIN_SECRET_KEY:', JSON.stringify(process.env.ADMIN_SECRET_KEY));
    console.log('  Trimmed envKey:', JSON.stringify(envKey));
    console.log('  Comparison result:', requestKey === envKey);
    console.log('  requestKey type:', typeof requestKey, 'length:', requestKey?.length);
    console.log('  envKey type:', typeof envKey, 'length:', envKey?.length);
    const result = requestKey === envKey;
    console.log('  Final result:', result);
    return result;
}
