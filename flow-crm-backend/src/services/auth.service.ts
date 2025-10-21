import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { users } from '../db/schema/users';
import { hashPassword, comparePassword } from '../utils/password-hash';
import { generateToken, verifyToken } from '../utils/jwt';
import { User, CreateUserData, LoginCredentials, AuthResponse, AuthService } from '../types/auth.types';

/**
 * Authentication service implementation
 */
class AuthServiceImpl implements AuthService {
  /**
   * Authenticate user with email and password
   * @param credentials - User login credentials
   * @returns Promise that resolves to user data and JWT token
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (userResult.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = userResult[0];

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data without password
    const userResponse: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: userResponse,
      token,
    };
  }

  /**
   * Register a new user (admin only functionality)
   * @param userData - User registration data
   * @returns Promise that resolves to created user data
   */
  async register(userData: CreateUserData): Promise<User> {
    const { email, password, name, role, permissions } = userData;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const newUserResult = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
        permissions: permissions || null,
      })
      .returning();

    const newUser = newUserResult[0];

    // Return user data without password
    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
  }

  /**
   * Validate JWT token and return user data
   * @param token - JWT token to validate
   * @returns Promise that resolves to user data
   */
  async validateToken(token: string): Promise<User> {
    try {
      // Basic token format validation
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw new Error('Token is required and must be a non-empty string');
      }

      // Remove Bearer prefix if present (defensive programming)
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;

      if (!cleanToken) {
        throw new Error('Invalid token format');
      }

      // Verify and decode token with detailed error handling
      let payload: any;
      try {
        payload = await verifyToken(cleanToken);
      } catch (jwtError: any) {
        // Provide more specific error messages for different JWT errors
        if (jwtError.name === 'TokenExpiredError') {
          throw new Error('Token has expired');
        } else if (jwtError.name === 'JsonWebTokenError') {
          throw new Error('Invalid token format or signature');
        } else if (jwtError.name === 'NotBeforeError') {
          throw new Error('Token is not active yet');
        } else {
          throw new Error('Token validation failed');
        }
      }

      // Validate payload structure
      if (!payload || !payload.userId) {
        throw new Error('Invalid token payload: missing userId');
      }

      // Find user by ID from token with better error handling
      let userResult;
      try {
        userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, payload.userId))
          .limit(1);
      } catch (dbError) {
        throw new Error('Database error while validating user');
      }

      if (userResult.length === 0) {
        throw new Error('User not found or has been deactivated');
      }

      const user = userResult[0];

      // Additional security checks
      if (!user.id || !user.email) {
        throw new Error('Invalid user data retrieved from database');
      }

      // Verify token email matches user email (additional security)
      if (payload.email && payload.email !== user.email) {
        throw new Error('Token email mismatch with user data');
      }

      // Return user data without password
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      // Log the error for debugging but don't expose internal details
      console.error('Token validation error:', error);

      // Re-throw with generic message if it's not already a user-friendly message
      if (error instanceof Error && (
        error.message.includes('expired') ||
        error.message.includes('invalid') ||
        error.message.includes('required') ||
        error.message.includes('format') ||
        error.message.includes('not found') ||
        error.message.includes('deactivated') ||
        error.message.includes('mismatch')
      )) {
        throw error;
      }

      throw new Error('Authentication failed');
    }
  }

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Promise that resolves to hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return await hashPassword(password);
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns Promise that resolves to true if passwords match
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await comparePassword(password, hash);
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns Promise that resolves to user data or null
   */
  async findById(id: string): Promise<User | null> {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns Promise that resolves to user data or null
   */
  async findByEmail(email: string): Promise<User | null> {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

// Export singleton instance
export const authService = new AuthServiceImpl();