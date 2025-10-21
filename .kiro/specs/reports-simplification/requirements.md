# Requirements Document

## Introduction

Esta especificação define a simplificação da página de relatórios do sistema Flow CRM, mantendo apenas o relatório de formas de pagamento e implementando a integração completa com o backend. O objetivo é remover complexidade desnecessária, focar em uma funcionalidade essencial e garantir que os dados sejam obtidos diretamente do servidor em vez de usar dados mock.

## Requirements

### Requirement 1

**User Story:** Como usuário do sistema, eu quero uma página de relatórios simplificada que mostre apenas o relatório de formas de pagamento, para que eu possa focar na análise essencial sem distrações de funcionalidades não utilizadas.

#### Acceptance Criteria

1. WHEN o usuário acessa a página de relatórios THEN o sistema SHALL exibir diretamente o relatório de formas de pagamento
2. WHEN o usuário visualiza a página THEN o sistema SHALL remover qualquer seletor de tipo de relatório
3. WHEN o usuário acessa a página THEN o sistema SHALL manter todos os filtros existentes (período e finalizadora)
4. WHEN o usuário visualiza o relatório THEN o sistema SHALL manter a mesma funcionalidade de exportação (CSV/PDF)

### Requirement 2

**User Story:** Como usuário do sistema, eu quero que os dados do relatório sejam obtidos diretamente do backend, para que eu tenha informações precisas e atualizadas em tempo real.

#### Acceptance Criteria

1. WHEN o usuário carrega o relatório THEN o sistema SHALL buscar dados reais do servidor via API
2. WHEN o sistema faz requisições THEN o sistema SHALL usar endpoints RESTful apropriados
3. WHEN o sistema processa dados THEN o sistema SHALL substituir completamente os serviços mock
4. WHEN ocorrem erros de rede THEN o sistema SHALL exibir mensagens de erro apropriadas com opção de retry

### Requirement 3

**User Story:** Como desenvolvedor, eu quero implementar endpoints de API no backend para fornecer dados de relatórios, para que o frontend possa consumir dados reais do banco de dados.

#### Acceptance Criteria

1. WHEN o frontend solicita dados de relatório THEN o backend SHALL fornecer endpoint GET /api/reports/payment-methods
2. WHEN o frontend solicita resumo THEN o backend SHALL fornecer endpoint GET /api/reports/summary
3. WHEN o backend recebe filtros THEN o sistema SHALL aplicar filtros de data e forma de pagamento
4. WHEN o backend processa dados THEN o sistema SHALL calcular agregações (totais, contagens) corretamente

### Requirement 4

**User Story:** Como usuário do sistema, eu quero que o relatório calcule corretamente as pré-vendas convertidas baseado em dados reais, para que eu tenha métricas precisas de conversão.

#### Acceptance Criteria

1. WHEN o sistema calcula pré-vendas convertidas THEN o sistema SHALL consultar vendas que originaram de pré-vendas
2. WHEN o sistema agrega dados THEN o sistema SHALL separar vendas diretas de vendas convertidas
3. WHEN o sistema exibe totais THEN o sistema SHALL mostrar valores corretos de conversão por forma de pagamento
4. WHEN o usuário aplica filtros THEN o sistema SHALL recalcular métricas baseado nos critérios selecionados

### Requirement 5

**User Story:** Como usuário do sistema, eu quero que a interface seja mais limpa e direta, para que eu possa acessar rapidamente as informações de formas de pagamento sem navegação desnecessária.

#### Acceptance Criteria

1. WHEN o usuário acessa /reports THEN o sistema SHALL redirecionar automaticamente para o relatório de formas de pagamento
2. WHEN o usuário visualiza a página THEN o sistema SHALL remover abas ou seletores de tipo de relatório
3. WHEN o usuário visualiza o cabeçalho THEN o sistema SHALL mostrar "Relatório de Formas de Pagamento" como título principal
4. WHEN o usuário navega THEN o sistema SHALL manter breadcrumbs simples: Dashboard > Relatórios

### Requirement 6

**User Story:** Como administrador do sistema, eu quero que apenas usuários com permissão adequada acessem os relatórios, para que informações financeiras sejam protegidas adequadamente.

#### Acceptance Criteria

1. WHEN um usuário tenta acessar relatórios THEN o sistema SHALL verificar a permissão 'modules.reports'
2. WHEN um usuário sem permissão acessa THEN o sistema SHALL exibir página de acesso negado
3. WHEN o sistema verifica permissões THEN o sistema SHALL usar o contexto de autenticação existente
4. WHEN um usuário faz logout THEN o sistema SHALL limpar qualquer cache de dados de relatórios