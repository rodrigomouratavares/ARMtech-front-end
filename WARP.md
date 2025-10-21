# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

Flow-CRM is a modern React-based sales management frontend application built with Vite, TypeScript, and TailwindCSS. It's designed as a comprehensive CRM system for managing products, customers, pre-sales, inventory, payment methods, and reports with a focus on Brazilian business requirements (CPF/CNPJ validation, Brazilian currency formatting, auto-generated codes).

**Recent Major Updates:**
- Backend integration with configurable environment support
- Complete authentication system with role-based permissions
- React Query integration for server state management
- Auto-generated codes for entities (PRD001, PAG001, etc.)
- Intelligent price suggestion system
- Toast notification system with react-toastify
- Advanced permission system for user access control
- PDF generation capabilities with jspdf
- Enhanced form validation and user experience

## Common Development Commands

### Development Server
```bash
npm run dev          # Start development server with hot reload
npm run preview      # Preview production build locally
```

### Build and Production
```bash
npm run build        # TypeScript compilation + Vite production build
```

### Code Quality and Testing
```bash
npm run lint         # Run Biome linter
npm run format       # Format code with Biome
npm run check        # Run Biome check and auto-fix issues
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once (CI mode)
npm run test:ui      # Run tests with Vitest UI
```

### Running Single Tests
```bash
npx vitest run src/components/common/Button/Button.test.tsx    # Single test file
npx vitest run --grep "should render button"                  # Specific test case
npx vitest run src/data/mockAuthService.test.ts               # Test auth service
```

### Git Workflow (Custom WARP Drive Workflow Available)
```bash
# Use the "update project git" workflow with custom commit message
# This workflow automatically handles: git add . && git commit -m "message" && git push
# Includes notification system for success/error feedback
```

## Dependencies Overview

### Core Technologies
- **React**: 19.1.1 (latest stable with modern hooks)
- **TypeScript**: ~5.8.3 (strict configuration)
- **Vite**: ^7.1.7 (build tool and dev server)
- **TailwindCSS**: ^4.1.13 (utility-first styling)
- **React Router DOM**: ^7.9.3 (client-side routing)

### Key Libraries
- **Lucide React**: ^0.544.0 (icon library)
- **React Toastify**: ^11.0.5 (toast notifications)
- **Biome**: 2.2.4 (linting and formatting)
- **Vitest**: ^3.2.4 (testing framework)
- **Testing Library**: React ^16.3.0 (component testing)

## Architecture Overview

### Project Structure Philosophy
The codebase follows a feature-driven architecture with clear separation of concerns:

- **Feature Components** (`src/components/features/`): Business logic components organized by domain (dashboard, presales, products, customers, paymentMethods)
- **Common Components** (`src/components/common/`): Reusable UI components with comprehensive test coverage (Select, CheckboxGroup, Modals)
- **Layout Components** (`src/components/layout/`): Application shell components (Header, Sidebar, Layout)
- **Authentication** (`src/context/`): Complete auth system with AuthContext
- **Services** (`src/services/`): Centralized services (ToastService)
- **Mock Data Layer** (`src/data/`): Mock services simulating backend APIs for development
- **Utility Services** (`src/utils/`): Business logic utilities (autoCodeService, priceCalculationService)
- **TypeScript Types** (`src/types/index.ts`): Comprehensive type definitions for the entire application

### Key Architectural Patterns

#### Component Organization
- Each component directory contains: `Component.tsx`, `Component.test.tsx`, `index.ts`
- Components follow single responsibility principle with clear prop interfaces
- All business components are wrapped in the Layout component through `LayoutWrapper`

#### Routing Strategy
- React Router v7 with centralized route configuration in `src/routes/index.tsx`
- Protected routes via `ProtectedRoute` component with authentication checks
- All business routes wrapped with `LayoutWrapper` for consistent layout
- Hash routing support for deployment flexibility (Vercel compatible)
- Automatic redirects for unauthenticated users
- Complete routes: login, dashboard, products, customers, presales, payment-methods
- Placeholder routes for future features: inventory, reports, settings

#### Type System Design
- Comprehensive TypeScript types in `src/types/index.ts` covering all domain models
- Strict TypeScript configuration with `noUnusedLocals` and `noUnusedParameters`
- Input types derived from main types using `Omit` utility (e.g., `ProductInput`)
- Const assertions for enums (`PreSaleStatus`, `ProductUnit`, `UserRole`)

#### State Management Approach
- Currently using React's built-in state management (useState, useEffect)
- Mock services in `src/data/` simulate async operations and data persistence
- Form state management through custom interfaces (`FormState`, `FormField`)

#### Styling System
- TailwindCSS v4 with custom configuration
- Mobile-first responsive design approach
- Biome formatter configured for tab indentation and single quotes
- Component-level styling with utility classes

### Development Patterns

#### Path Aliases Configuration
- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/hooks/*` → `src/hooks/*`
- `@/types/*` → `src/types/*`
- `@/utils/*` → `src/utils/*`
- `@/data/*` → `src/data/*`

#### Brazilian Business Logic
- CPF/CNPJ validation and formatting in `src/utils/index.ts`
- Brazilian currency formatting (BRL) with proper locale
- Auto-generated entity codes (PRD001, PAG001, etc.) via `autoCodeService.ts`
- Intelligent price calculation with configurable margins via `priceCalculationService.ts`

#### Testing Strategy
- Vitest v3 with jsdom environment for component testing
- Testing Library React v16 for component interaction testing
- Test setup file at `src/test/setup.ts` with jest-dom matchers
- Comprehensive test coverage for authentication flows
- Mock service testing (e.g., `mockAuthService.test.ts`)
- Component testing for new UI components (Select, CheckboxGroup)
- Integration testing for form workflows

### Mock Data Architecture
The application uses a sophisticated mock data layer that simulates real backend services:
- `mockProductService.ts` - Product CRUD operations with auto-generated codes
- `mockCustomerService.ts` - Customer management with enhanced validation
- `mockDashboardService.ts` - Dashboard metrics and analytics
- `mockAuthService.ts` - Complete authentication system simulation
- `mockUser.ts` - User management and session handling

This architecture allows development without a backend while maintaining realistic data flow patterns and business logic validation.

### Authentication System
The application features a complete authentication system:
- Login/logout functionality with session management
- Protected routes with automatic redirects
- User context with React Context API
- Role-based access control structure
- Authentication state persistence
- Comprehensive test coverage for auth flows

### Layout System
The Layout component manages:
- Responsive sidebar with collapse/expand functionality and mobile overlay
- Mobile-first design with touch-friendly navigation
- Sticky header with integrated search functionality
- Consistent page structure across all protected routes
- Authentication-aware header with user context
- Dynamic sidebar highlighting based on current route

### Component Design Principles
- Generic table component with configurable columns and actions
- Modal components with consistent API (SimpleModal, InPageModal)
- Form components with enhanced validation and auto-generation support
- Button variants (primary, secondary, danger) with loading states
- Custom Select component with keyboard navigation and search
- CheckboxGroup component for modern radio-style selections
- Toast notification system for user feedback
- Responsive grid layouts with mobile-first approach

### New Utility Services

#### AutoCodeService (`src/utils/autoCodeService.ts`)
- Handles auto-generation of codes for all entities (PRD001, PAG001, etc.)
- Configurable prefixes and number padding
- Initialization from existing data to continue sequences
- Preview functionality without incrementing counters

#### PriceCalculationService (`src/utils/priceCalculationService.ts`)
- Intelligent price suggestion algorithms
- Configurable margin percentages (default: 30%)
- Brazilian currency parsing and formatting
- Real-time price calculations during form input

#### ToastService (`src/services/ToastService.ts`)
- Centralized toast notification management
- Predefined messages for common actions (CRUD operations)
- Consistent styling and positioning (bottom-right, 5s duration)
- Support for success, error, warning, and info types
- Integration with react-toastify library

### Enhanced Form Architecture

#### Registration Forms Refactor
Complete modernization of all registration forms:
- **Products**: Auto-generated codes, intelligent price suggestions, consolidated tabs
- **Customers**: Simplified single-tab layout, CPF/CNPJ support, enhanced validation
- **Payment Methods**: New module with auto-generation and CRUD operations

#### Modern UI Components
- **Custom Select**: Dropdown with keyboard navigation and search capabilities
- **CheckboxGroup**: Radio-style selections with modern checkboxes
- **Enhanced Modals**: InPageModal and SimpleModal with consistent APIs
- **Form Validation**: Real-time validation with toast feedback

### Key Development Features

#### Auto-Generation System
- Products: PRD001, PRD002, PRD003...
- Payment Methods: PAG001, PAG002, PAG003...
- Customers: Could be extended to CUS001, CUS002...
- Intelligent sequence continuation from existing data

#### Price Intelligence
- 30% default markup on purchase prices (configurable)
- Real-time price suggestions as user types
- User can override suggestions without losing functionality
- Brazilian currency formatting throughout

#### Notification System
- Comprehensive toast notifications for all user actions
- Predefined messages for consistency across modules
- Error handling with user-friendly messages
- Success confirmations for completed operations

## Deployment Configuration

### Vercel Integration
- SPA routing configuration in `vercel.json`
- All routes redirect to `index.html` for client-side routing
- Production build optimizations with Vite
- Hash routing support for deployment flexibility

### Git Workflow Integration
Custom workflow available for repository updates:
- Automated add, commit, and push process
- Notification system integration
- Error handling with user feedback
- Configurable commit messages

## Future Architecture Considerations
- State management migration path (likely React Query + Zustand)
- Backend integration points already defined through enhanced mock services
- Complete authentication system already implemented and tested
- Report generation system architecture outlined but not implemented
- Inventory management module structure defined but needs implementation
- Multi-language support foundation in place for internationalization
