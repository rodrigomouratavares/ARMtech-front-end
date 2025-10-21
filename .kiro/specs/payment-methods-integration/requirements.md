# Requirements Document

## Introduction

Esta especificação define os requisitos para integrar as formas de pagamento do frontend Flow CRM com o backend real, substituindo o serviço mockado atual por chamadas HTTP reais para a API. O sistema já possui uma interface funcional no frontend e endpoints implementados no backend, necessitando apenas da integração entre eles.

## Requirements

### Requirement 1

**User Story:** Como administrador do sistema, quero que as formas de pagamento sejam carregadas do backend real, para que os dados sejam persistentes e compartilhados entre usuários.

#### Acceptance Criteria

1. WHEN o usuário acessa a página de formas de pagamento THEN o sistema SHALL carregar os dados do endpoint `/api/payment-methods`
2. WHEN ocorre erro na comunicação com o backend THEN o sistema SHALL exibir mensagem de erro apropriada
3. WHEN não há formas de pagamento cadastradas THEN o sistema SHALL exibir mensagem informativa

### Requirement 2

**User Story:** Como administrador do sistema, quero criar novas formas de pagamento que sejam salvas no backend, para que fiquem disponíveis permanentemente no sistema.

#### Acceptance Criteria

1. WHEN o usuário preenche o formulário de cadastro THEN o sistema SHALL validar os dados antes do envio
2. WHEN o usuário submete uma nova forma de pagamento THEN o sistema SHALL enviar POST para `/api/payment-methods`
3. WHEN a criação é bem-sucedida THEN o sistema SHALL atualizar a lista local e exibir mensagem de sucesso
4. WHEN ocorre erro na criação THEN o sistema SHALL exibir mensagem de erro específica
5. WHEN já existe uma forma de pagamento com o mesmo código THEN o sistema SHALL exibir erro de duplicação

### Requirement 3

**User Story:** Como administrador do sistema, quero editar formas de pagamento existentes, para que possa corrigir informações ou atualizar status.

#### Acceptance Criteria

1. WHEN o usuário clica no botão de editar THEN o sistema SHALL carregar os dados da forma de pagamento no formulário
2. WHEN o usuário submete alterações THEN o sistema SHALL enviar PUT para `/api/payment-methods/:id`
3. WHEN a atualização é bem-sucedida THEN o sistema SHALL atualizar a lista local e exibir mensagem de sucesso
4. WHEN ocorre erro na atualização THEN o sistema SHALL exibir mensagem de erro específica

### Requirement 4

**User Story:** Como administrador do sistema, quero desativar formas de pagamento, para que não fiquem disponíveis para novas vendas mas mantenham histórico.

#### Acceptance Criteria

1. WHEN o usuário clica no botão de excluir THEN o sistema SHALL solicitar confirmação
2. WHEN o usuário confirma a exclusão THEN o sistema SHALL enviar DELETE para `/api/payment-methods/:id`
3. WHEN a exclusão é bem-sucedida THEN o sistema SHALL remover o item da lista e exibir mensagem de sucesso
4. WHEN a forma de pagamento está sendo usada THEN o sistema SHALL exibir erro informando que não pode ser excluída

### Requirement 5

**User Story:** Como usuário do sistema, quero que as formas de pagamento sejam carregadas automaticamente em outros módulos, para que possa utilizá-las em vendas e relatórios.

#### Acceptance Criteria

1. WHEN outros componentes precisam de formas de pagamento THEN o sistema SHALL fornecer um serviço centralizado
2. WHEN há cache de formas de pagamento THEN o sistema SHALL invalidar o cache após mudanças
3. WHEN ocorre erro no carregamento THEN o sistema SHALL permitir retry manual

### Requirement 6

**User Story:** Como desenvolvedor, quero manter compatibilidade com a interface atual, para que não haja quebras na experiência do usuário.

#### Acceptance Criteria

1. WHEN a integração é implementada THEN a interface atual SHALL permanecer inalterada
2. WHEN há estados de loading THEN o sistema SHALL exibir indicadores visuais apropriados
3. WHEN há dados em cache THEN o sistema SHALL exibir dados enquanto carrega atualizações