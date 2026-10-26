# VIRA-APP

**VIRA — Assista. Conecte-se. Resolva.**

Aplicativo social para Android e iPhone: vídeos curtos, talentos, pedidos de ajuda e oportunidades reais.

## Situação do projeto
Este repositório contém a base técnica inicial do VIRA. **Não é um produto publicado**.
- MVP Flutter demonstrativo local: cinco abas, splash de marca e fluxo de pedidos em memória.
- Estrutura SQL Supabase preparada para revisão. **Não aplicada em banco remoto**.
- Testes estáticos locais: 8 aprovações, mas sem compilação Flutter nem testes mobile reais.
- Integração de login, vídeos em rede, denúncias funcionais e persistência de dados ainda pendentes.
- Os arquivos originais da logo e da animação são mantidos no pacote local e precisam ser enviados à pasta `assets/branding/` antes da compilação do projeto Flutter completo.

## Marca aprovada
Não redesenhar ou alterar a logo do VIRA. Manter símbolo roxo/laranja, tipografia, slogan e cores da referência original. Motion graphics da abertura usa camadas fiéis ao material fornecido.

## Começar no computador
1. Baixar o pacote completo VIRA do chat e extrair.
2. Instalar Flutter SDK: https://docs.flutter.dev/get-started/install .
3. Na pasta extraída, executar:
   - `flutter doctor`
   - `flutter create --project-name vira .`
   - `flutter pub get`
   - `flutter test`
   - `flutter run`
4. Antes de integrar usuários, criar um Supabase **exclusivo** do VIRA e testar RLS.
5. Nunca colocar `service_role`, `sb_secret_`, senhas reais ou `.env` no repositório.

**Orçamento inicial máximo:** R$ 2.000. **Protocolo de planejamento:** ASD-STE100-002-2026-ANEXAR-SEMPRE.

## Escopo do MVP
Início, Descobrir, Criar, Resolver, Perfil; autenticação planejada; publicação, respostas e status de resolução em desenvolvimento. Testes Android/iOS e moderação real são condições para piloto público.
