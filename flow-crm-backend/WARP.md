# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

Flow CRM Backend is a TypeScript-based REST API built with Fastify, PostgreSQL, and Drizzle ORM. It serves as the backend for a comprehensive CRM system managing customers, products, pre-sales, inventory, and reports with Brazilian business requirements (CPF validation, currency formatting, etc.).

**Key Technologies:**
- **Fastify**: Fast web framework with plugin architecture
- **TypeScript**: Strict typing with path aliases (`@/*` → `src/*`)
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **JWT**: Stateless authentication with role-based access control
- **Zod**: Runtime schema validation for all API inputs/outputs
- **Vitest**: Testing framework with integration and performance tests

## Common Development Commands

### Development Server
```bash
npm run dev              # Start development server with tsx watch
npm run build            # Compile TypeScript to JavaScript
npm start               # Start production server from dist/
```

### Database Operations
```bash
npm run db:generate     # Generate new Drizzle migration
npm run db:migrate      # Apply migrations to database
npm run db:seed         # Populate database with sample data
npm run db:verify       # Verify seed data integrity
npm run db:studio       # Open Drizzle Studio web interface
```

### Testing Commands
```bash
npm test               # Run all tests once (CI mode)
npm run test:watch     # Run tests in watch mode

# Run specific test suites
npm test -- auth-service-integration
npm test -- customer-service-integration
npm test -- presales-service-integration
npm test -- product-service-integration
npm test -- reports-api-integration
npm test -- price-calculations

# Run performance tests
npm test -- database-performance
```

### Deployment Commands
```bash
npm run render-build    # Render.com specific build command
npm run render-start    # Render.com specific start command
```

## Architecture Overview

### Project Structure Philosophy
The codebase follows a layered architecture with clear separation of concerns:

- **Controllers** (`src/controllers/`): HTTP request/response handling with Fastify
- **Services** (`src/services/`): Business logic and database operations
- **Routes** (`src/routes/`): Route definitions and middleware composition
- **Schemas** (`src/schemas/`): Zod validation schemas for input/output
- **Database** (`src/db/`): Drizzle ORM schemas, migrations, and connection
- **Config** (`src/config/`): Environment-specific configurations
- **Utils** (`src/utils/`): Shared utilities and Brazilian-specific validations

### Key Architectural Patterns

#### Database Layer with Drizzle ORM
- All database schemas defined in `src/db/schema/`
- Type-safe queries with automatic TypeScript inference
- Migration-based schema evolution in `drizzle/` directory
- Connection pooling and transaction support

#### Authentication & Authorization
- JWT-based stateless authentication
- Role-based access control (admin, manager, employee)
- Protected routes via Fastify hooks and decorators
- Password hashing with bcryptjs (12 salt rounds)

#### API Design Patterns
- RESTful endpoints with consistent response format
- Comprehensive error handling with structured error responses
- Request/response validation with Zod schemas
- CORS configuration for frontend integration
- Standardized pagination and filtering across all list endpoints

#### Brazilian Business Logic
- CPF validation with check digits in `src/utils/cpf.ts`
- Brazilian currency formatting (BRL)
- Auto-generated entity codes (PRD001, PAG001, etc.)
- Business-specific validation rules for customer and product management

### Testing Architecture
The application features comprehensive testing coverage:

#### Test Types and Structure
- **Integration Tests**: Service-level tests with real database
- **API Tests**: Full HTTP endpoint testing with Fastify
- **Performance Tests**: Database operation performance under load
- **End-to-End Tests**: Complete workflow testing

#### Test Configuration
- Vitest with Node.js environment
- Setup file at `tests/setup.ts` for common test utilities
- Path aliases configured (`@/*` → `src/*`)
- Database isolation for test runs

### Development Patterns

#### Environment Configuration
- Environment-specific settings in `src/config/environment.ts`
- Database configuration in `src/config/database.ts`
- JWT configuration in `src/config/jwt.ts`
- `.env.example` provides template for required variables

#### Error Handling
- Structured error responses with consistent format
- Custom error classes for business logic errors
- Comprehensive error logging with context
- Fastify error handlers for HTTP-specific errors

#### Code Quality
- Strict TypeScript configuration with comprehensive type checking
- Path aliases for clean imports
- Consistent code organization patterns
- Type-safe database operations throughout

## Database Schema Design

### Core Entities
- **Users**: Authentication with role-based permissions
- **Customers**: Brazilian CPF validation and business information
- **Products**: Auto-generated codes with inventory tracking
- **PreSales**: Complex workflow with item-level discounts
- **PaymentMethods**: Configurable payment options
- **AuditLogs**: Comprehensive activity tracking

### Key Features
- UUID primary keys for all entities
- Soft delete patterns where appropriate
- Created/updated timestamp tracking
- Foreign key relationships with proper indexing
- Database-level constraints for data integrity

## API Integration Points

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Current user profile
- `POST /api/auth/register` - User registration (admin only)
- `POST /api/auth/logout` - Session termination

### CRUD Operations
All entities follow consistent CRUD patterns:
- `GET /api/{entity}` - List with pagination/filtering
- `GET /api/{entity}/:id` - Get by ID
- `POST /api/{entity}` - Create new record
- `PUT /api/{entity}/:id` - Update existing record
- `DELETE /api/{entity}/:id` - Delete record

### Advanced Features
- `PUT /api/presales/:id/status` - PreSale status management
- `GET /api/reports/*` - Various business reports
- `POST /api/stock-adjustments` - Inventory management
- `GET /api/monitoring/health` - System health checks

## Development Workflow

### Database Migrations
1. Modify schema files in `src/db/schema/`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `drizzle/` directory
4. Apply migration: `npm run db:migrate`
5. Update seed data if necessary: `npm run db:seed`

### Testing Workflow
1. Write integration tests for new services
2. Add API tests for new endpoints
3. Include performance tests for database-heavy operations
4. Run full test suite before commits: `npm test`

### Deployment Considerations
- Environment variables properly configured for target environment
- Database migrations applied before deployment
- Health check endpoint available at `/api/monitoring/health`
- Build artifacts in `dist/` directory after `npm run build`

## Error Handling Patterns

### Standard Error Response Format
All API errors follow consistent JSON structure with:
- `error`: Error type/code
- `message`: Human-readable error message
- `details`: Additional context when available
- `timestamp`: ISO timestamp
- `path`: Request path that caused the error

### Common Error Scenarios
- Authentication failures (401)
- Authorization failures (403)
- Resource not found (404)
- Validation errors (400)
- Database constraint violations (409)
- Internal server errors (500)

## Performance Considerations

### Database Optimization
- Connection pooling configured in database connection
- Proper indexing on frequently queried columns
- Query optimization with Drizzle's type-safe queries
- Performance tests to catch regression

### API Response Optimization
- Pagination implemented for all list endpoints
- Field selection patterns for large datasets
- Caching strategies for frequently accessed data
- Response time monitoring capabilities

<citations>
<document>
<document_type>RULE</document_type>
<document_id>/Users/rodrigotavares/Projects/flow-crm/WARP.md</document_id>
</document>
</citations>