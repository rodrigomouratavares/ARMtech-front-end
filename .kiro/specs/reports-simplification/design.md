# Design Document

## Overview

A simplificação da página de relatórios envolve a remoção da arquitetura multi-relatório existente e a implementação de uma solução focada exclusivamente no relatório de formas de pagamento. Esta mudança incluirá a integração completa com o backend, substituindo os serviços mock por endpoints reais que consultam o banco de dados.

O design manterá a funcionalidade existente de filtros e exportação, mas simplificará significativamente a estrutura de componentes e a navegação do usuário.

## Architecture

### Simplified Component Structure
```
src/components/features/reports/
├── ReportsPage.tsx                 # Página simplificada - apenas formas de pagamento
├── PaymentMethodsReport.tsx        # Componente principal (sem mudanças significativas)
├── ReportFilters.tsx              # Mantido como está
├── ReportSummary.tsx              # Mantido como está
└── index.ts                       # Exports atualizados
```

### Backend API Structure
```
server/src/
├── controllers/
│   └── reports.controller.ts       # Novo controller para relatórios
├── services/
│   └── reports.service.ts          # Novo service para lógica de negócio
├── routes/
│   └── reports.routes.ts           # Novas rotas de relatórios
└── schemas/
    └── reports.schemas.ts          # Validação de parâmetros
```

### Data Flow (Simplified)
```
ReportsPage (simplified) → PaymentMethodsReport → API Calls
     ↓
Backend API (/api/reports/*)
     ↓
Database Queries (presales, sales tables)
     ↓
Data Aggregation & Processing
     ↓
JSON Response to Frontend
```

## Components and Interfaces

### 1. Simplified ReportsPage Component
**Changes:**
- Remove `activeReport` state (always payment-methods)
- Remove report type selector UI
- Simplify page title to "Relatório de Formas de Pagamento"
- Direct rendering of PaymentMethodsReport component

**New Structure:**
```typescript
const ReportsPage: React.FC = () => {
  const permissions = usePermissions();
  
  if (!permissions.canAccessReports()) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Breadcrumb />
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Relatório de Formas de Pagamento
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Análise de vendas por finalizadora
          </p>
        </div>
        <PaymentMethodsReport />
      </div>
    </div>
  );
};
```

### 2. Updated ReportsService
**Replace mock service with real API calls:**

```typescript
class ReportsService {
  private readonly baseUrl = '/api/reports';

  async getPaymentMethodsReport(filters?: ReportFilters): Promise<PaymentMethodReportData[]> {
    const params = new URLSearchParams();
    
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.startDate.toISOString());
      params.append('endDate', filters.dateRange.endDate.toISOString());
    }
    
    if (filters?.paymentMethodId) {
      params.append('paymentMethodId', filters.paymentMethodId);
    }

    const queryString = params.toString();
    const url = `${this.baseUrl}/payment-methods${queryString ? `?${queryString}` : ''}`;
    
    const response = await httpClient.get<PaymentMethodReportData[]>(url);
    return response;
  }

  async getReportSummary(filters?: ReportFilters): Promise<ReportSummary> {
    const params = new URLSearchParams();
    
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.startDate.toISOString());
      params.append('endDate', filters.dateRange.endDate.toISOString());
    }
    
    if (filters?.paymentMethodId) {
      params.append('paymentMethodId', filters.paymentMethodId);
    }

    const queryString = params.toString();
    const url = `${this.baseUrl}/summary${queryString ? `?${queryString}` : ''}`;
    
    const response = await httpClient.get<ReportSummary>(url);
    return response;
  }
}
```

## Backend Implementation

### 1. Database Schema Analysis
**Existing Tables to Use:**
- `presales` - Para identificar pré-vendas convertidas
- `payment_methods` - Para informações das finalizadoras
- Assumindo existência de tabela `sales` ou similar para vendas finalizadas

**Required Queries:**
```sql
-- Vendas por forma de pagamento com pré-vendas convertidas
SELECT 
  pm.id,
  pm.code,
  pm.description,
  COUNT(s.id) as sales_count,
  SUM(s.total_amount) as total_amount,
  COUNT(CASE WHEN s.presale_id IS NOT NULL THEN 1 END) as converted_presales_count,
  SUM(CASE WHEN s.presale_id IS NOT NULL THEN s.total_amount ELSE 0 END) as converted_presales_amount
FROM payment_methods pm
LEFT JOIN sales s ON pm.id = s.payment_method_id 
  AND s.sale_date BETWEEN ? AND ?
  AND s.status = 'completed'
WHERE pm.is_active = true
  AND (? IS NULL OR pm.id = ?)
GROUP BY pm.id, pm.code, pm.description
ORDER BY total_amount DESC;
```

### 2. Reports Controller
```typescript
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  async getPaymentMethodsReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { startDate, endDate, paymentMethodId } = request.query as {
        startDate?: string;
        endDate?: string;
        paymentMethodId?: string;
      };

      // Validate dates
      const filters = this.validateAndParseFilters({ startDate, endDate, paymentMethodId });
      
      const reportData = await this.reportsService.getPaymentMethodsReport(filters);
      
      return reply.send({
        success: true,
        data: reportData
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Erro ao gerar relatório de formas de pagamento',
        error: error.message
      });
    }
  }

  async getReportSummary(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { startDate, endDate, paymentMethodId } = request.query as {
        startDate?: string;
        endDate?: string;
        paymentMethodId?: string;
      };

      const filters = this.validateAndParseFilters({ startDate, endDate, paymentMethodId });
      
      const summary = await this.reportsService.getReportSummary(filters);
      
      return reply.send({
        success: true,
        data: summary
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Erro ao gerar resumo do relatório',
        error: error.message
      });
    }
  }

  private validateAndParseFilters(query: any) {
    const filters: any = {};
    
    if (query.startDate && query.endDate) {
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Datas inválidas fornecidas');
      }
      
      if (startDate > endDate) {
        throw new Error('Data inicial deve ser anterior à data final');
      }
      
      filters.dateRange = { startDate, endDate };
    }
    
    if (query.paymentMethodId) {
      filters.paymentMethodId = query.paymentMethodId;
    }
    
    return filters;
  }
}
```

### 3. Reports Service (Backend)
```typescript
export class ReportsService {
  constructor(private db: Database) {}

  async getPaymentMethodsReport(filters?: ReportFilters): Promise<PaymentMethodReportData[]> {
    const query = `
      SELECT 
        pm.id,
        pm.code,
        pm.description,
        pm.is_active,
        COALESCE(COUNT(s.id), 0) as sales_count,
        COALESCE(SUM(s.total_amount), 0) as total_amount,
        COALESCE(COUNT(CASE WHEN s.presale_id IS NOT NULL THEN 1 END), 0) as converted_presales_count,
        COALESCE(SUM(CASE WHEN s.presale_id IS NOT NULL THEN s.total_amount ELSE 0 END), 0) as converted_presales_amount
      FROM payment_methods pm
      LEFT JOIN sales s ON pm.id = s.payment_method_id 
        ${filters?.dateRange ? 'AND s.sale_date BETWEEN ? AND ?' : ''}
        AND s.status = 'completed'
      WHERE pm.is_active = true
        ${filters?.paymentMethodId ? 'AND pm.id = ?' : ''}
      GROUP BY pm.id, pm.code, pm.description, pm.is_active
      ORDER BY total_amount DESC
    `;

    const params = [];
    if (filters?.dateRange) {
      params.push(filters.dateRange.startDate.toISOString());
      params.push(filters.dateRange.endDate.toISOString());
    }
    if (filters?.paymentMethodId) {
      params.push(filters.paymentMethodId);
    }

    const results = await this.db.query(query, params);
    
    return results.map(row => ({
      paymentMethod: {
        id: row.id,
        code: row.code,
        description: row.description,
        isActive: row.is_active,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      totalAmount: parseFloat(row.total_amount) || 0,
      salesCount: parseInt(row.sales_count) || 0,
      convertedPresalesCount: parseInt(row.converted_presales_count) || 0,
      convertedPresalesAmount: parseFloat(row.converted_presales_amount) || 0
    }));
  }

  async getReportSummary(filters?: ReportFilters): Promise<ReportSummary> {
    const query = `
      SELECT 
        COALESCE(SUM(s.total_amount), 0) as total_amount,
        COALESCE(COUNT(s.id), 0) as total_sales_count,
        COALESCE(COUNT(CASE WHEN s.presale_id IS NOT NULL THEN 1 END), 0) as total_converted_presales,
        COALESCE(SUM(CASE WHEN s.presale_id IS NOT NULL THEN s.total_amount ELSE 0 END), 0) as total_converted_presales_amount
      FROM sales s
      JOIN payment_methods pm ON s.payment_method_id = pm.id
      WHERE s.status = 'completed'
        AND pm.is_active = true
        ${filters?.dateRange ? 'AND s.sale_date BETWEEN ? AND ?' : ''}
        ${filters?.paymentMethodId ? 'AND pm.id = ?' : ''}
    `;

    const params = [];
    if (filters?.dateRange) {
      params.push(filters.dateRange.startDate.toISOString());
      params.push(filters.dateRange.endDate.toISOString());
    }
    if (filters?.paymentMethodId) {
      params.push(filters.paymentMethodId);
    }

    const result = await this.db.query(query, params);
    const row = result[0];

    return {
      totalAmount: parseFloat(row.total_amount) || 0,
      totalSalesCount: parseInt(row.total_sales_count) || 0,
      totalConvertedPresales: parseInt(row.total_converted_presales) || 0,
      totalConvertedPresalesAmount: parseFloat(row.total_converted_presales_amount) || 0,
      period: filters?.dateRange || {
        startDate: new Date(),
        endDate: new Date()
      }
    };
  }
}
```

## Error Handling

### Frontend Error Handling
```typescript
// Enhanced error handling for API calls
try {
  const reportData = await reportsService.getPaymentMethodsReport(filters);
  // Handle success
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    setError({
      message: error.response.data.message || 'Filtros inválidos',
      code: 'INVALID_FILTERS'
    });
  } else if (error.response?.status === 500) {
    // Server error
    setError({
      message: 'Erro interno do servidor. Tente novamente.',
      code: 'NETWORK_ERROR'
    });
  } else {
    // Network or other error
    setError({
      message: 'Erro de conexão. Verifique sua internet.',
      code: 'NETWORK_ERROR'
    });
  }
}
```

### Backend Error Handling
```typescript
// Centralized error handling in controller
try {
  const result = await this.reportsService.getPaymentMethodsReport(filters);
  return reply.send({ success: true, data: result });
} catch (error) {
  console.error('Reports error:', error);
  
  if (error.message.includes('Datas inválidas')) {
    return reply.status(400).send({
      success: false,
      message: error.message,
      code: 'INVALID_FILTERS'
    });
  }
  
  return reply.status(500).send({
    success: false,
    message: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR'
  });
}
```

## Testing Strategy

### Backend Testing
```typescript
// Unit tests for ReportsService
describe('ReportsService', () => {
  test('should aggregate payment methods correctly', async () => {
    const mockData = [/* mock sales data */];
    const result = await reportsService.getPaymentMethodsReport();
    
    expect(result).toHaveLength(expectedLength);
    expect(result[0].totalAmount).toBe(expectedAmount);
  });

  test('should handle date filters correctly', async () => {
    const filters = {
      dateRange: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      }
    };
    
    const result = await reportsService.getPaymentMethodsReport(filters);
    // Verify filtering logic
  });
});
```

### Integration Testing
```typescript
// API endpoint tests
describe('Reports API', () => {
  test('GET /api/reports/payment-methods should return valid data', async () => {
    const response = await request(app)
      .get('/api/reports/payment-methods')
      .query({
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z'
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

## Performance Considerations

### Database Optimization
1. **Indexes:** Ensure indexes on `sales.sale_date`, `sales.payment_method_id`, `sales.presale_id`
2. **Query Optimization:** Use EXPLAIN to analyze query performance
3. **Caching:** Consider Redis caching for frequently accessed reports

### Frontend Optimization
1. **Debounced Filters:** Maintain existing 500ms debounce for filter changes
2. **Memoization:** Keep existing React.memo and useMemo optimizations
3. **Error Recovery:** Implement retry logic with exponential backoff

## Security Considerations

### API Security
1. **Authentication:** Verify JWT token on all report endpoints
2. **Authorization:** Check 'modules.reports' permission before data access
3. **Input Validation:** Sanitize and validate all query parameters
4. **Rate Limiting:** Implement rate limiting for report endpoints

### Data Privacy
1. **Access Control:** Users see only data they have permission to view
2. **Audit Logging:** Log all report access for compliance
3. **Data Sanitization:** Ensure no sensitive data leaks in error messages

## Migration Strategy

### Phase 1: Backend Implementation
1. Create new reports controller, service, and routes
2. Implement database queries and test with sample data
3. Add proper error handling and validation

### Phase 2: Frontend Integration
1. Update reportsService to use real API endpoints
2. Remove mock data services
3. Test error handling and loading states

### Phase 3: UI Simplification
1. Simplify ReportsPage component
2. Remove report type selection UI
3. Update navigation and breadcrumbs

### Phase 4: Testing and Deployment
1. Comprehensive testing of integrated solution
2. Performance testing with realistic data volumes
3. User acceptance testing
4. Production deployment with monitoring