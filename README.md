# Session X Manager

Bot de administração para o servidor Session X no Micup.

## Reforma da comunidade (execução única)

O repositório inclui uma automação segura para organizar a Session X com visual neon. Ela cria categorias e canais ausentes, organiza os canais atuais `chat` e `Geral`, e **não apaga canais nem altera permissões existentes**.

### Estrutura de canais
- **INFORMAÇÕES:** boas-vindas, regras, anúncios
- **COMUNIDADE:** chat (existente), mídia, memes, sugestões
- **GAMING:** procurando-grupo, clips-e-gameplay
- **SALAS DE VOZ:** Geral (existente), Duo / Trio, Squad
- **EQUIPE:** staff-chat, moderação

## Cargos neon

O workflow **Session X - Criar cargos neon** cria, caso ainda não existam:
- **FOUNDER** — rosa/vermelho
- **ADMIN** — laranja
- **MODERADOR** — ciano
- **VIP** — roxo
- **MEMBRO** — verde
- **BOT** — cinza

Os cargos novos são criados com permissões próprias zeradas, exibidos separadamente na lista e sem menção pública. Isso evita conceder poderes administrativos por engano. A automação não edita nem exclui cargos existentes, não altera o cargo @everyone e não atribui cargos a membros automaticamente. A hierarquia final deve ser conferida no Micup; permissões específicas e atribuições são uma etapa separada.

### Executar a criação dos cargos
1. Abra **Actions → Session X - Criar cargos neon → Run workflow**.
2. Mantenha o ID do servidor Session X.
3. Rode primeiro com `preview` para conferir os cargos que faltam.
4. Depois de conferir, rode com `apply` e escreva exatamente `APLICAR_CARGOS`.
5. Confira os cargos no Micup antes de atribuí-los à equipe.

O secret `MICUP_TOKEN` deve estar configurado em **Settings → Secrets and variables → Actions**. Nunca envie o token pelo chat nem o coloque em arquivos do repositório.

## Bot online (opcional)

O bot também tem comandos básicos `!sx ping` e `!sx ajuda`. Para ficar online continuamente, precisa de hospedagem e gateway ativo; isso é separado das automações pontuais.

## Configuração local
- Node.js 20 ou superior
- Aplicação/bot criado no Micup e convidado ao servidor

1. Clone o repositório.
2. Execute `npm install`.
3. Copie `.env.example` para `.env`.
4. Configure `MICUP_TOKEN` somente no `.env` local.
5. Execute `npm start`.

Nunca envie o token pelo chat, inclua-o no código ou faça commit do `.env`. Se o token tiver sido exposto, redefina-o no Micup.
