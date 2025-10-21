# 🍞 Guia do Sistema de Notificações Toast

Este guia descreve como usar o sistema de notificações toast implementado no flow-crm usando react-toastify.

## 📋 Visão Geral

O sistema de toast fornece feedback visual para ações do usuário com configuração padronizada:
- **Posição**: bottom-right
- **Duração**: 5000ms (5 segundos)
- **Tema**: light
- **Transição**: Bounce
- **Interativo**: Clicável, arrastável, pausa ao hover

## 🚀 Como Usar

### Import
```typescript
import ToastService, { TOAST_MESSAGES } from '../../../services/ToastService';
```

### Uso Básico
```typescript
// Sucesso
ToastService.success('Operação realizada com sucesso!');

// Erro
ToastService.error('Erro ao realizar operação!');

// Aviso
ToastService.warning('Atenção! Verifique os dados.');

// Informação
ToastService.info('Informação registrada.');
```

### Usando Mensagens Padronizadas
```typescript
// Para pré-vendas
ToastService.success(TOAST_MESSAGES.presale.created);
ToastService.error(TOAST_MESSAGES.presale.invalidData);

// Para produtos
ToastService.success(TOAST_MESSAGES.product.created);
ToastService.error(TOAST_MESSAGES.product.invalidData);

// Para clientes
ToastService.success(TOAST_MESSAGES.customer.created);
ToastService.error(TOAST_MESSAGES.customer.invalidData);

// Para inventário
ToastService.success(TOAST_MESSAGES.inventory.adjusted);
ToastService.error(TOAST_MESSAGES.inventory.productNotFound);
```

### Funções Auxiliares
```typescript
// Funções de conveniência (mesmo resultado que ToastService.*)
import { showSuccess, showError, showWarning, showInfo } from '../../../services/ToastService';

showSuccess('Sucesso!');
showError('Erro!');
```

## 📝 Tipos de Toast e Quando Usar

### ✅ Success (Sucesso)
**Quando usar**: Ações concluídas com êxito
```typescript
ToastService.success('Produto cadastrado com sucesso!');
```

### ❌ Error (Erro)
**Quando usar**: Erros, validações falharam, exceções
```typescript
ToastService.error('Preencha todos os campos obrigatórios!');
```

### ⚠️ Warning (Aviso)
**Quando usar**: Alertas importantes, confirmações
```typescript
ToastService.warning('Esta ação não pode ser desfeita!');
```

### ℹ️ Info (Informação)
**Quando usar**: Informações neutras, status updates
```typescript
ToastService.info('Editando produto: Nome do Produto');
```

## 📚 Mensagens Padronizadas Disponíveis

### Pré-vendas (`TOAST_MESSAGES.presale`)
- `created`: '🎉 Pré-venda criada com sucesso!'
- `updated`: '✅ Pré-venda atualizada com sucesso!'
- `deleted`: '🗑️ Pré-venda excluída com sucesso!'
- `statusChanged`: '📋 Status da pré-venda alterado com sucesso!'
- `invalidData`: '⚠️ Selecione um cliente e adicione pelo menos um item!'
- `deleteConfirm`: '❓ Tem certeza que deseja excluir esta pré-venda?'

### Produtos (`TOAST_MESSAGES.product`)
- `created`: '🛍️ Produto cadastrado com sucesso!'
- `updated`: '✅ Produto atualizado com sucesso!'
- `deleted`: '🗑️ Produto excluído com sucesso!'
- `invalidData`: '⚠️ Preencha todos os campos obrigatórios!'
- `deleteConfirm`: '❓ Tem certeza que deseja excluir este produto?'

### Clientes (`TOAST_MESSAGES.customer`)
- `created`: '👥 Cliente cadastrado com sucesso!'
- `updated`: '✅ Cliente atualizado com sucesso!'
- `deleted`: '🗑️ Cliente excluído com sucesso!'
- `invalidData`: '⚠️ Preencha todos os campos obrigatórios!'
- `deleteConfirm`: '❓ Tem certeza que deseja excluir este cliente?'

### Inventário (`TOAST_MESSAGES.inventory`)
- `adjusted`: '📦 Estoque ajustado com sucesso!'
- `productNotFound`: '❌ Produto não encontrado!'
- `invalidData`: '⚠️ Preencha todos os campos obrigatórios!'

### Genéricas (`TOAST_MESSAGES.generic`)
- `success`: '✅ Operação realizada com sucesso!'
- `error`: '❌ Erro ao realizar operação!'
- `warning`: '⚠️ Atenção! Verifique os dados informados.'
- `info`: 'ℹ️ Informação registrada.'

## 🎨 Configurações Avançadas

### Personalizar um Toast Específico
```typescript
ToastService.success('Mensagem personalizada!', {
  autoClose: 2000,  // 2 segundos
  position: 'top-center',
  theme: 'dark'
});
```

### Verificar se um Toast Está Ativo
```typescript
const toastId = ToastService.success('Mensagem!');
if (ToastService.isActive(toastId)) {
  console.log('Toast ainda está sendo exibido');
}
```

### Fechar Todos os Toasts
```typescript
ToastService.dismiss();
```

## 🔄 Fluxos Comuns de Uso

### Formulário com Validação
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validação
  if (!formData.name || !formData.email) {
    ToastService.error(TOAST_MESSAGES.customer.invalidData);
    return;
  }
  
  try {
    // Salvar dados
    saveCustomer(formData);
    ToastService.success(TOAST_MESSAGES.customer.created);
    resetForm();
  } catch (error) {
    ToastService.error('Erro ao salvar cliente!');
  }
};
```

### Confirmação de Delete
```typescript
const handleDelete = (item: Customer) => {
  if (confirm(TOAST_MESSAGES.customer.deleteConfirm)) {
    try {
      deleteCustomer(item.id);
      ToastService.success(`Cliente ${item.name} excluído com sucesso!`);
    } catch (error) {
      ToastService.error('Erro ao excluir cliente!');
    }
  }
};
```

## 🏗️ Arquitetura

- **ToastContainer**: Configurado globalmente no `App.tsx`
- **ToastService**: Classe centralizada em `src/services/ToastService.ts`
- **TOAST_MESSAGES**: Mensagens padronizadas organizadas por módulo
- **Configurações**: Aplicadas de forma consistente em todos os toasts

## 🤝 Boas Práticas

1. **Use mensagens padronizadas** sempre que possível
2. **Seja específico** nas mensagens de erro
3. **Mantenha consistência** nos tipos de toast
4. **Evite spamming** - um toast por ação
5. **Use emojis com moderação** - já estão nas mensagens padrão
6. **Teste** sempre a experiência do usuário

## 🔧 Troubleshooting

### Toast não aparece
- Verifique se o `ToastContainer` está renderizado no App.tsx
- Confirme se o import está correto
- Veja o console para erros

### Estilo incorreto
- Confirme se o CSS do react-toastify foi importado
- Verifique conflitos com CSS customizado

### Performance
- Evite criar muitos toasts simultaneamente
- Use `ToastService.dismiss()` se necessário limpar toasts antigos