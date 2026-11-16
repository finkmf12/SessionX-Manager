# Session X Manager

Bot de administração para o servidor Session X no Micup.

## Reforma da comunidade (execução única)

O repositório inclui uma automação segura para organizar a Session X com visual neon. Ela cria categorias e canais ausentes, organiza os canais atuais `chat` e `Geral`, e **não apaga canais nem altera permissões existentes**.

### Preparação (uma única vez)
1. No GitHub, abra **Settings → Secrets and variables → Actions → New repository secret**.
2. Crie o secret com o nome `MICUP_TOKEN` e cole o token do bot no campo de valor. Não envie o token em mensagens nem coloque-o em arquivos do repositório.
3. Abra **Actions → Session X - Reforma da comunidade → Run workflow**.
4. Informe o ID numérico do servidor Session X.
5. Na primeira execução, selecione `preview`. Isso apenas lista o que seria criado ou organizado, sem modificar o servidor.

### Aplicar a reforma
Depois de conferir a simulação, execute novamente o workflow selecionando `apply` e escrevendo exatamente `APLICAR` no campo de confirmação. A automação é idempotente: executar novamente não duplica os canais que já existem.

### Estrutura proposta
- **INFORMAÇÕES:** boas-vindas, regras, anúncios
- **COMUNIDADE:** chat (existente), mídia, memes, sugestões
- **GAMING:** procurando-grupo, clips-e-gameplay
- **SALAS DE VOZ:** Geral (existente), Duo / Trio, Squad
- **EQUIPE:** staff-chat, moderação

A automação preserva outros canais que já existam. Não cria cargos, não muda permissões e não exclui nada.

## Bot online (opcional)
O bot também tem comandos básicos `!sx ping` e `!sx ajuda`. Para ficar online continuamente, precisa de hospedagem e gateway ativo; isso é separado da automação de reforma pontual.

## Configuração local
- Node.js 20 ou superior
- Aplicação/bot criado no Micup e convidado ao servidor

1. Clone o repositório.
2. Execute `npm install`.
3. Copie `.env.example` para `.env`.
4. Configure `MICUP_TOKEN` somente no `.env` local.
5. Execute `npm start`.

Nunca envie o token pelo chat, inclua-o no código ou faça commit do `.env`. Se o token tiver sido exposto, redefina-o no Micup.
