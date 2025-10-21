# Design Document

## Overview

Este documento descreve o design para a reestruturação e limpeza do projeto CRM. O objetivo é simplificar todas as páginas (exceto Dashboard) para um estado básico de desenvolvimento, remover código desnecessário e criar uma base limpa para desenvolvimento incremental.

## Architecture

### Current State Analysis
- O projeto usa React 19 com TypeScript
- Roteamento com React Router DOM v7
- Layout responsivo com Sidebar/Header
- Estrutura de componentes bem organizada (common/features/layout)
- Sistema de mock data para desenvolvimento
- Testes com Vitest e Testing Library

### Target State
- Manter estrutura de roteamento existente
- Simplificar componentes de features para estado básico
- Preservar Layout e navegação
- Manter Dashboard funcional
- Remover código complexo desnecessário

## Components and Interfaces

### 1. Page Components Restructure

#### Dashboard (Preserved)
- **Status**: Manter funcionalidade atual
- **Rationale**: Única página que deve permanecer funcional

#### Simplified Page Component Template
```typescript
interface SimplifiedPageProps {
  title: string;
  message?: string;
}

const SimplifiedPage: React.FC<SimplifiedPageProps> = ({ 
  title, 
  message = "em desenvolvimento..." 
}) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600">Página {message}</p>
    </div>
  </div>
);
```

#### Pages to Simplify
1. **Customers** (`/customers`, `/customers/add`)
   - Replace complex CustomerForm and CustomerList with simplified component
   - Message: "de clientes em desenvolvimento..."

2. **Products** (`/products`, `/products/add`)
   - Replace ProductForm and ProductList with simplified component
   - Message: "de produtos em desenvolvimento..."

3. **PreSales** (`/presales`)
   - Replace PreSalesForm and related components with simplified component
   - Message: "de pré-vendas em desenvolvimento..."

4. **Inventory** (`/inventory`)
   - Already simplified, maintain current state
   - Message: "de estoque em desenvolvimento..."

### 2. Component Cleanup Strategy

#### Components to Remove/Simplify
- `src/components/features/customers/*` (except index.ts)
- `src/components/features/products/*` (except index.ts and ProductsPage.tsx)
- `src/components/features/presales/*` (except index.ts)

#### Components to Preserve
- `src/components/common/*` (Button, Input, Modal, Table, SearchModal)
- `src/components/layout/*` (Header, Sidebar, Layout)
- `src/components/features/dashboard/*`

#### Mock Data Cleanup
- Preserve essential mock data structure
- Remove complex mock implementations
- Keep mockUser for layout functionality

### 3. Type System Preservation

#### Types to Maintain
```typescript
// Essential types from src/types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

// Basic entity types for future development
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Types to Simplify
- Remove complex form validation types
- Remove detailed entity relationship types
- Keep basic interfaces for future expansion

## Data Models

### Simplified Data Structure
```typescript
// Minimal data models for preserved functionality
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

// Placeholder interfaces for future development
interface Customer extends BaseEntity {
  name: string;
}

interface Product extends BaseEntity {
  name: string;
}

interface PreSale extends BaseEntity {
  id: string;
}
```

## Error Handling

### Compilation Errors Resolution
1. **Import Cleanup**: Remove unused imports from simplified components
2. **Type Alignment**: Ensure remaining types match simplified implementations
3. **Route Validation**: Verify all routes compile without errors
4. **Test Updates**: Update or remove obsolete tests

### Runtime Error Prevention
1. **Default Props**: Ensure all simplified components have proper defaults
2. **Null Safety**: Add proper null checks where needed
3. **Route Fallbacks**: Maintain 404 handling

## Testing Strategy

### Test Cleanup Approach
1. **Remove Complex Tests**: Delete tests for removed complex components
2. **Update Basic Tests**: Modify tests for simplified components
3. **Preserve Layout Tests**: Keep tests for preserved Layout components
4. **Dashboard Tests**: Maintain existing Dashboard tests

### Minimal Test Coverage
```typescript
// Example simplified test
describe('SimplifiedCustomersPage', () => {
  it('renders development message', () => {
    render(<SimplifiedCustomersPage />);
    expect(screen.getByText(/clientes em desenvolvimento/)).toBeInTheDocument();
  });
});
```

## Implementation Phases

### Phase 1: Component Simplification
- Replace complex feature components with simplified versions
- Update imports and exports
- Ensure routing still works

### Phase 2: Code Cleanup
- Remove unused files and components
- Clean up imports
- Remove obsolete mock data

### Phase 3: Test Updates
- Update or remove obsolete tests
- Ensure remaining tests pass
- Verify compilation

### Phase 4: Validation
- Test all routes
- Verify Dashboard functionality
- Confirm no TypeScript errors
- Validate responsive layout

## File Structure After Cleanup

```
src/
├── components/
│   ├── common/ (preserved)
│   ├── features/
│   │   ├── customers/
│   │   │   └── index.ts (simplified export)
│   │   ├── dashboard/ (preserved)
│   │   ├── presales/
│   │   │   └── index.ts (simplified export)
│   │   └── products/
│   │       ├── index.ts (simplified export)
│   │       └── ProductsPage.tsx (simplified)
│   └── layout/ (preserved)
├── data/
│   ├── mockUser.ts (preserved)
│   └── mockDashboardService.ts (preserved)
├── types/
│   └── index.ts (simplified)
└── routes/
    └── index.tsx (updated imports)
```

## Success Criteria

1. **Compilation**: Project compiles without TypeScript errors
2. **Navigation**: All routes are accessible and render correctly
3. **Dashboard**: Dashboard functionality remains intact
4. **Simplified Pages**: All other pages show development messages
5. **Layout**: Responsive layout and navigation work properly
6. **Clean Codebase**: No unused imports or dead code
7. **Test Suite**: Remaining tests pass successfully