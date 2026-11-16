# Session X Manager

Bot de administração para o servidor Session X no Micup.

## Requisitos
- Node.js 20 ou superior
- Aplicação/bot criado no Micup e convidado ao servidor

## Configuração
1. Clone o repositório.
2. Execute `npm install`.
3. Copie `.env.example` para `.env`.
4. Configure `MICUP_TOKEN` somente no `.env` local.
5. Execute `npm start`.

Nunca envie o token pelo chat, inclua-o no código ou faça commit do `.env`. Se o token tiver sido exposto, redefina-o no Micup.

## Comandos iniciais
- `!sx ping` — verifica se o bot está online.
- `!sx ajuda` — mostra os comandos disponíveis.

O bot descobre o endpoint Micup em `/.well-known/fluxer` e usa a API `/v1`. Ainda precisa ser executado em uma hospedagem para permanecer online. Funções administrativas serão adicionadas após validar a conexão básica e as permissões.
