// EVEREST MOTORBIKE — service worker (gerado pelo build: node build.mjs dist -> dist/pwa/sw.js).
// Guarda o jogo (um HTML único) e os ícones para abrir sem internet depois da 1ª visita.
// VOZES GRAVADAS (vozes/*.m4a, baixadas pelo jogo sob demanda): o manifest e os gritos entram já na instalação; as falas de cada
// idioma ficam guardadas na 1ª vez que o jogo as pede (cache primeiro: arquivo de voz não muda dentro de uma versão).
// Estratégia: stale-while-revalidate — responde na hora com a cópia guardada e confere a rede em segundo plano
// (pedido condicional: se nada mudou o servidor responde 304 e nada é baixado de novo). Versão nova = cache novo.
// BUILD = número visível no menu (v3/VERSION); VERSION = hash do HTML. Os dois entram no texto deste arquivo: qualquer mudança
// de build ou de conteúdo muda os bytes do sw.js, e o navegador instala o service worker novo (cache novo, o antigo é apagado).
const BUILD = '6.2', VERSION = 'd8cab6b3cdb5', CACHE = 'emb-' + VERSION;
console.log('[sw] EVEREST MOTORBIKE BUILD ' + BUILD + ' (cache ' + CACHE + ')');
const SHELL = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png', "vozes/manifest.json", "vozes/gritos/g_uhul_a.m4a", "vozes/gritos/g_uhuuul_a.m4a", "vozes/gritos/g_uhuuul_b.m4a", "vozes/gritos/g_irru_a.m4a", "vozes/gritos/g_irru_b.m4a", "vozes/gritos/g_argh_a.m4a", "vozes/gritos/g_argh_b.m4a", "vozes/gritos/g_berro_a.m4a", "vozes/gritos/g_ei_a.m4a", "vozes/gritos/g_ei_b.m4a", "vozes/gritos/g_berro_d.m4a", "vozes/gritos/g_empina_a.m4a", "vozes/gritos/g_empina_b.m4a", "pegadinha/gato.mp4"];
self.addEventListener('install', (e) => {
  // um arquivo que falhe (ex.: ícone ausente) não impede o jogo de ficar offline
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('emb-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(new URL('./', location).pathname)) return;
  const nav = req.mode === 'navigate', key = nav ? './' : req; // qualquer navegação dentro do escopo (?pwa=1, index.html) = o HTML do jogo
  if (nav && !/\/(index\.html)?$/.test(url.pathname)) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(key, { ignoreSearch: true });
    if (hit && /\/vozes\//.test(url.pathname)) return hit; // voz guardada: nem confere a rede
    const net = fetch(nav ? new Request('./', { cache: 'no-cache' }) : req).then((r) => { if (r && r.ok && r.type === 'basic') c.put(key, r.clone()); return r; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  }));
});
