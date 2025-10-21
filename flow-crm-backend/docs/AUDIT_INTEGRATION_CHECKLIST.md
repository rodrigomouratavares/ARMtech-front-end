# Checklist de Integração do Audit Helper

Use este checklist ao integrar o Audit Helper em novos módulos do sistema.

---

## ✅ Checklist de Implementação

### 1. Preparação

- [ ] Definir nome do recurso (ex: `payment_methods`, `products`, `customers`)
- [ ] Listar todas as operações que precisam ser auditadas
- [ ] Identificar informações sensíveis que NÃO devem ser logadas
- [ ] Revisar endpoints existentes no controller

---

### 2. Modificação do Controller

- [ ] **Importar o Audit Helper**
  ```typescript
  import { AuditHelper } from '../utils/audit-helper';
  ```

- [ ] **Adicionar logs em cada endpoint:**

  **Create (POST):**
  - [ ] Após criar o recurso com sucesso
  - [ ] Antes de enviar a resposta ao cliente
  - [ ] Incluir ID do recurso criado
  - [ ] Adicionar descrição resumida no campo `details`

  **Update (PUT/PATCH):**
  - [ ] Após atualizar o recurso com sucesso
  - [ ] Antes de enviar a resposta ao cliente
  - [ ] Incluir ID do recurso atualizado
  - [ ] Documentar quais campos foram alterados (opcional)

  **Delete (DELETE):**
  - [ ] Após deletar o recurso com sucesso
  - [ ] Antes de enviar a resposta ao cliente
  - [ ] Incluir ID do recurso deletado
  - [ ] Indicar se foi soft ou hard delete

  **View (GET single):**
  - [ ] Após buscar o recurso (se encontrado)
  - [ ] Antes de enviar a resposta ao cliente
  - [ ] Incluir ID do recurso visualizado
  - [ ] Opcional: adicionar filtros ou contexto

  **List (GET collection):**
  - [ ] Após buscar a lista com sucesso
  - [ ] Antes de enviar a resposta ao cliente
  - [ ] Opcional: incluir filtros aplicados
  - [ ] Considerar se deve ser auditado (pode gerar muitos logs)

---

### 3. Padrão de Código

Use o seguinte template em todos os endpoints:

```typescript
// Após a operação bem-sucedida
const user = (request as any).user;
if (user) {
  await AuditHelper.logCreate( // ou logUpdate, logDelete, logView
    'resource_name',           // Nome do recurso (snake_case, plural)
    resource.id,               // ID do recurso afetado
    user.id,                   // ID do usuário
    user.name || user.email || 'Unknown',  // Nome do usuário
    request,                   // Request object (opcional mas recomendado)
    'Description of action'    // Descrição detalhada (opcional)
  );
}
```

---

### 4. Boas Práticas

- [ ] **Sempre verificar se usuário existe** antes de logar
- [ ] **Não logar dados sensíveis** (senhas, tokens, CPF, etc.)
- [ ] **Usar nomes consistentes** para recursos em todo o sistema
- [ ] **Adicionar detalhes úteis** mas não excessivos
- [ ] **Não quebrar o fluxo** - logs devem ser após sucesso, não antes
- [ ] **Manter simplicidade** - uma linha de código por log

---

### 5. Testes

- [ ] **Teste de criação:**
  - Criar recurso via API
  - Verificar se log foi criado
  - Validar campos do log (userId, resource, action, timestamp, etc.)
  - Confirmar que IP e User Agent foram capturados

- [ ] **Teste de atualização:**
  - Atualizar recurso via API
  - Verificar se log foi criado
  - Validar que resourceId está correto
  - Confirmar detalhes das mudanças (se aplicável)

- [ ] **Teste de exclusão:**
  - Deletar recurso via API
  - Verificar se log foi criado
  - Validar que ação foi registrada como "delete"
  - Confirmar se é soft ou hard delete

- [ ] **Teste de visualização:**
  - Visualizar recurso via API
  - Verificar se log foi criado (se implementado)
  - Validar resourceId correto

- [ ] **Teste sem autenticação:**
  - Tentar operação sem token ou usuário
  - Confirmar que nenhum log foi criado
  - Validar que aplicação não quebrou

- [ ] **Teste de falha no log:**
  - Simular erro no serviço de audit logs
  - Confirmar que aplicação continua funcionando
  - Verificar que erro foi logado no console

---

### 6. Documentação

- [ ] Adicionar comentários no código explicando cada log
- [ ] Atualizar documentação da API (se houver)
- [ ] Documentar quais ações são auditadas
- [ ] Listar informações que são logadas

---

### 7. Revisão Final

- [ ] Todos os endpoints críticos estão auditados
- [ ] Nenhum dado sensível está sendo logado
- [ ] Logs não afetam performance da aplicação
- [ ] Testes passam com sucesso
- [ ] Code review realizado
- [ ] Deploy em ambiente de teste/staging
- [ ] Validação em produção

---

## 📋 Template de Código Completo

### Exemplo: Controller com Audit Helper Integrado

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuditHelper } from '../utils/audit-helper';
import { resourceService } from '../services/resource.service';
import {
  CreateResourceRequest,
  UpdateResourceRequest,
  ResourceIdParams,
  ResourceQueryParams
} from '../schemas/resource.schemas';

export class ResourceController {
  /**
   * Create new resource
   * POST /api/resources
   */
  async create(
    request: FastifyRequest<{ Body: CreateResourceRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const data = request.body;
      const userId = (request as any).user?.id;

      // Create resource
      const resource = await resourceService.create({
        ...data,
        createdBy: userId
      });

      // Audit log
      const user = (request as any).user;
      if (user) {
        await AuditHelper.logCreate(
          'resources',                    // Resource name
          resource.id,                    // Resource ID
          user.id,                        // User ID
          user.name || user.email || 'Unknown',  // User name
          request,                        // Request object
          `Created resource: ${resource.name}`   // Details
        );
      }

      reply.status(201).send({
        success: true,
        data: resource,
        message: 'Resource created successfully'
      });
    } catch (error) {
      // Error handling
      reply.status(400).send({
        success: false,
        error: { message: error.message }
      });
    }
  }

  /**
   * Update resource
   * PUT /api/resources/:id
   */
  async update(
    request: FastifyRequest<{
      Params: ResourceIdParams;
      Body: UpdateResourceRequest;
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      const data = request.body;

      const resource = await resourceService.update(id, data);

      if (!resource) {
        return reply.status(404).send({
          success: false,
          error: { message: 'Resource not found' }
        });
      }

      // Audit log
      const user = (request as any).user;
      if (user) {
        await AuditHelper.logUpdate(
          'resources',
          id,
          user.id,
          user.name || user.email || 'Unknown',
          request,
          `Updated resource: ${resource.name} - Changes: ${JSON.stringify(data)}`
        );
      }

      reply.status(200).send({
        success: true,
        data: resource,
        message: 'Resource updated successfully'
      });
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: { message: error.message }
      });
    }
  }

  /**
   * Delete resource (soft delete)
   * DELETE /api/resources/:id
   */
  async delete(
    request: FastifyRequest<{ Params: ResourceIdParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;

      const deleted = await resourceService.softDelete(id);

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: { message: 'Resource not found' }
        });
      }

      // Audit log
      const user = (request as any).user;
      if (user) {
        await AuditHelper.logDelete(
          'resources',
          id,
          user.id,
          user.name || user.email || 'Unknown',
          request,
          'Soft deleted resource'
        );
      }

      reply.status(200).send({
        success: true,
        message: 'Resource deleted successfully'
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: { message: error.message }
      });
    }
  }

  /**
   * Get resource by ID
   * GET /api/resources/:id
   */
  async getById(
    request: FastifyRequest<{ Params: ResourceIdParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;

      const resource = await resourceService.findById(id);

      if (!resource) {
        return reply.status(404).send({
          success: false,
          error: { message: 'Resource not found' }
        });
      }

      // Audit log (opcional para views)
      const user = (request as any).user;
      if (user) {
        await AuditHelper.logView(
          'resources',
          user.id,
          user.name || user.email || 'Unknown',
          request,
          id,
          `Viewed resource: ${resource.name}`
        );
      }

      reply.status(200).send({
        success: true,
        data: resource,
        message: 'Resource retrieved successfully'
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: { message: error.message }
      });
    }
  }

  /**
   * Get all resources with filters
   * GET /api/resources
   */
  async getAll(
    request: FastifyRequest<{ Querystring: ResourceQueryParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const filters = request.query;

      const resources = await resourceService.findAll(filters);
      const total = await resourceService.count(filters);

      const { page = 1, limit = 50 } = filters;
      const totalPages = Math.ceil(total / limit);

      // Audit log (opcional - pode gerar muitos logs)
      const user = (request as any).user;
      if (user) {
        await AuditHelper.logView(
          'resources',
          user.id,
          user.name || user.email || 'Unknown',
          request,
          undefined,
          `Viewed list with filters: ${JSON.stringify(filters)}`
        );
      }

      reply.status(200).send({
        success: true,
        data: resources,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        message: 'Resources retrieved successfully'
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: { message: error.message }
      });
    }
  }
}

export const resourceController = new ResourceController();
```

---

## 🎯 Resumo Rápido

Para cada novo módulo:

1. **Importe** o `AuditHelper`
2. **Extraia** o usuário: `const user = (request as any).user`
3. **Verifique** se usuário existe: `if (user) { ... }`
4. **Chame** o método apropriado: `logCreate`, `logUpdate`, `logDelete`, `logView`
5. **Teste** todas as operações
6. **Revise** e valide

---

## 📊 Módulos a Integrar

Marque quando completar a integração:

- [x] Payment Methods ✅ (Exemplo de referência)
- [ ] Products
- [ ] Customers
- [ ] Sales
- [ ] Pre-Sales
- [ ] Users
- [ ] Categories
- [ ] Sellers
- [ ] Companies

---

## 💡 Dicas Finais

- **Performance:** Audit logs são assíncronos e não devem impactar a performance
- **Erros:** Se o log falhar, a aplicação continua funcionando normalmente
- **Detalhes:** Adicione informações úteis, mas evite excesso
- **Consistência:** Use sempre o mesmo padrão em todos os módulos
- **Segurança:** Nunca logue dados sensíveis (senhas, tokens, etc.)

---

## 📞 Suporte

Se tiver dúvidas sobre a integração:

1. Consulte o **AUDIT_HELPER_GUIDE.md** para exemplos detalhados
2. Veja o **payment-methods.controller.ts** como referência
3. Revise o **AUDIT_HELPER_IMPLEMENTATION.md** para visão geral completa

---

**Boa sorte com a integração! 🚀**
