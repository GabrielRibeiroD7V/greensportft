# Upgrade UI/UX Pública - GreenSport

Upgrade completo de layout e navegação para transformar a plataforma em um sportsbook profissional.

## Alterações

### 1. Layout Base e Navegação
- Refatorar `src/routes/__root.tsx` para incluir um Header profissional com busca e navegação densa.
- Implementar Layout de 3 colunas em `src/routes/football.tsx`: Sidebar de Ligas (esquerda), Feed de Jogos (centro), Bilhete (direita).
- Sidebar dinâmica carregando competições reais do banco.
- Filtros de estado (tab=live, today, upcoming) baseados em URL para persistência.

### 2. Componentes de Futebol
- Refatorar cards de partidas para maior densidade.
- Agrupar partidas por competição no feed.
- Implementar seção de "Jogos em Destaque" e "Ligas Populares".
- Criar a rota real `/football/match/$fixtureId` para detalhes da partida.

### 3. Bet Slip (Bilhete)
- Integrar o Bilhete como uma coluna persistente no desktop largo.
- Refinar visual do Bilhete para parecer profissional (Header escuro, totais destacados).
- Garantir comportamento mobile via Drawer/Sheet.

### 4. Busca e Filtros
- Implementar busca funcional no Header sobre times e competições.
- Validar todos os links e navegação de retorno.

## Detalhes Técnicos
- Utilizar `useSearch` e `navigate` do TanStack Router para filtros via URL.
- Manter RLS e RPCs financeiros intactos.
- Cores: Navy (#0f172a), Green (#16a34a), Slate-50/100 para fundos.
- Responsividade: Sidebar vira drawer no mobile, Bilhete vira Drawer.

## Plano de Ação

1. **Header Profissional**: Atualizar `src/routes/__root.tsx`.
2. **Sidebar & Layout**: Atualizar `src/routes/football.tsx`.
3. **Feed de Jogos**: Atualizar componentes de listagem.
4. **Detalhe da Partida**: Finalizar `src/routes/football/match.$fixtureId.tsx`.
5. **Busca & Filtros**: Implementar lógica de filtragem global.
6. **Polimento Visual**: Ajustes de margens, tipografia e cores Navy.
