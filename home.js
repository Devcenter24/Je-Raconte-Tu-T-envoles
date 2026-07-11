// Chargement du contenu modifiable depuis Supabase (écrase les valeurs par défaut si présentes)
(async function applySiteContent(){
  try{
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await sb.from('site_content').select('content').eq('id', 1).single();
    if(error || !data) return;
    const content = data.content || {};
    document.querySelectorAll('[data-key]').forEach(el => {
      const key = el.getAttribute('data-key');
      if(content[key]) el.textContent = content[key];
    });
  }catch(e){ console.warn('Contenu personnalisé non chargé', e); }
})();

// Curtain open on load
window.addEventListener('load', () => {
  setTimeout(() => document.body.classList.add('opened'), 500);
});

// Generate stars
const starsEl = document.getElementById('stars');
for(let i=0;i<40;i++){
  const s = document.createElement('div');
  s.className='star';
  const size = Math.random()*2.5+1;
  s.style.width = s.style.height = size+'px';
  s.style.left = Math.random()*100+'%';
  s.style.top = Math.random()*70+'%';
  s.style.animationDelay = (Math.random()*3)+'s';
  starsEl.appendChild(s);
}

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); } });
}, {threshold:.15});
revealEls.forEach(el=>io.observe(el));

// Carte mentale — déclenche le dessin des lignes au scroll
const mindmap = document.getElementById('mindmap');
if(mindmap){
  const mmObserver = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ mindmap.classList.add('in-view'); } });
  }, {threshold:.3});
  mmObserver.observe(mindmap);
}
