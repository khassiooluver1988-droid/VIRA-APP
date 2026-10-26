# KORA Social — Identidade visual (mantido no repositório técnico VIRA-APP)

A marca de produto exibida aos usuários é **KORA**, com cores originais laranja, rosa, roxo e azul sobre fundo **branco-marfim** (#FFFAF4). O nome de infraestrutura **VIRA-APP** é preservado no GitHub e no Supabase para evitar quebra de URLs, referências e dados.

## Implementado
- Home KORA na URL principal do GitHub Pages.
- Logomarca da imagem fornecida (versão reduzida e comprimida para carregamento no navegador; o arquivo mestre do usuário não é alterado) no splash, autenticação e cabeçalho.
- Animação de abertura com trilhas de movimento (CSS, respeita reduced-motion).
- Menu inferior: Início, Vídeos, Criar, Buscar e Perfil.
- Stories reais de imagens com 24h de validade no banco Supabase; usuários sem stories não aparecem.
- Feed com fotos/texto, curtidas, comentários, seguidores, mensagens e VIRA Resolve/KORA Resolve preservados.
- Perfil com contadores e grade de publicações reais.
- Sem pessoas inventadas nem posts fictícios.
- Vídeos exibem estado de desenvolvimento; envio de vídeos ainda **não** implementado.

## Atenção antes de compartilhar amplamente
- Confirmar URL de redirecionamento em Supabase Auth; configurar SMTP para e-mails de pessoas fora da equipe.
- Testar cadastro/login entre duas pessoas reais, recuperação de senha, privacidade, exclusão de conta e moderação.
- As imagens enviadas ao bucket `vira-media` possuem URLs públicas.
- O app é uma versão web beta; não uma aplicação iOS nativa nem um clone completo do Instagram.
- Não inserir senhas em GitHub.

## Prévia atualizada — 26/10/2026

![Captura de referência corrigida, sem seta/marcação verde](assets/referencias/kora-feed-sem-marcacao.webp)

Esta prévia foi ajustada somente para remover a anotação verde. **Não** faz parte do feed e não deve virar uma publicação fictícia. A interface de produção continua renderizando dados de pessoas que se cadastrarem.
