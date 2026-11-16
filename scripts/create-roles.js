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

// Permissões documentadas pela API Fluxer/Micup. Os valores são máscaras decimais.
const desired = [
  { name: 'FOUNDER', color: 0xFF3B6B, permissions: '8' }, // Administrador total
  { name: 'ADMIN', color: 0xFF8A00, permissions: '1101524902070' }, // Gestão do servidor, canais, cargos, mensagens e membros
  { name: 'MODERADOR', color: 0x00D9FF, permissions: '1099675213830' }, // Expulsar, banir, moderar mensagens, timeout e voz
  { name: 'VIP', color: 0xB45CFF, permissions: '104188993' }, // Membro + criar convites
  { name: 'MEMBRO', color: 0x2ECC71, permissions: '104188992' }, // Conversar, ver canais, anexos, reações e voz
  { name: 'BOT', color: 0x95A5A6, permissions: '104197184' } // Base de membro + gerenciar mensagens
];

const roles = await request(`/guilds/${GUILD_ID}/roles`);
if (!Array.isArray(roles)) throw new Error('A API não retornou a lista de cargos esperada.');

const findRole = name => roles.find(existing => existing.name.toLowerCase() === name.toLowerCase());
const missing = desired.filter(role => !findRole(role.name));

console.log('=== SESSION X | PERMISSÕES DOS CARGOS ===');
console.log(`Servidor: ${GUILD_ID}`);
console.log(`Modo: ${MODE === 'preview' ? 'SIMULAÇÃO — sem alterações' : 'APLICAÇÃO'}`);
console.log('FOUNDER: Administrador total.');
console.log('ADMIN: gerenciar servidor, canais, cargos, mensagens e membros; sem Administrador total.');
console.log('MODERADOR: expulsar/banir, moderar mensagens, timeout e moderação de voz.');
console.log('VIP: permissões de membro e criar convites.');
console.log('MEMBRO: visualizar canais, conversar, anexos, reações e voz.');
console.log('BOT: permissões básicas e gerenciar mensagens.');
console.log('Os canais e as configurações de canais não serão alterados.');

if (MODE === 'preview') {
  for (const role of desired) {
    const current = findRole(role.name);
    console.log(current
      ? `CONFIGURARIA ${role.name}: permissões ${current.permissions ?? 'desconhecidas'} → ${role.permissions}`
      : `CRIARIA ${role.name} com permissões ${role.permissions}`);
  }
  process.exit(0);
}

// Cria apenas algum cargo da lista que ainda esteja ausente.
for (const role of missing) {
  await sleep(6500);
  const created = await request(`/guilds/${GUILD_ID}/roles`, {
    method: 'POST',
    body: JSON.stringify({
      name: role.name,
      color: role.color,
      permissions: role.permissions,
      hoist: true,
      mentionable: false
    })
  });
  roles.push(created);
  console.log(`CRIADO: ${created.name} (ID: ${created.id})`);
}

// Atualiza somente a máscara de permissões dos seis cargos; nome, cor, posição,
// menções, canais e demais cargos permanecem intactos.
for (const role of desired) {
  const current = roles.find(existing => existing.name.toLowerCase() === role.name.toLowerCase());
  if (!current?.id) throw new Error(`Não foi possível localizar o ID do cargo ${role.name}.`);

  // O bot está atribuído ao FOUNDER, que é seu cargo mais alto.
  // A hierarquia do Micup não permite que um membro edite o próprio cargo mais alto.
  // Como ADMINISTRATOR (8) já concede todas as permissões, validamos o FOUNDER
  // e seguimos sem tentar alterá-lo pela API.
  if (role.name === 'FOUNDER') {
    if (String(current.permissions) !== '8') {
      throw new Error('O cargo FOUNDER precisa estar com Administrador ativado (permissions 8). Ajuste-o manualmente no Micup; o bot não pode editar seu próprio cargo mais alto.');
    }
    console.log('VERIFICADO: FOUNDER — Administrador total (sem PATCH no próprio cargo).');
    continue;
  }

  await sleep(700);
  const updated = await request(`/guilds/${GUILD_ID}/roles/${current.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ permissions: role.permissions })
  });
  if (String(updated?.permissions) !== role.permissions) {
    throw new Error(`A API não confirmou as permissões esperadas para ${role.name}.`);
  }
  console.log(`PERMISSÕES APLICADAS: ${role.name} — ${updated.permissions}`);
}

console.log('Concluído: permissões dos seis cargos aplicadas e verificadas.');
console.log('IMPORTANTE: confira a hierarquia dos cargos no Micup. Para moderar ou gerenciar cargos, MODERADOR/ADMIN/BOT precisam estar acima dos cargos que devem administrar.');
