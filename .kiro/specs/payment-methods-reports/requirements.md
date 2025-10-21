# Requirements Document

## Introduction

Esta especificação define o desenvolvimento de uma página de relatórios para o sistema, focando inicialmente em um único relatório: o resumo de vendas por forma de pagamento. O relatório permitirá aos usuários visualizar dados consolidados de vendas organizados por finalizadora, com filtros por período e finalizadora específica, incluindo o total de pré-vendas convertidas.

## Requirements

### Requirement 1

**User Story:** Como usuário do sistema, eu quero visualizar um relatório de vendas por forma de pagamento, para que eu possa analisar o desempenho das diferentes finalizadoras em um período específico.

#### Acceptance Criteria

1. WHEN o usuário acessa a página de relatórios THEN o sistema SHALL exibir uma listagem das formas de pagamento
2. WHEN o usuário visualiza o relatório THEN o sistema SHALL mostrar o resumo de vendas por forma de pagamento
3. WHEN o usuário visualiza o relatório THEN o sistema SHALL exibir os campos: Finalizadora e Valor para cada entrada
4. WHEN o usuário visualiza o relatório THEN o sistema SHALL mostrar a data do período no canto superior da página

### Requirement 2

**User Story:** Como usuário do sistema, eu quero filtrar o relatório por período de datas, para que eu possa analisar vendas em intervalos específicos de tempo.

#### Acceptance Criteria

1. WHEN o usuário acessa a página de relatórios THEN o sistema SHALL fornecer um filtro de período com data inicial e final
2. WHEN o usuário seleciona um período THEN o sistema SHALL atualizar o relatório mostrando apenas dados do período selecionado
3. WHEN o usuário aplica o filtro de período THEN o sistema SHALL exibir a data do período selecionado no canto superior da página
4. IF nenhum período for selecionado THEN o sistema SHALL usar um período padrão (ex: último mês)

### Requirement 3

**User Story:** Como usuário do sistema, eu quero filtrar o relatório por finalizadora específica, para que eu possa analisar o desempenho de uma forma de pagamento individual.

#### Acceptance Criteria

1. WHEN o usuário acessa a página de relatórios THEN o sistema SHALL fornecer um filtro por finalizadora
2. WHEN o usuário seleciona uma finalizadora específica THEN o sistema SHALL mostrar apenas dados relacionados à finalizadora selecionada
3. WHEN o usuário limpa o filtro de finalizadora THEN o sistema SHALL mostrar dados de todas as finalizadoras
4. IF nenhuma finalizadora for selecionada THEN o sistema SHALL mostrar dados de todas as finalizadoras disponíveis

### Requirement 4

**User Story:** Como usuário do sistema, eu quero visualizar o total de pré-vendas convertidas no relatório, para que eu possa entender o volume total de conversões no período analisado.

#### Acceptance Criteria

1. WHEN o usuário visualiza o relatório THEN o sistema SHALL calcular e exibir o total de pré-vendas convertidas
2. WHEN o usuário aplica filtros THEN o sistema SHALL recalcular o total de pré-vendas convertidas baseado nos filtros aplicados
3. WHEN o sistema calcula o total THEN o sistema SHALL considerar apenas pré-vendas que foram efetivamente convertidas em vendas
4. WHEN o sistema exibe o total THEN o sistema SHALL formatar o valor monetário de acordo com a moeda local

### Requirement 5

**User Story:** Como usuário do sistema, eu quero que os dados do relatório sejam apresentados de forma clara e organizada, para que eu possa facilmente interpretar as informações de vendas.

#### Acceptance Criteria

1. WHEN o usuário visualiza o relatório THEN o sistema SHALL organizar os dados em uma tabela ou lista estruturada
2. WHEN o sistema exibe valores monetários THEN o sistema SHALL formatar os valores com a moeda apropriada
3. WHEN o sistema exibe o relatório THEN o sistema SHALL ordenar as finalizadoras de forma lógica (ex: por valor decrescente)
4. IF não houver dados para o período selecionado THEN o sistema SHALL exibir uma mensagem informativa apropriada