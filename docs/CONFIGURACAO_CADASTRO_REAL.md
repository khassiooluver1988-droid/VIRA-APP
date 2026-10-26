# VIRA-APP — Etapas para liberar cadastros (26/10/2026)

Status: banco Supabase VIRA-APP criado em `sa-east-1`, migração aplicada, publicação web via GitHub Pages. **Não compartilhar a versão beta como cadastro disponível até concluir os e-mails de confirmação e validar pelo menos duas contas reais.**

## URLs do projeto

- VIRA conectado: https://khassiooluver1988-droid.github.io/VIRA-APP/index-live.html
- Supabase VIRA: https://supabase.com/dashboard/project/fqmphxlvdqwizuzqymza
- GitHub: https://github.com/khassiooluver1988-droid/VIRA-APP

## Tarefa 1 — URL de confirmação de e-mail (dashboard)

1. Abra Supabase › VIRA-APP › Authentication › URL Configuration.
2. Site URL: `https://khassiooluver1988-droid.github.io/VIRA-APP/index-live.html`
3. Redirect URLs: acrescente `https://khassiooluver1988-droid.github.io/VIRA-APP/index-live.html`.
4. Salve e confira os valores. Nunca use as URLs de outro projeto.

## Tarefa 2 — SMTP próprio antes de convidar amigos

O SMTP padrão do Supabase só envia a e-mails previamente autorizados na organização e tem limite de 2 e-mails/hora. Para que familiares e amigos consigam confirmar contas, habilite SMTP externo, por exemplo com Brevo Free (limite divulgado: 300 e-mails/dia; sujeito à política da plataforma).

1. Crie conta gratuita Brevo: https://www.brevo.com/
2. Configure e verifique um remetente ou domínio, de preferência domínio próprio (se houver).
3. Ative o envio transacional e obtenha login SMTP + chave SMTP na conta Brevo.
4. Supabase › Authentication › SMTP Settings › Enable Custom SMTP.
5. Host: `smtp-relay.brevo.com`. Porta: `587`. Usuário: login SMTP do Brevo. Senha: chave SMTP do Brevo (não é API key).
6. Endereço de remetente = remetente que você verificou no Brevo. Nome: VIRA.
7. Salve as credenciais diretamente no painel. **Não coloque credenciais no GitHub nem as compartilhe no chat.**
8. Mantenha Confirm email habilitado para reduzir cadastro com e-mails falsos.
9. Para prevenir abuso, configurar CAPTCHA/rate limits antes de divulgação ampla.

## Tarefa 3 — Teste entre pessoas reais

- [ ] Pessoa A cadastra-se em e-mail próprio e confirma no link recebido.
- [ ] Pessoa B cadastra-se em e-mail diferente e confirma.
- [ ] Ambas conseguem entrar, sair e voltar.
- [ ] Pessoa A edita o próprio perfil e não edita o da B.
- [ ] Pessoa A publica texto e foto; B vê a publicação.
- [ ] B curte e comenta; A vê as interações.
- [ ] A e B seguem-se e visualizam contadores.
- [ ] A envia mensagem para B; somente A e B conseguem ler.
- [ ] A cria pedido VIRA Resolve; B responde; A encerra como resolvido.
- [ ] Verificar recuperação de senha por e-mail.
- [ ] Verificar política de privacidade, termos, denúncia/moderação e direitos dos usuários antes de divulgação ampla.

## Segurança confirmada

- Projeto Supabase isolado (não reutilizou bancos anteriores).
- 9 tabelas `public` com RLS habilitada.
- 26 políticas RLS; anon sem grants para as tabelas sociais.
- Teste SQL de duas identidades temporárias aprovou trigger de perfis e bloqueio de gravação/exclusão por outro usuário, dentro de transação revertida.
- Advisor de segurança inicial sem alertas.
- `sb_publishable_` é a única chave do Supabase publicada no frontend. Não usar `service_role`/secret.

## Limitações

- Ausência de testes reais de confirmação de e-mails e sessão de usuários comuns.
- Não publicar o VIRA como produto completo: vídeos, stories, moderação avançada e exclusão autônoma de contas ainda não implementados.
- Em hospedagem estática, confirme se o aplicativo e o Supabase continuam no plano gratuito e revise limites de tráfego.
- `Lara.IA-teste` encontra-se pausado, não excluído. A documentação atual Supabase indica uma janela de até 1 ano para restauração. Com dois projetos gratuitos ativos, restaurar Lara exigirá liberar outra vaga ou plano aprovado.

Referências:
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://help.brevo.com/hc/pt/articles/208580669-FAQ-Quais-s%C3%A3o-os-limites-do-plano-Gr%C3%A1tis
