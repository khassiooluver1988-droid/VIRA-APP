# KORA Social — repositório técnico VIRA-APP

**KORA** é a identidade visual da rede social. O nome técnico do repositório e do projeto Supabase permanece **VIRA-APP** para preservar o endereço público e as integrações.

## Versão online
**[Abrir KORA no navegador](https://khassiooluver1988-droid.github.io/VIRA-APP/)**

A versão web possui formulário de cadastro/entrada conectado ao Supabase, perfil, feed com textos e fotos reais, curtidas, comentários, seguidores, mensagens privadas, stories de 24 horas e área Resolver. Nenhuma conta nem publicação de exemplo deve ser criada automaticamente.

**Status: beta.** É necessário verificar configuração dos e-mails (SMTP/URLs), recuperação e exclusão de conta, moderação e testes de ponta a ponta com usuários reais antes de divulgar como rede social pronta. Os vídeos ainda não têm envio funcional.

## Referência visual aprovada
![Prévia limpa da tela KORA, sem marcação verde](docs/assets/referencias/kora-feed-sem-marcacao.webp)

A imagem é uma **referência de design**, não um registro de perfis ou publicações reais. A anotação verde do print foi retirada. Não substituir a aplicação funcional por essa imagem. [Guia completo de identidade visual](docs/KORA_VISUAL.md).

## Identidade
- Fundo branco-marfim `#FFFAF4`, cores oficiais laranja, rosa, roxo e azul.
- Marca KORA no topo e animação de abertura.
- Navegação: Início, Vídeos, Criar, Buscar, Perfil.
- O repositório contém a base Flutter inicial, mas a versão divulgável atualmente é a web.

## Infraestrutura e segurança
- GitHub Pages hospeda os arquivos de `docs/`.
- Supabase exclusivo do KORA/VIRA-APP, região `sa-east-1`.
- Dados protegidos por Row Level Security (RLS); não publicar chaves de administrador.
- Fotografias do bucket `vira-media` possuem URLs públicas.
- [Configuração pendente de e-mails e cadastro](docs/CONFIGURACAO_CADASTRO_REAL.md).

Protocolo: ASD-STE100-002-2026-ANEXAR-SEMPRE.
