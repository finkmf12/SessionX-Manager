const TOKEN = process.env.MICUP_TOKEN;
const GUILD_ID = process.env.MICUP_GUILD_ID;
const MODE = process.env.MODE || 'preview';
const CONFIRM = process.env.CONFIRM || '';

if (!TOKEN || !GUILD_ID) throw new Error('Configure MICUP_TOKEN e MICUP_GUILD_ID.');
if (!/^\\d{5,30}$/.test(GUILD_ID)) throw new Error('MICUP_GUILD_ID inválido.');
if (!['preview', 'apply'].includes(MODE)) throw new Error('MODE deve ser preview ou apply.');
if (MODE === 'apply' && CONFIRM !== 'CONFIGURAR_PERMISSOES') {
  throw new Error('Aplicação bloqueada: confirmação deve ser CONFIGURAR_PERMISSOES.');
}

const discoveryResponse = await fetch('https://micup.gg/.well-known/fluxer');
if (!discoveryResponse.ok) throw new Error(`Falha na descoberta Micup: HTTP ${discoveryResponse.status}`);
const discovery = await discoveryResponse.json();
const api = discovery?.endpoints?.api_public?.replace(/\\/$/, '');
if (!api) throw new Error('Endpoint público da API Micup não encontrado.');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(path, options = {}) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const response = await fetch(`${api}/v1${path}`, {
      ...options,
      headers: {
        Authorization: `Bot ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
    if (response.status === 429 && attempt < 6) {
      const retryAfter = Number(data?.retry_after || response.headers.get('retry-after') || 7);
      const waitMs = Math.ceil((retryAfter + 1) * 1000);
      console.log(`Limite da API. Aguardando ${(waitMs / 1000).toFixed(1)}s...`);
      await sleep(waitMs);
      continue;
    }
    if (!response.ok) {
      throw new Error(`Micup API ${response.status} em ${path}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
    }
    return data;
  }
  throw new Error(`Limite da API persistente em ${path}.`);
}

// Bitfield compatível com as permissões Fluxer/Discord.
// O cargo FOUNDER é visual: o proprietário já possui controle total nativo.
const permissions = {
  FOUNDER: 0n,
  ADMIN: 16n | 128n | 8192n, // gerenciar canais, ver auditoria, gerenciar mensagens
  MODERADOR: 128n | 8192n | 1099511627776n, // auditoria, mensagens, timeout
  VIP: 0n,
  MEMBRO: 0n,
  BOT: 0n
};

const descriptions = {
  FOUNDER: 'Cargo visual do proprietário; a propriedade do servidor mantém o controle total.',
  ADMIN: 'Pode gerenciar canais e mensagens e consultar o registro de auditoria. Sem administrador total, banimento ou gerenciamento de cargos.',
  MODERADOR: 'Pode gerenciar mensagens, consultar auditoria e aplicar timeout. Sem banimento, gerenciamento de canais ou cargos.',
  VIP: 'Sem permissões adicionais; benefícios podem ser configurados separadamente.',
  MEMBRO: 'Usa as permissões gerais do servidor (@everyone), sem privilégios adicionais.',
  BOT: 'Sem privilégios adicionais neste perfil. Permissões técnicas do bot devem ser concedidas separadamente e no mínimo necessário.'
};

const roles = await request(`/guilds/${GUILD_ID}/roles`);
if (!Array.isArray(roles)) throw new Error('A API não retornou a lista de cargos esperada.');

const targets = Object.entries(permissions).map(([name, bits]) => {
  const role = roles.find(item => item.name?.toLowerCase() === name.toLowerCase());
  if (!role) throw new Error(`Cargo obrigatório não encontrado: ${name}. Nenhuma alteração foi aplicada.`);
  return { role, name, bits: bits.toString() };
});

console.log('=== SESSION X | REVISÃO DE PERMISSÕES ===');
console.log(`Servidor: ${GUILD_ID}`);
console.log(`Modo: ${MODE === 'preview' ? 'SIMULAÇÃO — sem alterações' : 'APLICAÇÃO'}`);
for (const item of targets) {
  console.log(`- ${item.name} (ID ${item.role.id}) | permissions=${item.bits}`);
  console.log(`  ${descriptions[item.name]}`);
}
console.log('Apenas os seis cargos acima serão atualizados.');
console.log('Nenhum cargo será atribuído a usuários; @everyone e demais cargos não serão alterados.');
if (MODE === 'preview') process.exit(0);

for (const item of targets) {
  await sleep(1500);
  await request(`/guilds/${GUILD_ID}/roles/${item.role.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ permissions: item.bits })
  });
  console.log(`PERMISSÕES CONFIGURADAS: ${item.name}`);
}
console.log('Configuração concluída. Revise a hierarquia dos cargos no Micup antes de delegar funções.');
