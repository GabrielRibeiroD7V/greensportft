# GREENSPORT — REDESIGN SPORTSBOOK

Este plano visa transformar a GreenSport em uma plataforma de apostas esportivas de nível profissional, com foco em densidade de informações, navegação fluida em dispositivos móveis e uma interface desktop robusta em 3 colunas.

## Estrutura e Navegação

### Mobile First
- **Header Compacto:** Logo, menu hambúrguer, saldo/conta (se logado) ou login/cadastro (se deslogado).
- **Bottom Navigation:** Acesso rápido a Futebol, Ao Vivo, Bilhete (centralizado e destacado), Minhas Apostas e Carteira.
- **Menu Lateral (Drawer):** Categorias (Futebol, Ao Vivo, Hoje, etc.), Minha Área e Principais Ligas.
- **Atalhos Horizontais:** Filtros rápidos para competições e estados de jogo (Ao Vivo, Hoje, Favoritos).

### Desktop
- **Layout 3 Colunas:** Sidebar esquerda (240px), Feed Central (flex:1), Bet Slip direito (320-360px).
- **Sidebar Profissional:** Navegação completa, ligas favoritas e links institucionais.
- **Header Moderno:** Busca integrada, navegação principal e controles de conta.

## Componentes de UI

### Feed de Jogos (Cards)
- **Densidade Elevada:** Cards compactos no mobile permitindo ver 2-4 jogos simultaneamente.
- **Destaques (High-Traffic):** Carrossel horizontal de jogos importantes com odds 1/X/2 visíveis.
- **Grouping:** Jogos agrupados por liga com títulos claros.
- **Odds Contextuais:** Botões 1/X/2 diretos na listagem, com estados visuais para Selecionado, Suspenso e Stale.

### Bet Slip (Bilhete)
- **Mobile:** Abre em um Sheet (Drawer inferior) ocupando 60-80% da tela.
- **Resumo Financeiro:** Cálculo em tempo real de Odd Total, Stake, Lucro e Retorno.
- **Segurança:** Validação de cotações e temporal antes de `placeBet`.

## Identidade Visual
- **Paleta:** Navy/Preto Azulado (estrutura), Branco (cards), Verde (ações e status), Cinza (metadados).
- **Branding:** Integração da logo oficial shield-style em todos os pontos de contato.

## Detalhes Técnicos e SEO
- **Páginas Adicionais:** Criação de `/support` e `/rules` para conformidade operacional.
- **Deep Links:** Garantia de que todas as rotas funcionam via URL direta (refresh-safe).
- **SEO & Head:** Metadados exclusivos por rota e OpenGraph completo.
- **Performance:** Uso de lazy loading e Suspense para carregamento otimizado de fixtures.

## Etapas de Implementação

1. **Infraestrutura UI:** Criação de novos componentes atômicos (BottomNav, MobileHeader, LeagueGroup).
2. **Refatoração da Raiz:** Ajuste do layout global em `src/routes/__root.tsx`.
3. **Página de Futebol:** Reescrita completa de `src/routes/football.tsx` para o novo layout de 3 colunas/compacto.
4. **Bet Slip:** Migração para o modelo de Sheet/Sidebar reativo.
5. **Auditoria e Build:** Verificação de tipos, SSR e integridade de dados.
