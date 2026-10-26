# VIRA Social — preparação do lançamento para amigos e familiares

## Situação real
O projeto Flutter demonstrativo permanece intacto. A versão web pública atual (`docs/index.html`) continua disponível, enquanto `docs/index-live.html` é a próxima versão, com cadastro, autenticação, feed de fotos/texto, curtidas, comentários, perfis, seguidores, mensagens privadas e VIRA Resolve.
**Não há conexão Supabase ativa na versão nova até criar um projeto exclusivo e preencher `docs/supabase-config.js`.**

## Banco de dados
Use o arquivo `supabase/migrations/20261026_vira_social.sql` **somente em um novo projeto Supabase VIRA**. Não aplique SQL nos projetos existentes de outras iniciativas. Antes de implementar confirme que a criação do novo projeto está aprovada na organização Supabase correta. Revisar custo e autorização.

1. Criar projeto VIRA separado, região Brasil (São Paulo), após confirmação de organização/custo.
2. Executar migração em projeto exclusivo com registro de alteração, revisar RLS, `reports` e `storage.objects`.
3. Validar consultas sob papel anônimo (devem falhar) e usuários distintos (não podem alterar registros de outros).
4. Obter URL do projeto e chave *publishable* (pública; **nunca** service_role/secret) e adicionar a `docs/supabase-config.js`.
5. No Supabase Dashboard › Authentication › URL Configuration: Site URL `https://khassiooluver1988-droid.github.io/VIRA-APP/index-live.html`; Redirect URLs: este URL e futuramente a URL principal do app.
6. Configurar e validar e-mails de confirmação (SMTP e limites) antes de convidar vários usuários.
7. Cadastrar duas contas de teste com e-mails distintos, confirmar e-mail e testar perfil, fotos, comentários, seguir, mensagens e permissões; verificar exclusão de conta e moderação antes de divulgar ao público geral.
8. Acompanhar security/performance advisors e custos de transferência de imagens.

## Divulgação
Inicie com um grupo fechado de amigos/familiares após validação. Dados publicados ficam disponíveis para outros usuários cadastrados. O armazenamento das fotos no bucket público fornece URLs acessíveis a quem possuir link, mesmo fora do aplicativo.

## Lacunas para lançamento amplo
Stories e vídeos curtos, recuperação de senha em sessão de atualização, exclusão autônoma da conta/dados, moderação com painel administrativo, controles etários, termos e política de privacidade revisados e verificação no Safari físico. Não divulgar como produto completo ou Instagram equivalente.

## Testes
`node --check docs/live.js`; executar workflow GitHub "Testar VIRA Social (preparacao)" e revisão das políticas no projeto Supabase real. Testes com mocks não substituem operação real.

**Orçamento orientativo:** até R$ 2.000; criação do novo projeto Supabase cotada em US$ 0/mês na organização conectada, sujeita a aprovação do usuário e limites de uso.
