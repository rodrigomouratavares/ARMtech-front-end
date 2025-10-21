import jwt, { SignOptions, JwtPayload as JwtLibPayload } from 'jsonwebtoken';
import { jwtConfig, JwtPayload } from '../config/jwt';

/**
 * JWT token generation and validation utilities
 */

/**
 * Generate a JWT token for a user
 * @param payload - User data to include in token
 * @returns Promise that resolves to JWT token string
 */
export const generateToken = async (payload: Omit<JwtPayload, 'iat' | 'exp' | 'iss'>): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      jwtConfig.secret,
      {
        expiresIn: jwtConfig.expiresIn,
        issuer: jwtConfig.issuer,
      } as SignOptions,
      (error: Error | null, token?: string) => {
        if (error) {
          reject(error);
        } else {
          resolve(token as string);
        }
      }
    );
  });
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token string to verify
 * @returns Promise that resolves to decoded payload
 */
export const verifyToken = async (token: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      jwtConfig.secret,
      {
        issuer: jwtConfig.issuer,
      },
      (error: Error | null, decoded?: JwtLibPayload | string) => {
        if (error) {
          reject(error);
        } else {
          resolve(decoded as JwtPayload);
        }
      }
    );
  });
};

/**
 * Decode a JWT token without verification (for debugging purposes)
 * @param token - JWT token string to decode
 * @returns Decoded payload or null if invalid
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null if not found
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
};

/**
 * Check if a token is expired
 * @param token - JWT token string
 * @returns true if token is expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};