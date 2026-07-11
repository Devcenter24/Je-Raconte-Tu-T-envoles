  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Sécurité : échappement de tout texte affiché via innerHTML (anti-XSS)
  function escapeHTML(str){
    if(str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function safeUrl(url){
    if(!url) return '';
    const trimmed = String(url).trim();
    if(/^javascript:/i.test(trimmed)) return '';
    return escapeHTML(trimmed);
  }
  function staffCode(){
    return sessionStorage.getItem('staff_code') || '';
  }

  async function getContes(){
    const { data, error } = await sb
      .from('contes')
      .select('*')
      .order('created_at', { ascending: false });
    if(error){ console.error(error); return []; }
    return data;
  }

  async function renderList(){
    const list = await getContes();
    const container = document.getElementById('staff-list');
    container.innerHTML = '';
    if(list.length === 0){
      container.innerHTML = '<p class="empty-note">Aucun conte enregistré pour l\'instant.</p>';
      return;
    }
    list.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'staff-row';
      row.innerHTML = `
        <div><span class="lbl">Titre</span>${escapeHTML(c.titre)}</div>
        <div><span class="lbl">Texte</span>${escapeHTML(c.texte)}</div>
        <div><span class="lbl">Audio</span>${
          c.fichier_audio ? `<audio controls src="${safeUrl(c.fichier_audio)}" class="audio-mini"></audio>`
          : c.lien_audio ? `<a class="lien" href="${safeUrl(c.lien_audio)}" target="_blank" rel="noopener">${escapeHTML(c.lien_audio)}</a>`
          : '—'
        }</div>
        <button class="del-btn" data-id="${c.id}">Supprimer</button>
      `;
      container.appendChild(row);
    });
    container.querySelectorAll('.del-btn').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const { error } = await sb.rpc('supprimer_conte', { p_id: btn.dataset.id, p_code: staffCode() });
        if(error) console.error(error);
        renderList();
      });
    });
  }

  document.getElementById('conte-form').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const titre = document.getElementById('titre').value.trim();
    const texte = document.getElementById('texte_libre').value.trim();
    const lien_audio = document.getElementById('audio').value.trim();
    const audioFile = document.getElementById('audio-fichier').files[0];
    if(!titre || !texte) return;
    if(audioFile && fichierTropLourd(audioFile, MAX_AUDIO_MB)) return;

    let fichier_audio = null;
    if(audioFile) fichier_audio = await fileToBase64(audioFile);

    const { error } = await sb.rpc('inserer_conte', {
      p_titre: titre, p_texte: texte, p_lien_audio: lien_audio || null,
      p_fichier_audio: fichier_audio, p_code: staffCode()
    });
    if(error){ console.error(error); return; }

    document.getElementById('conte-form').reset();
    const msg = document.getElementById('form-msg');
    msg.classList.add('show');
    setTimeout(()=>msg.classList.remove('show'), 1800);

    renderList();
  });

  renderList();

  // Gestion du contenu éditable du site (table site_content)
  const CONTENT_FIELDS = [
    'hero_lead','compagnie_p1','pascale_bio','michel_bio',
    'spec1_titre','spec1_desc','spec2_titre','spec2_desc','spec3_titre','spec3_desc',
    'contact_lead'
  ];

  // Textes actuellement présents sur le site (valeurs par défaut, utilisées si rien n'a encore été enregistré)
  const DEFAULT_CONTENT = {
    hero_lead: "Conte, musique et improvisation — une compagnie qui fait voyager petits et grands, une histoire à la fois.",
    compagnie_p1: "Pascale a grandi en lisant et en dévorant des histoires. Sa rencontre avec la conteuse Catherine Zarcate a été déterminante dans son envie de raconter à son tour. Elle est ensuite passée par un conservatoire d'art dramatique, puis par la scène, avant une première soirée de contes d'Orient devant un public.",
    pascale_bio: "Passionnée d'imaginaire depuis toujours, Pascale a suivi son instinct plutôt qu'un chemin tout tracé : théâtre, maternité, animation, puis conte, écriture et dessin. Elle résume aujourd'hui son parcours d'une formule simple : « J'ai réalisé mon rêve ».",
    michel_bio: "Michel s'est intéressé très jeune à la musique. Il a commencé par la basse électrique, en jouant dans des orchestres de bal, de rock, de blues, de jazz swing et de musique cajun. Il est ensuite passé à la contrebasse, ce qui l'a conduit vers le jazz manouche, le New Orleans et la salsa. Il accompagne aujourd'hui les spectacles de contes.",
    spec1_titre: "Les Mésaventures de Bergamote",
    spec1_desc: "En Périgord, à la saison des citrouilles, l'apprentie sorcière Bergamote doit réussir sa dernière épreuve : cuisiner le plat préféré de la reine, le millas. Musique, marionnettes et kamishibaï accompagnent ce conte plein de malice.",
    spec2_titre: "Contes du Désir & Jean le Gabarier",
    spec2_desc: "Nés d'une carte blanche autour du Périgord, ces récits suivent notamment Jean, jeune marinier de la Dordogne qui apprend, au fil de l'eau, à aimer la nature plutôt qu'à la combattre.",
    spec3_titre: "Spectacle sur-mesure",
    spec3_desc: "Conçus avec vous pour un lieu ou un projet précis — comme « Le Train de Noël », imaginé avec le syndicat d'initiative de Niversac (24). Ces spectacles peuvent s'accompagner d'ateliers d'expression ou artistiques.",
    contact_lead: "Pour un spectacle, un atelier ou une envie encore floue — écrivez-nous, le rideau n'attend que vous."
  };

  async function loadSiteContent(){
    // 1. Pré-remplir avec les valeurs par défaut du site
    CONTENT_FIELDS.forEach(key => {
      const el = document.getElementById('f_' + key);
      if(el) el.value = DEFAULT_CONTENT[key] || '';
    });
    // 2. Écraser avec ce qui a déjà été enregistré dans Supabase, s'il y en a
    try{
      const { data, error } = await sb.from('site_content').select('content').eq('id', 1).single();
      if(error || !data) return;
      const content = data.content || {};
      CONTENT_FIELDS.forEach(key => {
        const el = document.getElementById('f_' + key);
        if(el && content[key]) el.value = content[key];
      });
    }catch(e){ console.warn(e); }
  }

  document.getElementById('site-form').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const content = {};
    CONTENT_FIELDS.forEach(key => {
      const el = document.getElementById('f_' + key);
      if(el && el.value.trim()) content[key] = el.value.trim();
    });
    const { error } = await sb.rpc('maj_site_content', { p_content: content, p_code: staffCode() });
    if(error){ console.error(error); return; }
    const msg = document.getElementById('site-form-msg');
    msg.classList.add('show');
    setTimeout(()=>msg.classList.remove('show'), 1800);
  });

  loadSiteContent();

  // ---------- Gestion des contenus dynamiques (blocs) ----------

  const CATEGORIE_LABELS = {
    spectacles_enfants: 'Spectacles enfants',
    spectacles_adultes: 'Spectacle Adultes',
    pascale_plus: 'Le + de Pascale'
  };
  const TYPE_LABELS = {
    image: 'Image', texte: 'Texte', audio: 'Audio', lien: 'Lien', separateur: 'Séparateur'
  };

  function fileToBase64(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const MAX_IMAGE_MB = 10;
  const MAX_AUDIO_MB = 15;
  function fichierTropLourd(file, maxMB){
    const tropLourd = file.size > maxMB * 1024 * 1024;
    if(tropLourd){
      alert(`Ce fichier fait ${(file.size / (1024*1024)).toFixed(1)} Mo, la limite est de ${maxMB} Mo. Choisis un fichier plus léger.`);
    }
    return tropLourd;
  }

  function updateChampsConditionnels(){
    const type = document.getElementById('bloc-type').value;
    document.querySelectorAll('.champ-conditionnel').forEach(el=>{
      el.classList.toggle('actif', el.dataset.pour === type);
    });
    const champTitre = document.getElementById('champ-titre');
    const optionnel = document.getElementById('titre-optionnel');
    if(type === 'lien'){
      champTitre.style.display = 'flex';
      optionnel.textContent = '(titre du lien)';
    } else if(type === 'separateur'){
      champTitre.style.display = 'none';
    } else {
      champTitre.style.display = 'flex';
      optionnel.textContent = '(optionnel)';
    }
  }
  document.getElementById('bloc-type').addEventListener('change', updateChampsConditionnels);
  updateChampsConditionnels();

  document.getElementById('bloc-form').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const categorie = document.getElementById('bloc-categorie').value;
    const type = document.getElementById('bloc-type').value;
    const titre = document.getElementById('bloc-titre').value.trim();

    const payload = { categorie, type, titre: titre || null, texte: null, url: null, fichier: null };

    if(type === 'texte'){
      payload.texte = document.getElementById('bloc-texte').value.trim();
    } else if(type === 'image'){
      const f = document.getElementById('bloc-image').files[0];
      if(f){
        if(fichierTropLourd(f, MAX_IMAGE_MB)) return;
        payload.fichier = await fileToBase64(f);
      }
    } else if(type === 'audio'){
      const f = document.getElementById('bloc-audio-fichier').files[0];
      const url = document.getElementById('bloc-audio-url').value.trim();
      if(f){
        if(fichierTropLourd(f, MAX_AUDIO_MB)) return;
        payload.fichier = await fileToBase64(f);
      }
      else if(url) payload.url = url;
    } else if(type === 'lien'){
      payload.url = document.getElementById('bloc-lien-url').value.trim();
    }
    // 'separateur' n'a besoin d'aucun champ supplémentaire

    const { error } = await sb.rpc('inserer_bloc', {
      p_categorie: payload.categorie, p_type: payload.type, p_titre: payload.titre,
      p_texte: payload.texte, p_url: payload.url, p_fichier: payload.fichier, p_code: staffCode()
    });
    if(error){ console.error(error); return; }

    document.getElementById('bloc-form').reset();
    updateChampsConditionnels();
    const msg = document.getElementById('bloc-form-msg');
    msg.classList.add('show');
    setTimeout(()=>msg.classList.remove('show'), 1800);

    renderBlocsList();
  });

  let filtreActuel = 'tous';
  document.querySelectorAll('#bloc-filtre button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#bloc-filtre button').forEach(b=>b.classList.remove('actif'));
      btn.classList.add('actif');
      filtreActuel = btn.dataset.cat;
      renderBlocsList();
    });
  });

  async function renderBlocsList(){
    const container = document.getElementById('blocs-list');
    let query = sb.from('blocs').select('*').order('created_at', { ascending: true });
    if(filtreActuel !== 'tous') query = query.eq('categorie', filtreActuel);
    const { data, error } = await query;
    if(error){ console.error(error); return; }

    if(!data || data.length === 0){
      container.innerHTML = '<p class="empty-note">Aucun contenu pour cette catégorie.</p>';
      return;
    }

    container.innerHTML = data.map(b => {
      let apercu = '';
      if(b.type === 'image' && b.fichier) apercu = `<img src="${safeUrl(b.fichier)}" alt="">`;
      else if(b.type === 'texte') apercu = escapeHTML((b.texte || '').slice(0, 90));
      else if(b.type === 'audio') apercu = escapeHTML(b.url || (b.fichier ? 'Fichier audio importé' : '—'));
      else if(b.type === 'lien') apercu = escapeHTML(b.url || '—');
      else if(b.type === 'separateur') apercu = '⸻';

      return `
        <div class="bloc-row">
          <span class="type-pill">${TYPE_LABELS[b.type] || b.type}</span>
          <div>
            <div class="bloc-row-categorie">${escapeHTML(CATEGORIE_LABELS[b.categorie] || b.categorie)}${b.titre ? ' · ' + escapeHTML(b.titre) : ''}</div>
            <div class="apercu">${apercu}</div>
          </div>
          <button class="del-btn" data-id="${b.id}">Supprimer</button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.del-btn').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const { error } = await sb.rpc('supprimer_bloc', { p_id: btn.dataset.id, p_code: staffCode() });
        if(error) console.error(error);
        renderBlocsList();
      });
    });
  }

  renderBlocsList();

  // Verrou d'accès à la page Staff — vérification via une fonction Supabase (le code n'est jamais exposé côté client)
  const lockEl = document.getElementById('staff-lock');

  if(sessionStorage.getItem('staff_ok') === '1' && sessionStorage.getItem('staff_code')){
    lockEl.style.display = 'none';
    document.body.classList.add('staff-unlocked');
  }

  document.getElementById('staff-lock-form').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const val = document.getElementById('staff-lock-code').value.trim();
    const btn = e.target.querySelector('button');
    btn.disabled = true;

    const { data, error } = await sb.rpc('verifier_code_staff', { code_saisi: val });

    btn.disabled = false;
    if(!error && data === true){
      sessionStorage.setItem('staff_ok', '1');
      sessionStorage.setItem('staff_code', val);
      lockEl.style.display = 'none';
      document.body.classList.add('staff-unlocked');
    } else {
      document.getElementById('staff-lock-error').classList.add('show-error');
    }
  });
