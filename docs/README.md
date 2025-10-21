# Sales Management Frontend

A modern React application for sales management built with Vite, TypeScript, and TailwindCSS.

## Technology Stack

- **Build Tool**: Vite
- **Framework**: React 19 with TypeScript
- **Styling**: TailwindCSS v4
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Code Quality**: Biome (linting & formatting)
- **Testing**: Vitest + Testing Library

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── SearchModal/
│   │   └── Table/
│   ├── layout/          # Layout components
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   └── Layout/
│   └── features/        # Feature-specific components
│       ├── dashboard/
│       ├── presales/
│       ├── products/
│       └── customers/
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── data/                # Mock data and services
```

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview production build:
   ```bash
   npm run preview
   ```

## Features

- **Product Management**: Register and manage product inventory
- **Customer Management**: Handle customer information and validation
- **Pre-Sales**: Create sales orders with product search and calculations
- **Dashboard**: Overview of key metrics and recent activities
- **Inventory Management**: Track stock levels and adjustments
- **Reports**: Generate sales and inventory reports
- **Responsive Design**: Mobile-first approach with TailwindCSS

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/hooks/*` → `src/hooks/*`
- `@/types/*` → `src/types/*`
- `@/utils/*` → `src/utils/*`
- `@/data/*` → `src/data/*`

## Code Quality

- **TypeScript**: Strict mode enabled for type safety
- **Biome**: Fast linting and formatting with React-specific rules
- **Component Architecture**: Single responsibility principle
- **Responsive Design**: Mobile-first with TailwindCSS utilities
- **Testing**: Comprehensive test coverage with Vitest

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run Biome linter
npm run format       # Format code with Biome
npm run check        # Run Biome check and fix
npm run test         # Run tests
npm run test:run     # Run tests once
npm run test:ui      # Run tests with UI
```