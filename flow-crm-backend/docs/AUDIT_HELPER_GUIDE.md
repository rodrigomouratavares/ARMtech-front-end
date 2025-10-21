# Guia do Audit Helper

O **Audit Helper** é uma ferramenta para facilitar o registro de logs de auditoria em todo o sistema. Ele foi projetado para ser simples de usar e não interromper o fluxo principal da aplicação, mesmo em caso de falhas.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Instalação](#instalação)
- [Uso Básico](#uso-básico)
- [Métodos Disponíveis](#métodos-disponíveis)
- [Exemplos Práticos](#exemplos-práticos)
- [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

O Audit Helper oferece:

- ✅ **Registro automático de IP e User Agent** de cada requisição
- ✅ **Métodos específicos** para cada tipo de ação (create, update, delete, view, login, logout)
- ✅ **Segurança contra falhas** - erros no log não quebram a aplicação
- ✅ **Extração inteligente de IP** - suporta proxies e load balancers
- ✅ **Interface simples** - apenas uma linha de código por log

---

## 🔧 Instalação

Importe o helper no seu controller:

```typescript path=null start=null
import { AuditHelper } from '../utils/audit-helper';
```

---

## 💡 Uso Básico

### Estrutura básica em um controller

```typescript path=null start=null
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuditHelper } from '../utils/audit-helper';

export class YourController {
  async yourMethod(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Sua lógica de negócio aqui
      const result = await yourService.doSomething();

      // Registrar a ação no audit log
      const user = (request as any).user;
      if (user) {
        await AuditHelper.logCreate(
          'resource_name',      // Nome do recurso (ex: 'payment_methods', 'users')
          result.id,            // ID do recurso criado
          user.id,              // ID do usuário
          user.name,            // Nome do usuário
          request,              // Objeto request (para extrair IP e User Agent)
          'Descrição opcional'  // Detalhes adicionais (opcional)
        );
      }

      return reply.send({ success: true, data: result });
    } catch (error) {
      // Tratamento de erro
    }
  }
}
```

---

## 📚 Métodos Disponíveis

### 1. `logCreate` - Registro de Criação

Usado quando um novo recurso é criado.

```typescript path=null start=null
await AuditHelper.logCreate(
  'payment_methods',     // resource
  paymentMethod.id,      // resourceId
  user.id,               // userId
  user.name,             // userName
  request,               // request (opcional)
  'Created payment method: Credit Card'  // details (opcional)
);
```

### 2. `logUpdate` - Registro de Atualização

Usado quando um recurso existente é atualizado.

```typescript path=null start=null
await AuditHelper.logUpdate(
  'payment_methods',     // resource
  id,                    // resourceId
  user.id,               // userId
  user.name,             // userName
  request,               // request (opcional)
  `Updated fields: ${JSON.stringify(changes)}`  // details (opcional)
);
```

### 3. `logDelete` - Registro de Exclusão

Usado quando um recurso é deletado (soft ou hard delete).

```typescript path=null start=null
await AuditHelper.logDelete(
  'payment_methods',     // resource
  id,                    // resourceId
  user.id,               // userId
  user.name,             // userName
  request,               // request (opcional)
  'Soft deleted payment method'  // details (opcional)
);
```

### 4. `logView` - Registro de Visualização

Usado quando um recurso é visualizado (listar ou detalhes).

```typescript path=null start=null
// Visualização de lista
await AuditHelper.logView(
  'payment_methods',     // resource
  user.id,               // userId
  user.name,             // userName
  request,               // request (opcional)
  undefined,             // resourceId (opcional - null para listas)
  `Viewed list with filters: ${JSON.stringify(filters)}`  // details (opcional)
);

// Visualização de item específico
await AuditHelper.logView(
  'payment_methods',     // resource
  user.id,               // userId
  user.name,             // userName
  request,               // request (opcional)
  id,                    // resourceId
  'Viewed payment method details'  // details (opcional)
);
```

### 5. `logLogin` - Registro de Login

Usado quando um usuário faz login no sistema.

```typescript path=null start=null
await AuditHelper.logLogin(
  user.id,               // userId
  user.name,             // userName
  request                // request (opcional)
);
```

### 6. `logLogout` - Registro de Logout

Usado quando um usuário faz logout do sistema.

```typescript path=null start=null
await AuditHelper.logLogout(
  user.id,               // userId
  user.name,             // userName
  request                // request (opcional)
);
```

### 7. `log` - Método Genérico

Para ações customizadas não cobertas pelos métodos acima.

```typescript path=null start=null
await AuditHelper.log(
  'custom_action',       // action (tipo AuditAction)
  'resource_name',       // resource
  user.id,               // userId
  user.name,             // userName
  request,               // request (opcional)
  resourceId,            // resourceId (opcional)
  'Custom details'       // details (opcional)
);
```

---

## 🔍 Exemplos Práticos

### Exemplo Completo: Controller de Payment Methods

```typescript path=/Users/matheuswesley/projects/arm_projects/sistema_vendas/server/src/controllers/payment-methods.controller.ts start=115
  async createPaymentMethod(
    request: FastifyRequest<{ Body: CreatePaymentMethodRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const data = request.body;

      // Get user ID from authenticated user (if available)
      const userId = (request as any).user?.id;

      // Create payment method
      const paymentMethod = await paymentMethodService.create({
        ...data,
        createdBy: userId
      });

      // Log create action
      const user = (request as any).user;
      if (user) {
        await AuditHelper.logCreate(
          'payment_methods',
          paymentMethod.id,
          user.id,
          user.name || user.email || 'Unknown',
          request,
          `Created payment method: ${paymentMethod.description} (${paymentMethod.code})`
        );
      }

      reply.status(201).send({
        success: true,
        data: paymentMethod,
        message: 'Payment method created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment method';

      // Handle specific errors
      if (errorMessage.includes('already exists')) {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'ALREADY_EXISTS',
            message: errorMessage
          },
          timestamp: new Date().toISOString(),
          path: request.url
        });
      }

      reply.status(400).send({
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: errorMessage
        },
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  }
```

### Exemplo: Autenticação de Usuário

```typescript path=null start=null
export class AuthController {
  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email, password } = request.body;
      
      // Validar credenciais
      const user = await authService.validateCredentials(email, password);
      
      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }
      
      // Gerar token
      const token = await authService.generateToken(user);
      
      // Registrar login
      await AuditHelper.logLogin(user.id, user.name, request);
      
      return reply.send({ token, user });
    } catch (error) {
      // Tratamento de erro
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      
      // Invalidar token
      await authService.invalidateToken(user.id);
      
      // Registrar logout
      await AuditHelper.logLogout(user.id, user.name, request);
      
      return reply.send({ success: true });
    } catch (error) {
      // Tratamento de erro
    }
  }
}
```

### Exemplo: Bulk Operations

Quando realizar operações em lote, registre os detalhes:

```typescript path=null start=null
async bulkDelete(request: FastifyRequest, reply: FastifyReply) {
  const { ids } = request.body;
  const user = (request as any).user;
  
  const deletedIds = [];
  
  for (const id of ids) {
    const deleted = await service.delete(id);
    if (deleted) {
      deletedIds.push(id);
    }
  }
  
  // Registrar a operação em lote
  if (user && deletedIds.length > 0) {
    await AuditHelper.logDelete(
      'payment_methods',
      deletedIds.join(','),  // IDs separados por vírgula
      user.id,
      user.name,
      request,
      `Bulk deleted ${deletedIds.length} payment methods: ${deletedIds.join(', ')}`
    );
  }
  
  return reply.send({ deleted: deletedIds.length });
}
```

---

## ✅ Boas Práticas

### 1. **Sempre verifique se o usuário existe**

```typescript path=null start=null
const user = (request as any).user;
if (user) {
  await AuditHelper.logCreate(...);
}
```

### 2. **Use nomes de recursos consistentes**

Padronize os nomes dos recursos em todo o sistema:

- ✅ `payment_methods` (snake_case, plural)
- ❌ `PaymentMethod` (PascalCase)
- ❌ `payment_method` (singular)

### 3. **Forneça detalhes relevantes**

Adicione informações úteis no campo `details`:

```typescript path=null start=null
// ✅ Bom
await AuditHelper.logUpdate(
  'payment_methods',
  id,
  user.id,
  user.name,
  request,
  `Updated description from "${oldValue}" to "${newValue}"`
);

// ❌ Vago
await AuditHelper.logUpdate(
  'payment_methods',
  id,
  user.id,
  user.name,
  request,
  'Updated'
);
```

### 4. **Não registre informações sensíveis**

Evite logar senhas, tokens, ou dados pessoais sensíveis:

```typescript path=null start=null
// ❌ Evite
await AuditHelper.logUpdate(
  'users',
  user.id,
  user.id,
  user.name,
  request,
  `Updated password to: ${newPassword}`  // NÃO faça isso!
);

// ✅ Correto
await AuditHelper.logUpdate(
  'users',
  user.id,
  user.id,
  user.name,
  request,
  'Updated password'  // Simples e seguro
);
```

### 5. **Use para operações importantes**

Nem toda ação precisa ser auditada. Foque em:

- ✅ Criação, atualização e exclusão de dados
- ✅ Login e logout
- ✅ Mudanças em configurações importantes
- ✅ Acesso a dados sensíveis
- ❌ Listagens simples sem filtros sensíveis (opcional)
- ❌ Operações de leitura muito frequentes

### 6. **O helper não bloqueia o fluxo principal**

Mesmo se o log falhar, sua aplicação continua funcionando:

```typescript path=null start=null
// O erro é capturado internamente e apenas logado no console
await AuditHelper.logCreate(...);  // Se falhar, não afeta o código abaixo

return reply.send({ success: true });  // Isso sempre executa
```

---

## 🔍 Extração de IP

O helper tenta extrair o IP do cliente na seguinte ordem:

1. **`x-forwarded-for` header** (quando atrás de proxy/load balancer)
2. **`x-real-ip` header**
3. **`request.ip`** (direto do Fastify)

Isso garante que o IP correto seja capturado mesmo em ambientes com proxies reversos (Nginx, Cloudflare, etc.).

---

## 📊 Consultando Logs

Após registrar as ações, você pode consultá-las através dos endpoints de Audit Logs:

```bash
# Listar todos os logs
GET /api/audit-logs

# Filtrar por usuário
GET /api/audit-logs/user/{userId}

# Filtrar por recurso
GET /api/audit-logs?resource=payment_methods

# Filtrar por ação
GET /api/audit-logs?action=create

# Filtrar por período
GET /api/audit-logs?startDate=2024-01-01&endDate=2024-12-31
```

---

## 🎯 Resumo

O Audit Helper simplifica o processo de auditoria:

1. **Importe** o helper no seu controller
2. **Extraia** as informações do usuário autenticado
3. **Chame** o método apropriado (logCreate, logUpdate, etc.)
4. **Adicione** detalhes relevantes mas não sensíveis

Dessa forma, você mantém um histórico completo e seguro de todas as ações importantes no sistema! 🚀
