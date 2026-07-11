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

  async function getContes(){
    const { data, error } = await sb
      .from('contes')
      .select('*')
      .order('created_at', { ascending: false });
    if(error){ console.error(error); return []; }
    return data;
  }

  async function render(){
    const list = await getContes();
    const grid = document.getElementById('contes-grid');
    if(list.length === 0){
      grid.innerHTML = '<p class="empty-note">Aucun conte à afficher pour le moment.</p>';
      return;
    }
    grid.innerHTML = list.map(c => `
      <div class="conte-card">
        <h3>${escapeHTML(c.titre)}</h3>
        <span class="conte-nom">${escapeHTML(c.texte)}</span>
        ${c.fichier_audio
          ? `<audio controls src="${safeUrl(c.fichier_audio)}"></audio>`
          : c.lien_audio ? `<audio controls src="${safeUrl(c.lien_audio)}"></audio><a class="audio-link" href="${safeUrl(c.lien_audio)}" target="_blank" rel="noopener">Écouter / ouvrir le lien</a>` : ''}
      </div>
    `).join('');
  }

  render();
