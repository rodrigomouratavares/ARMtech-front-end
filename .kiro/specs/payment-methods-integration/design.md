# Design Document

## Overview

Este documento descreve o design para integrar as formas de pagamento do frontend Flow CRM com o backend real. A integração substituirá o serviço mockado atual (`mockPaymentMethodService`) por um serviço real que faz chamadas HTTP para a API backend já implementada.

O sistema manterá a interface atual intacta, implementando apenas a camada de comunicação com o backend, garantindo uma transição transparente para os usuários.

## Architecture

### Current State
- **Frontend**: Interface completa usando `mockPaymentMethodService`
- **Backend**: API endpoints implementados em `/api/payment-methods`
- **Database**: Tabela `payment_methods` criada com dados iniciais
- **Gap**: Falta integração entre frontend e backend

### Target Architecture
```
Frontend Components
       ↓
PaymentMethodService (Real)
       ↓
HttpClient (Existing)
       ↓
Backend API (/api/payment-methods)
       ↓
Database
```

### Integration Strategy
1. **Service Layer Replacement**: Substituir `mockPaymentMethodService` por `paymentMethodService`
2. **Interface Compatibility**: Manter mesma interface para não quebrar componentes existentes
3. **Error Handling**: Implementar tratamento robusto de erros de rede
4. **Loading States**: Adicionar estados de carregamento apropriados
5. **Cache Strategy**: Implementar cache simples para melhorar performance

## Components and Interfaces

### PaymentMethodService
Novo serviço que substituirá o mock, implementando a mesma interface:

```typescript
interface PaymentMethodService {
  getAll(): Promise<PaymentMethod[]>
  getById(id: string): Promise<PaymentMethod | null>
  create(data: CreatePaymentMethodData): Promise<PaymentMethod>
  update(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethod | null>
  delete(id: string): Promise<boolean>
}
```

### API Endpoints Integration
- **GET** `/api/payment-methods` - Listar formas de pagamento
- **GET** `/api/payment-methods/:id` - Buscar por ID
- **POST** `/api/payment-methods` - Criar nova forma de pagamento
- **PUT** `/api/payment-methods/:id` - Atualizar forma de pagamento
- **DELETE** `/api/payment-methods/:id` - Excluir forma de pagamento

### Response Format
O backend já retorna dados no formato esperado:
```typescript
interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  timestamp: string
  pagination?: PaginationInfo
}
```

### Error Handling Strategy
1. **Network Errors**: Detectar problemas de conectividade
2. **HTTP Errors**: Tratar códigos de status específicos (404, 409, 500)
3. **Validation Errors**: Exibir erros de validação do backend
4. **Retry Logic**: Usar retry automático para erros temporários
5. **Fallback**: Manter dados em cache quando possível

## Data Models

### PaymentMethod Interface (Already Defined)
```typescript
interface PaymentMethod extends BaseEntity {
  code: string
  description: string
  isActive: boolean
}
```

### Request/Response Types
```typescript
interface CreatePaymentMethodRequest {
  code: string
  description: string
  isActive: boolean
}

interface UpdatePaymentMethodRequest {
  code?: string
  description?: string
  isActive?: boolean
}
```

### Cache Structure
```typescript
interface PaymentMethodCache {
  data: PaymentMethod[]
  lastFetch: Date
  ttl: number // Time to live in milliseconds
}
```

## Error Handling

### Error Types and Messages
1. **Network Error**: "Erro de conexão. Verifique sua internet."
2. **Not Found (404)**: "Forma de pagamento não encontrada."
3. **Conflict (409)**: "Já existe uma forma de pagamento com este código."
4. **Validation Error (400)**: Exibir mensagem específica do backend
5. **Server Error (500)**: "Erro interno do servidor. Tente novamente."
6. **Delete Conflict**: "Esta forma de pagamento está sendo usada e não pode ser excluída."

### Error Recovery Strategies
1. **Automatic Retry**: Para erros de rede temporários
2. **Manual Retry**: Botão para tentar novamente após falha
3. **Cache Fallback**: Usar dados em cache quando backend indisponível
4. **Graceful Degradation**: Permitir visualização mesmo com erros de carregamento

### User Feedback
- **Loading States**: Spinners e skeleton loaders
- **Success Messages**: Confirmações de ações realizadas
- **Error Messages**: Mensagens claras e acionáveis
- **Retry Options**: Botões para tentar novamente

## Testing Strategy

### Unit Tests
1. **PaymentMethodService**: Testar todas as operações CRUD
2. **Error Handling**: Verificar tratamento de diferentes tipos de erro
3. **Cache Logic**: Validar funcionamento do cache
4. **API Integration**: Mock das chamadas HTTP

### Integration Tests
1. **Component Integration**: Testar integração com componentes existentes
2. **API Communication**: Testar comunicação real com backend
3. **Error Scenarios**: Simular diferentes cenários de erro
4. **Loading States**: Verificar estados de carregamento

### Manual Testing Scenarios
1. **Happy Path**: Criar, listar, editar e excluir formas de pagamento
2. **Network Issues**: Testar com conexão instável
3. **Server Errors**: Simular erros do backend
4. **Concurrent Operations**: Múltiplas operações simultâneas
5. **Cache Behavior**: Verificar funcionamento do cache

## Implementation Phases

### Phase 1: Service Implementation
- Criar `paymentMethodService.ts`
- Implementar operações CRUD básicas
- Adicionar tratamento de erros básico

### Phase 2: Component Integration
- Substituir mock service nos componentes
- Adicionar loading states
- Implementar feedback visual

### Phase 3: Cache and Optimization
- Implementar cache simples
- Adicionar otimizações de performance
- Melhorar tratamento de erros

### Phase 4: Testing and Refinement
- Testes unitários e de integração
- Ajustes baseados em feedback
- Documentação final

**Note**: A infraestrutura do banco de dados já está implementada com a tabela `payment_methods` e dados iniciais.

## Security Considerations

### Authentication
- Usar tokens JWT existentes
- Implementar refresh automático de tokens
- Tratar expiração de sessão

### Data Validation
- Validar dados no frontend antes do envio
- Confiar na validação do backend como fonte da verdade
- Sanitizar inputs do usuário

### Error Information
- Não expor informações sensíveis em mensagens de erro
- Log detalhado apenas no console (desenvolvimento)
- Mensagens genéricas para usuários finais

## Performance Considerations

### Caching Strategy
- Cache em memória para sessão atual
- TTL de 5 minutos para dados de formas de pagamento
- Invalidação automática após operações CUD

### Network Optimization
- Usar compressão HTTP quando disponível
- Implementar debounce para operações de busca
- Lazy loading quando apropriado

### Loading Experience
- Skeleton loaders para primeira carga
- Spinners para operações específicas
- Feedback imediato para ações do usuário