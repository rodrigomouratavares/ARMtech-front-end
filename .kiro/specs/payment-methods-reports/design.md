# Design Document

## Overview

O sistema de relatórios de formas de pagamento será implementado como uma nova página no sistema de vendas existente. A solução seguirá os padrões arquiteturais já estabelecidos no projeto, utilizando React com TypeScript, Tailwind CSS para estilização, e serviços mock para simulação de dados.

O relatório fornecerá uma visão consolidada das vendas organizadas por forma de pagamento, com capacidades de filtro por período e finalizadora específica, incluindo métricas de pré-vendas convertidas.

## Architecture

### Component Structure
```
src/components/features/reports/
├── ReportsPage.tsx                 # Página principal de relatórios
├── PaymentMethodsReport.tsx        # Componente específico do relatório
├── ReportFilters.tsx              # Componente de filtros
├── ReportSummary.tsx              # Componente de resumo/totais
└── index.ts                       # Exports
```

### Data Flow
```
ReportsPage → PaymentMethodsReport → [ReportFilters, ReportSummary]
     ↓
MockReportsService (dados simulados)
     ↓
Processamento e agregação dos dados
     ↓
Renderização dos componentes
```

### Service Layer
```
src/data/
├── mockReportsService.ts          # Serviço mock para dados de relatórios
└── mockSalesData.ts              # Dados mock de vendas por forma de pagamento
```

## Components and Interfaces

### 1. ReportsPage Component
**Responsabilidade:** Container principal que gerencia o estado global da página de relatórios.

**Props:** Nenhuma (página de nível superior)

**State:**
- `activeReport`: Tipo de relatório ativo (inicialmente apenas 'payment-methods')
- `isLoading`: Estado de carregamento
- `error`: Estado de erro

### 2. PaymentMethodsReport Component
**Responsabilidade:** Renderiza o relatório específico de formas de pagamento.

**Props:**
```typescript
interface PaymentMethodsReportProps {
  className?: string;
}
```

**State:**
- `reportData`: Dados do relatório processados
- `filters`: Filtros aplicados
- `isLoading`: Estado de carregamento
- `error`: Mensagens de erro

### 3. ReportFilters Component
**Responsabilidade:** Gerencia os filtros de período e finalizadora.

**Props:**
```typescript
interface ReportFiltersProps {
  onFiltersChange: (filters: ReportFilters) => void;
  paymentMethods: PaymentMethod[];
  isLoading?: boolean;
}
```

### 4. ReportSummary Component
**Responsabilidade:** Exibe o resumo e totais do relatório.

**Props:**
```typescript
interface ReportSummaryProps {
  totalAmount: number;
  totalConvertedPresales: number;
  period: DateRange;
  isLoading?: boolean;
}
```

## Data Models

### ReportFilters Interface
```typescript
interface ReportFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  paymentMethodId?: string; // Filtro por finalizadora específica
}
```

### PaymentMethodReportData Interface
```typescript
interface PaymentMethodReportData {
  paymentMethod: PaymentMethod;
  totalAmount: number;
  salesCount: number;
  convertedPresalesCount: number;
  convertedPresalesAmount: number;
}
```

### ReportSummary Interface
```typescript
interface ReportSummary {
  totalAmount: number;
  totalSalesCount: number;
  totalConvertedPresales: number;
  totalConvertedPresalesAmount: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}
```

### Sale Interface (para dados mock)
```typescript
interface Sale extends BaseEntity {
  customerId: string;
  customerName: string;
  paymentMethodId: string;
  paymentMethodCode: string;
  paymentMethodDescription: string;
  totalAmount: number;
  saleDate: Date;
  status: 'completed' | 'cancelled';
  isFromPresale: boolean; // Indica se veio de uma pré-venda
  presaleId?: string;
}
```

## Error Handling

### Error Types
```typescript
interface ReportError {
  message: string;
  code: 'NETWORK_ERROR' | 'DATA_PROCESSING_ERROR' | 'INVALID_FILTERS' | 'NO_DATA_FOUND';
  details?: string;
}
```

### Error Handling Strategy
1. **Network Errors:** Exibir mensagem de erro com opção de retry
2. **Data Processing Errors:** Log do erro e fallback para dados vazios
3. **Invalid Filters:** Validação no frontend com mensagens específicas
4. **No Data Found:** Mensagem informativa quando não há dados para o período

### Error Display
- Erros críticos: Modal ou toast notification
- Erros de validação: Inline no componente de filtros
- Estados vazios: Mensagem informativa na área do relatório

## Testing Strategy

### Unit Tests
1. **ReportFilters Component:**
   - Validação de datas (data inicial não pode ser maior que final)
   - Aplicação correta de filtros
   - Comportamento com dados inválidos

2. **PaymentMethodsReport Component:**
   - Renderização correta dos dados
   - Ordenação por valor (decrescente)
   - Formatação de valores monetários

3. **MockReportsService:**
   - Geração correta de dados mock
   - Filtros aplicados corretamente
   - Cálculos de agregação precisos

### Integration Tests
1. **Fluxo completo de filtros:**
   - Aplicar filtro de período → verificar dados atualizados
   - Aplicar filtro de finalizadora → verificar dados filtrados
   - Limpar filtros → verificar reset dos dados

2. **Estados de loading e erro:**
   - Simular erro de rede → verificar exibição de erro
   - Simular loading → verificar indicadores visuais

### Mock Data Strategy
```typescript
// Gerar dados realistas baseados nas formas de pagamento existentes
const generateMockSalesData = (
  startDate: Date, 
  endDate: Date, 
  paymentMethods: PaymentMethod[]
): Sale[] => {
  // Implementação que gera vendas distribuídas ao longo do período
  // com valores realistas e algumas pré-vendas convertidas
}
```

## UI/UX Design Patterns

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Header: "Relatórios" + Período Selecionado             │
├─────────────────────────────────────────────────────────┤
│ Filtros: [Data Início] [Data Fim] [Finalizadora] [Aplicar] │
├─────────────────────────────────────────────────────────┤
│ Resumo: Total Geral | Pré-vendas Convertidas           │
├─────────────────────────────────────────────────────────┤
│ Tabela de Dados:                                        │
│ ┌─────────────────┬──────────────┬─────────────────────┐ │
│ │ Finalizadora    │ Valor        │ Ações               │ │
│ ├─────────────────┼──────────────┼─────────────────────┤ │
│ │ PIX             │ R$ 2.450,00  │ [Detalhes]          │ │
│ │ Cartão Crédito  │ R$ 1.890,00  │ [Detalhes]          │ │
│ │ Dinheiro        │ R$ 1.200,00  │ [Detalhes]          │ │
│ └─────────────────┴──────────────┴─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Visual Design Principles
1. **Consistência:** Seguir os padrões visuais existentes do sistema
2. **Clareza:** Dados financeiros com formatação clara e legível
3. **Responsividade:** Layout adaptável para diferentes tamanhos de tela
4. **Acessibilidade:** Contraste adequado e navegação por teclado

### Color Scheme (seguindo Tailwind CSS)
- **Primary:** Blue (relatórios e ações principais)
- **Success:** Green (valores positivos e totais)
- **Warning:** Yellow (alertas de dados)
- **Neutral:** Gray (textos e bordas)

### Typography
- **Headers:** text-2xl font-bold (títulos principais)
- **Subheaders:** text-lg font-semibold (seções)
- **Body:** text-sm (dados da tabela)
- **Values:** font-mono (valores monetários para melhor alinhamento)

## Performance Considerations

### Data Loading
1. **Lazy Loading:** Carregar dados apenas quando necessário
2. **Debounced Filters:** Aplicar filtros com delay para evitar múltiplas requisições
3. **Caching:** Cache simples dos dados para evitar recarregamentos desnecessários

### Rendering Optimization
1. **React.memo:** Memorizar componentes que não mudam frequentemente
2. **useMemo:** Memorizar cálculos pesados de agregação
3. **useCallback:** Memorizar funções de callback para evitar re-renders

### Bundle Size
- Reutilizar componentes existentes (Table, Button, Input, etc.)
- Evitar dependências externas desnecessárias
- Code splitting se necessário (futuras expansões)

## Security Considerations

### Data Access
1. **Permissions:** Verificar permissão 'modules.reports' antes de exibir
2. **Data Filtering:** Funcionários veem apenas suas próprias vendas (se aplicável)
3. **Sensitive Data:** Não expor dados sensíveis nos logs do frontend

### Input Validation
1. **Date Ranges:** Validar que data inicial ≤ data final
2. **SQL Injection Prevention:** Sanitizar inputs (mesmo em mock)
3. **XSS Prevention:** Escapar dados exibidos (React já faz isso por padrão)

## Integration Points

### Existing Services
- **mockPaymentMethodService:** Buscar lista de formas de pagamento para filtros
- **AuthContext:** Verificar permissões do usuário
- **ToastService:** Exibir mensagens de sucesso/erro

### Navigation
- Adicionar item "Relatórios" no menu principal (se usuário tem permissão)
- Breadcrumb: Dashboard > Relatórios > Formas de Pagamento

### Future Extensibility
- Estrutura preparada para adicionar novos tipos de relatórios
- Interface genérica para diferentes fontes de dados
- Componentes reutilizáveis para outros relatórios