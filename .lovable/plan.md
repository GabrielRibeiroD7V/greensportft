# Plano de Desenvolvimento - GreenSport Fase 5A: Preparação da Integração Real

## Objetivos
Implementar a arquitetura completa para integração com a API-Football v3, permitindo a transição segura entre dados simulados e reais, garantindo que o sistema opere corretamente mesmo sem a chave de API configurada.

## Ações Técnicas

### 1. Banco de Dados e Mappings
- **Migration SQL**:
  - Adicionar `football_data_mode` (enum SIMULATION/REAL) à tabela `app_settings`.
  - Garantir que a tabela `provider_mappings` suporte a relação entre `internal_id` e `provider_entity_id` para competições, times e fixtures.
  - Adicionar coluna `is_simulated` (boolean) às tabelas `competitions`, `teams` e `fixtures` se ainda não existirem.
  - Criar índices para performance em buscas por `provider_id` e mappings.

### 2. Football Provider Engine
- **FootballProvider Interface**: Consolidar a abstração para `getCompetitions`, `getTeams`, `getFixtures`, `getLiveFixtures`.
- **ApiFootballProvider**: 
  - Refatorar para lidar com a ausência de `API_FOOTBALL_KEY`.
  - Implementar normalização de erros: `PROVIDER_NOT_CONFIGURED`, `RATE_LIMITED`, `INVALID_CREDENTIALS`.
  - Garantir que a chave seja lida apenas no servidor (`process.env`).

### 3. Serviços de Sincronização e Idempotência
- **sync.server.ts**:
  - Implementar `syncCompetitions`, `syncTeams`, `syncFixtures` com lógica de `UPSERT` e mapeamento.
  - Garantir que rodar a sincronização repetidamente não crie duplicatas.
  - Adicionar suporte a `football_data_mode` nos serviços internos.

### 4. Admin Panel - Integrações
- **Nova Rota `/admin/integrations`**:
  - Card de status da API-Football (Configurado/Não configurado).
  - Ação "Testar Conexão": Somente ADMIN, valida a presença da chave e faz um ping de saúde na API.
  - Ação "Sincronizar Futebol": Gatilho manual para atualização de dados reais.
  - Logs de integração: Exibir as últimas tentativas e erros.

### 5. Frontend e Consumo de Dados
- **football.functions.ts**: Atualizar para respeitar o `football_data_mode`.
- **UI /football**: Garantir que mostre dados simulados quando em modo `SIMULATION` e oculte/prepare para dados reais.

## Verificação e Testes
- **Build & SSR**: Garantir que o build passe sem a chave de API.
- **Segurança**: Confirmar que usuários comuns não acessam funções de sync ou chaves.
- **Regressão**: Validar que o `place_bet` e `wallet` continuam funcionando com dados simulados.

## Conclusão da Fase 5A
O sistema estará pronto para receber a `API_FOOTBALL_KEY` e ativar a sincronização real com um único clique no painel administrativo, mantendo a estabilidade do ambiente de simulação.
