const TOKEN = process.env.MICUP_TOKEN;
const GUILD_ID = process.env.MICUP_GUILD_ID;
const MODE = process.env.MODE || 'preview';
const CONFIRM = process.env.CONFIRM || '';

if (!TOKEN || !GUILD_ID) {
  console.error('Configure MICUP_TOKEN (GitHub Secret) e informe MICUP_GUILD_ID.');
  process.exit(1);
}
if (!/^\d{5,30}$/.test(GUILD_ID)) {
  console.error('MICUP_GUILD_ID inválido. Informe o ID numérico do servidor Session X.');
  process.exit(1);
}
if (!['preview', 'apply'].includes(MODE)) throw new Error('MODE deve ser preview ou apply.');
if (MODE === 'apply' && CONFIRM !== 'APLICAR') {
  console.error('Aplicação bloqueada: para executar, informe CONFIRM=APLICAR.');
  process.exit(1);
}

const discoveryResponse = await fetch('https://micup.gg/.well-known/fluxer');
if (!discoveryResponse.ok) throw new Error(`Falha na descoberta Micup: HTTP ${discoveryResponse.status}`);
const discovery = await discoveryResponse.json();
const api = discovery?.endpoints?.api_public?.replace(/\/$/, '');
if (!api) throw new Error('O Micup não informou endpoints.api_public.');

async function request(path, options = {}) {
  const response = await fetch(`${api}/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.text();
  let data;
  try { data = body ? JSON.parse(body) : null; } catch { data = body; }
  if (!response.ok) {
    throw new Error(`Micup API ${response.status} em ${path}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

const desired = [
  { name: 'INFORMAÇÕES', type: 4, children: [
    { name: 'boas-vindas', type: 0 },
    { name: 'regras', type: 0 },
    { name: 'anúncios', type: 5 }
  ]},
  { name: 'COMUNIDADE', type: 4, children: [
    { name: 'chat', type: 0, existing: true },
    { name: 'mídia', type: 0 },
    { name: 'memes', type: 0 },
    { name: 'sugestões', type: 0 }
  ]},
  { name: 'GAMING', type: 4, children: [
    { name: 'procurando-grupo', type: 0 },
    { name: 'clips-e-gameplay', type: 0 }
  ]},
  { name: 'SALAS DE VOZ', type: 4, children: [
    { name: 'Geral', type: 2, existing: true },
    { name: 'Duo / Trio', type: 2 },
    { name: 'Squad', type: 2 }
  ]},
  { name: 'EQUIPE', type: 4, children: [
    { name: 'staff-chat', type: 0 },
    { name: 'moderação', type: 0 }
  ]}
];

let channels = await request(`/guilds/${GUILD_ID}/channels`);
if (!Array.isArray(channels)) throw new Error('A API não retornou a lista de canais no formato esperado.');
const originalChannels = channels;
const plan = [];
for (const category of desired) {
  let parent = channels.find(c => c.type === 4 && c.name.toLowerCase() === category.name.toLowerCase());
  if (!parent) plan.push(`CRIAR categoria: ${category.name}`);
  for (const child of category.children) {
    const found = channels.find(c => c.type === child.type && c.name.toLowerCase() === child.name.toLowerCase());
    if (!found) plan.push(`CRIAR canal: ${category.name} / ${child.name}`);
    else if (found.parent_id !== (parent?.id || null)) plan.push(`MOVER canal existente: ${found.name} → ${category.name}`);
  }
}
console.log('=== SESSION X | REFORMA NEON ===');
console.log(`Servidor: ${GUILD_ID}`);
console.log(`Canais atuais encontrados: ${originalChannels.length}`);
console.log(`Modo: ${MODE === 'preview' ? 'SIMULAÇÃO — nenhuma alteração será feita' : 'APLICAÇÃO AUTORIZADA'}`);
console.log(plan.length ? plan.map((p, i) => `${i + 1}. ${p}`).join('\n') : 'Estrutura já está atualizada.');
console.log('Nenhum canal ou configuração existente será excluído.');

if (MODE === 'preview') process.exit(0);

for (const category of desired) {
  let parent = channels.find(c => c.type === 4 && c.name.toLowerCase() === category.name.toLowerCase());
  if (!parent) {
    parent = await request(`/guilds/${GUILD_ID}/channels`, {
      method: 'POST',
      body: JSON.stringify({ name: category.name, type: 4 })
    });
    channels.push(parent);
    console.log(`Criada categoria: ${category.name}`);
  }
  for (const child of category.children) {
    let found = channels.find(c => c.type === child.type && c.name.toLowerCase() === child.name.toLowerCase());
    if (!found) {
      found = await request(`/guilds/${GUILD_ID}/channels`, {
        method: 'POST',
        body: JSON.stringify({ name: child.name, type: child.type, parent_id: parent.id })
      });
      channels.push(found);
      console.log(`Criado canal: ${child.name}`);
    } else if (found.parent_id !== parent.id) {
      const moved = await request(`/channels/${found.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ parent_id: parent.id })
      });
      Object.assign(found, moved);
      console.log(`Organizado canal existente: ${child.name}`);
    }
  }
}
console.log('Reforma concluída. Nenhum canal foi apagado e nenhuma permissão foi alterada.');
