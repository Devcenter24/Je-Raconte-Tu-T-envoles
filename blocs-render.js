const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function escapeHTML(str){
  if(str === null || str === undefined) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function safeUrl(url){
  if(!url) return '';
  const trimmed = String(url).trim();
  if(/^javascript:/i.test(trimmed)) return '';
  return escapeHTML(trimmed);
}

const CATEGORIE = document.body.dataset.categorie;

async function renderBlocs(){
  const container = document.getElementById('blocs-container');
  const { data, error } = await sb
    .from('blocs')
    .select('*')
    .eq('categorie', CATEGORIE)
    .order('created_at', { ascending: true });

  if(error){ console.error(error); return; }
  if(!data || data.length === 0) return; // garde le message "Contenu à venir"

  container.innerHTML = data.map(b => {
    if(b.type === 'texte'){
      return `<p class="bloc-texte">${escapeHTML(b.texte || '')}</p>`;
    }
    if(b.type === 'image'){
      const src = safeUrl(b.fichier || b.url || '');
      return `<figure><img class="bloc-image" src="${src}" alt="${escapeHTML(b.titre || '')}">${b.titre ? `<figcaption class="bloc-image-legende">${escapeHTML(b.titre)}</figcaption>` : ''}</figure>`;
    }
    if(b.type === 'audio'){
      const src = safeUrl(b.fichier || b.url || '');
      return `<div class="bloc-audio">${b.titre ? `<div class="bloc-audio-legende">${escapeHTML(b.titre)}</div>` : ''}<audio controls src="${src}"></audio></div>`;
    }
    if(b.type === 'lien'){
      return `<a class="bloc-lien-btn" href="${safeUrl(b.url)}" target="_blank" rel="noopener">${escapeHTML(b.titre || 'En savoir plus')}</a>`;
    }
    if(b.type === 'separateur'){
      return `<div class="bloc-separateur">${b.titre ? `<span>${escapeHTML(b.titre)}</span>` : ''}</div>`;
    }
    return '';
  }).join('');
}

renderBlocs();
