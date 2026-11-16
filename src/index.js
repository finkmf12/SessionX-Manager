import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const token = process.env.MICUP_TOKEN;
const prefix = process.env.PREFIX || '!sx';
if (!token) { console.error('MICUP_TOKEN não foi definido. Configure a variável de ambiente.'); process.exit(1); }

// Micup uses the Fluxer-compatible API. Discover its API host at runtime.
const discoveryResponse = await fetch('https://micup.gg/.well-known/fluxer');
if (!discoveryResponse.ok) throw new Error(`Falha na descoberta Micup: HTTP ${discoveryResponse.status}`);
const discovery = await discoveryResponse.json();
const api = discovery?.endpoints?.api_public?.replace(/\/$/, '');
if (!api) throw new Error('A descoberta do Micup não informou endpoints.api_public.');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  rest: { api, version: '1' },
  ws: { version: 1 }
});

client.once('ready', () => {
  console.log(`Session X Manager conectado como ${client.user.username}`);
  console.log(`Prefixo de comandos: ${prefix}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = (args.shift() || '').toLowerCase();
  if (command === 'ping') { await message.reply('Pong! Session X Manager está online.'); return; }
  if (command === 'ajuda' || command === 'help') {
    await message.reply(['**Session X Manager — comandos iniciais**', `\`${prefix} ping\` — verifica se o bot está online`, `\`${prefix} ajuda\` — mostra esta ajuda`, '', 'Funções administrativas serão adicionadas gradualmente e protegidas por permissões.'].join('\n'));
  }
});

client.on('error', (error) => console.error('Erro do cliente Micup:', error.message));
process.on('unhandledRejection', (error) => console.error('Falha assíncrona:', error));
await client.login(token);
