const TOKEN = process.env.MICUP_TOKEN;
const GUILD_ID = process.env.MICUP_GUILD_ID;
const MODE = process.env.MODE || 'preview';
const CONFIRM = process.env.CONFIRM || '';

if (!TOKEN || !GUILD_ID) throw new Error('Configure MICUP_TOKEN e MICUP_GUILD_ID.');
if (!/^\d{5,30}$/.test(GUILD_ID)) throw new Error('MICUP_GUILD_ID inválido.');
if (!['preview', 'apply'].includes(MODE)) throw new Error('MODE deve ser preview ou apply.');
if (MODE === 'apply' && CONFIRM !== 'APLICAR_CARGOS') {
  throw new Error('Aplicação bloqueada: confirmação deve ser APLICAR_CARGOS.');
}

const discoveryResponse = await fetch('https://micup.gg/.well-known/fluxer');
if (!discoveryResponse.ok) throw new Error(`Falha na descoberta Micup: HTTP ${discoveryResponse.status}`);
const discovery = await discoveryResponse.json();
const api = discovery?.endpoints?.api_public?.replace(/\/$/, '');
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

// Cargos novos recebem permissões próprias zeradas. As permissões de @everyone
// e as configurações de cargos existentes não são alteradas.
const desired = [
  { name: 'FOUNDER', color: 0xFF3B6B },
  { name: 'ADMIN', color: 0xFF8A00 },
  { name: 'MODERADOR', color: 0x00D9FF },
  { name: 'VIP', color: 0xB45CFF },
  { name: 'MEMBRO', color: 0x2ECC71 },
  { name: 'BOT', color: 0x95A5A6 }
];

const roles = await request(`/guilds/${GUILD_ID}/roles`);
if (!Array.isArray(roles)) throw new Error('A API não retornou a lista de cargos esperada.');

const missing = desired.filter(role =>
  !roles.some(existing => existing.name.toLowerCase() === role.name.toLowerCase())
);

console.log('=== SESSION X | CARGOS NEON ===');
console.log(`Servidor: ${GUILD_ID}`);
console.log(`Cargos existentes: ${roles.length}`);
console.log(`Modo: ${MODE === 'preview' ? 'SIMULAÇÃO — sem alterações' : 'APLICAÇÃO'}`);
console.log(missing.length
  ? missing.map((role, index) => `${index + 1}. CRIAR ${role.name} — cor #${role.color.toString(16).padStart(6, '0')}`).join('\n')
  : 'Todos os cargos propostos já existem.');
console.log('Nenhum cargo existente será editado ou excluído.');
console.log('Nenhuma permissão administrativa será concedida automaticamente.');

if (MODE === 'preview') process.exit(0);

for (const role of missing) {
  await sleep(6500);
  const created = await request(`/guilds/${GUILD_ID}/roles`, {
    method: 'POST',
    body: JSON.stringify({
      name: role.name,
      color: role.color,
      permissions: '0',
      hoist: true,
      mentionable: false
    })
  });
  console.log(`CRIADO: ${created.name} (ID: ${created.id}, posição: ${created.position})`);
}

console.log('Criação dos cargos concluída. Confira a hierarquia no Micup antes de atribuir cargos à equipe.');
