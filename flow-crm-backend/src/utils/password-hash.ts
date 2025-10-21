import bcrypt from 'bcryptjs';

/**
 * Password hashing utilities using bcrypt
 */

/**
 * Hash a plain text password
 * @param password - Plain text password to hash
 * @returns Promise that resolves to hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Higher salt rounds for better security
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise that resolves to true if passwords match, false otherwise
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a salt for password hashing
 * @param rounds - Number of salt rounds (default: 12)
 * @returns Promise that resolves to generated salt
 */
export const generateSalt = async (rounds: number = 12): Promise<string> => {
  return await bcrypt.genSalt(rounds);
};