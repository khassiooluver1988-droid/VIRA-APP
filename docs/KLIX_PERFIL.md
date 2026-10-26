# KLIX — mudança visual e foto de perfil

**Aplicação:** KLIX. **Infraestrutura preservada:** repositório `VIRA-APP`, Supabase `fqmphxlvdqwizuzqymza`, tabelas, URLs e sessões existentes.

## Implementado
- Logo completa (quadrado com câmera/balão + KLIX) exclusivamente na animação de abertura.
- Dentro do aplicativo e no login, apenas nome `KLIX`, sem logomarca quadrada ou fundo.
- Cabeçalho alinhado por grid; botão de criar story e símbolo de mais centralizados.
- Tela Editar perfil: foto opcional, pré-visualização, nome, usuário, bio e salvar.
- Foto é recortada em quadrado de 512 pixels e comprimida como JPEG no navegador.
- O upload é armazenado em `vira-media/{uid}/avatars/{uuid}.jpg` via SDK. O banco salva o caminho na coluna `profiles.avatar_path`.
- Todos os avatares passam a exibir a foto enviada; sem fotos simuladas de pessoas.
- Falhas no upload ou banco mostram erro; uma foto anterior não é sobrescrita sem sucesso.
- RLS por usuário do bucket continua ativa. Constraint adicional impede vincular foto de outro usuário.
- A foto é pública para quem possuir o link, como ocorre com fotos sociais no bucket público.

## Validação
A execução automatizada testa login com sessão simulada, story centralizado, editor de foto, conversão JPEG, envio via storage mockado, atualização de coluna e exibição do avatar. O banco real é validado por SQL transacional e políticas RLS.

**Limite:** simulação automatizada não substitui envio manual de foto por uma pessoa autenticada, que permanece recomendado antes da divulgação ampla. Nenhuma pessoa falsa foi criada.
