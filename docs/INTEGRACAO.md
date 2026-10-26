# Integração VIRA — próximos passos

Status: repositório VIRA-APP criado; integração Supabase e publicação não realizadas.

1. Concluir importação dos assets originais da pasta `assets/branding/` do pacote VIRA, sem redesenhar a logo.
2. Instalar Flutter e executar testes em Android e iOS.
3. Criar projeto Supabase VIRA dedicado, após confirmar organização e eventuais custos.
4. Revisar e aplicar `supabase/migrations/0001_vira_mvp.sql` no banco exclusivo.
5. Verificar RLS com dois usuários; denúncias nunca podem ser lidas pelo cliente.
6. Implementar autenticação, mídia, denúncias, moderação, exclusão e antiabuso.
7. Registrar resultados antes de testar com usuários reais.

Não reutilizar Supabase de outros negócios. Não armazenar senhas, tokens ou chaves privadas no GitHub.
