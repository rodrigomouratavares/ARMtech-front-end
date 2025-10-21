import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { authService } from '../src/services/auth.service';
import { db, checkDatabaseConnection } from '../src/db/connection';
import { users } from '../src/db/schema/users';
import { CreateUserData, LoginCredentials } from '../src/types/auth.types';
import { generateToken } from '../src/utils/jwt';

describe('Auth Service Database Integration', () => {
    // Test data
    const testUser1: CreateUserData = {
        email: 'admin@test.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
    };

    const testUser2: CreateUserData = {
        email: 'manager@test.com',
        password: 'manager123',
        name: 'Manager User',
        role: 'manager'
    };

    const testUser3: CreateUserData = {
        email: 'employee@test.com',
        password: 'employee123',
        name: 'Employee User',
        role: 'employee'
    };

    beforeAll(async () => {
        // Verify database connection
        const isConnected = await checkDatabaseConnection();
        expect(isConnected).toBe(true);
    });

    beforeEach(async () => {
        // Clean up test data before each test
        await db.delete(users);
    });

    afterAll(async () => {
        // Clean up test data after all tests
        await db.delete(users);
    });

    describe('User Registration', () => {
        it('should register a new user with valid data', async () => {
            const user = await authService.register(testUser1);

            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.email).toBe(testUser1.email.toLowerCase());
            expect(user.name).toBe(testUser1.name);
            expect(user.role).toBe(testUser1.role);
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
            expect(user).not.toHaveProperty('password'); // Password should not be returned
        });

        it('should convert email to lowercase during registration', async () => {
            const userWithUppercaseEmail = {
                ...testUser1,
                email: 'ADMIN@TEST.COM'
            };

            const user = await authService.register(userWithUppercaseEmail);
            expect(user.email).toBe('admin@test.com');
        });

        it('should hash password during registration', async () => {
            await authService.register(testUser1);

            // Retrieve user directly from database to check password is hashed
            const dbUser = await db
                .select()
                .from(users)
                .where(eq(users.email, testUser1.email.toLowerCase()))
                .limit(1);

            expect(dbUser[0].password).not.toBe(testUser1.password);
            expect(dbUser[0].password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
        });

        it('should enforce email uniqueness', async () => {
            await authService.register(testUser1);

            const duplicateUser = {
                ...testUser2,
                email: testUser1.email // Same email
            };

            await expect(
                authService.register(duplicateUser)
            ).rejects.toThrow('User with this email already exists');
        });

        it('should handle case-insensitive email uniqueness', async () => {
            await authService.register(testUser1);

            const duplicateUser = {
                ...testUser2,
                email: testUser1.email.toUpperCase() // Same email, different case
            };

            await expect(
                authService.register(duplicateUser)
            ).rejects.toThrow('User with this email already exists');
        });

        it('should register users with different roles', async () => {
            const adminUser = await authService.register(testUser1);
            const managerUser = await authService.register(testUser2);
            const employeeUser = await authService.register(testUser3);

            expect(adminUser.role).toBe('admin');
            expect(managerUser.role).toBe('manager');
            expect(employeeUser.role).toBe('employee');
        });
    });

    describe('User Authentication', () => {
        beforeEach(async () => {
            // Create test users for authentication tests
            await authService.register(testUser1);
            await authService.register(testUser2);
        });

        it('should authenticate user with valid credentials', async () => {
            const credentials: LoginCredentials = {
                email: testUser1.email,
                password: testUser1.password
            };

            const authResponse = await authService.login(credentials);

            expect(authResponse).toBeDefined();
            expect(authResponse.user).toBeDefined();
            expect(authResponse.token).toBeDefined();
            expect(authResponse.user.email).toBe(testUser1.email.toLowerCase());
            expect(authResponse.user.name).toBe(testUser1.name);
            expect(authResponse.user.role).toBe(testUser1.role);
            expect(authResponse.user).not.toHaveProperty('password');
            expect(typeof authResponse.token).toBe('string');
        });

        it('should handle case-insensitive email login', async () => {
            const credentials: LoginCredentials = {
                email: testUser1.email.toUpperCase(),
                password: testUser1.password
            };

            const authResponse = await authService.login(credentials);
            expect(authResponse.user.email).toBe(testUser1.email.toLowerCase());
        });

        it('should reject authentication with invalid email', async () => {
            const credentials: LoginCredentials = {
                email: 'nonexistent@test.com',
                password: testUser1.password
            };

            await expect(
                authService.login(credentials)
            ).rejects.toThrow('Invalid email or password');
        });

        it('should reject authentication with invalid password', async () => {
            const credentials: LoginCredentials = {
                email: testUser1.email,
                password: 'wrongpassword'
            };

            await expect(
                authService.login(credentials)
            ).rejects.toThrow('Invalid email or password');
        });

        it('should authenticate different user roles', async () => {
            const adminAuth = await authService.login({
                email: testUser1.email,
                password: testUser1.password
            });

            const managerAuth = await authService.login({
                email: testUser2.email,
                password: testUser2.password
            });

            expect(adminAuth.user.role).toBe('admin');
            expect(managerAuth.user.role).toBe('manager');
        });
    });

    describe('Token Validation', () => {
        let testUserId: string;
        let validToken: string;

        beforeEach(async () => {
            const user = await authService.register(testUser1);
            testUserId = user.id;

            // Generate a valid token
            validToken = await generateToken({
                userId: user.id,
                email: user.email,
                role: user.role
            });
        });

        it('should validate valid token and return user data', async () => {
            const user = await authService.validateToken(validToken);

            expect(user).toBeDefined();
            expect(user.id).toBe(testUserId);
            expect(user.email).toBe(testUser1.email.toLowerCase());
            expect(user.name).toBe(testUser1.name);
            expect(user.role).toBe(testUser1.role);
            expect(user).not.toHaveProperty('password');
        });

        it('should reject invalid token', async () => {
            const invalidToken = 'invalid.token.here';

            await expect(
                authService.validateToken(invalidToken)
            ).rejects.toThrow('Invalid or expired token');
        });

        it('should reject token for non-existent user', async () => {
            // Generate token with non-existent user ID
            const tokenForNonExistentUser = await generateToken({
                userId: '550e8400-e29b-41d4-a716-446655440000',
                email: 'nonexistent@test.com',
                role: 'admin'
            });

            await expect(
                authService.validateToken(tokenForNonExistentUser)
            ).rejects.toThrow('Invalid or expired token');
        });

        it('should reject malformed token', async () => {
            const malformedToken = 'not.a.valid.jwt.token';

            await expect(
                authService.validateToken(malformedToken)
            ).rejects.toThrow('Invalid or expired token');
        });
    });

    describe('User Lookup Methods', () => {
        let testUserId: string;

        beforeEach(async () => {
            const user = await authService.register(testUser1);
            testUserId = user.id;
        });

        it('should find user by ID', async () => {
            const user = await authService.findById(testUserId);

            expect(user).toBeDefined();
            expect(user!.id).toBe(testUserId);
            expect(user!.email).toBe(testUser1.email.toLowerCase());
            expect(user!.name).toBe(testUser1.name);
            expect(user!.role).toBe(testUser1.role);
            expect(user!).not.toHaveProperty('password');
        });

        it('should return null for non-existent user ID', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
            const user = await authService.findById(nonExistentId);

            expect(user).toBeNull();
        });

        it('should find user by email', async () => {
            const user = await authService.findByEmail(testUser1.email);

            expect(user).toBeDefined();
            expect(user!.id).toBe(testUserId);
            expect(user!.email).toBe(testUser1.email.toLowerCase());
            expect(user!.name).toBe(testUser1.name);
            expect(user!.role).toBe(testUser1.role);
            expect(user!).not.toHaveProperty('password');
        });

        it('should handle case-insensitive email lookup', async () => {
            const user = await authService.findByEmail(testUser1.email.toUpperCase());

            expect(user).toBeDefined();
            expect(user!.email).toBe(testUser1.email.toLowerCase());
        });

        it('should return null for non-existent email', async () => {
            const user = await authService.findByEmail('nonexistent@test.com');

            expect(user).toBeNull();
        });
    });

    describe('Password Management', () => {
        it('should hash passwords correctly', async () => {
            const password = 'testpassword123';
            const hashedPassword = await authService.hashPassword(password);

            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
            expect(hashedPassword.length).toBeGreaterThan(50);
        });

        it('should compare passwords correctly', async () => {
            const password = 'testpassword123';
            const hashedPassword = await authService.hashPassword(password);

            const isValid = await authService.comparePassword(password, hashedPassword);
            const isInvalid = await authService.comparePassword('wrongpassword', hashedPassword);

            expect(isValid).toBe(true);
            expect(isInvalid).toBe(false);
        });

        it('should generate different hashes for same password', async () => {
            const password = 'testpassword123';
            const hash1 = await authService.hashPassword(password);
            const hash2 = await authService.hashPassword(password);

            expect(hash1).not.toBe(hash2); // Salt should make them different

            // But both should validate correctly
            const isValid1 = await authService.comparePassword(password, hash1);
            const isValid2 = await authService.comparePassword(password, hash2);

            expect(isValid1).toBe(true);
            expect(isValid2).toBe(true);
        });
    });

    describe('Role-Based Access Control', () => {
        beforeEach(async () => {
            await authService.register(testUser1); // admin
            await authService.register(testUser2); // manager
            await authService.register(testUser3); // employee
        });

        it('should maintain user roles correctly', async () => {
            const adminAuth = await authService.login({
                email: testUser1.email,
                password: testUser1.password
            });

            const managerAuth = await authService.login({
                email: testUser2.email,
                password: testUser2.password
            });

            const employeeAuth = await authService.login({
                email: testUser3.email,
                password: testUser3.password
            });

            expect(adminAuth.user.role).toBe('admin');
            expect(managerAuth.user.role).toBe('manager');
            expect(employeeAuth.user.role).toBe('employee');
        });

        it('should include role in token validation', async () => {
            const adminAuth = await authService.login({
                email: testUser1.email,
                password: testUser1.password
            });

            const validatedUser = await authService.validateToken(adminAuth.token);
            expect(validatedUser.role).toBe('admin');
        });
    });

    describe('Data Persistence', () => {
        it('should persist user data between operations', async () => {
            // Register user
            const registeredUser = await authService.register(testUser1);

            // Find user by ID in separate operation
            const foundById = await authService.findById(registeredUser.id);
            expect(foundById).toBeDefined();
            expect(foundById!.name).toBe(testUser1.name);

            // Find user by email in separate operation
            const foundByEmail = await authService.findByEmail(testUser1.email);
            expect(foundByEmail).toBeDefined();
            expect(foundByEmail!.id).toBe(registeredUser.id);

            // Authenticate user
            const authResponse = await authService.login({
                email: testUser1.email,
                password: testUser1.password
            });
            expect(authResponse.user.id).toBe(registeredUser.id);

            // Validate token
            const validatedUser = await authService.validateToken(authResponse.token);
            expect(validatedUser.id).toBe(registeredUser.id);
        });
    });

    describe('Database Constraints', () => {
        it('should enforce email uniqueness at database level', async () => {
            await authService.register(testUser1);

            // Try to insert duplicate email directly (should be caught by service layer)
            const duplicateUser = {
                ...testUser2,
                email: testUser1.email
            };

            await expect(
                authService.register(duplicateUser)
            ).rejects.toThrow('User with this email already exists');
        });

        it('should handle all valid user roles', async () => {
            const adminUser = await authService.register({ ...testUser1, role: 'admin' });
            const managerUser = await authService.register({ ...testUser2, role: 'manager' });
            const employeeUser = await authService.register({ ...testUser3, role: 'employee' });

            expect(adminUser.role).toBe('admin');
            expect(managerUser.role).toBe('manager');
            expect(employeeUser.role).toBe('employee');
        });
    });
});