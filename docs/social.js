'use strict';
/* VIRA Social — demonstração local. Nenhuma pessoa real recebe dados. */
const storeKey='vira_social_demo_v2';
const sampleProfiles=[
 {id:'lia-demo',name:'Lia • Exemplo',handle:'lia.exemplo',initials:'LE',bio:'Arte, encontros e pequenos projetos.',accent:'blue'},
 {id:'caio-demo',name:'Caio • Exemplo',handle:'caio.exemplo',initials:'CE',bio:'Música, vídeos e descobertas.',accent:'amber'},
 {id:'bia-demo',name:'Bia • Exemplo',handle:'bia.exemplo',initials:'BE',bio:'Compartilhando conhecimentos.',accent:'indigo'}
];
const defaultState=()=>({
 me:{name:'Você',handle:'voce.vira',bio:'Construindo conexões no VIRA.',avatar:'V'},
 posts:[
 {id:'post-demo-1',author:'lia-demo',kind:'photo',caption:'Quando você compartilha uma ideia, ela pode virar uma oportunidade. ✨',headline:'Um talento pode inspirar milhões.',accent:'indigo',likes:24,liked:false,saved:false,comments:[],createdAt:1,demo:true},
 {id:'post-demo-2',author:'caio-demo',kind:'reel',caption:'Mostre seu talento e inspire outras pessoas. Que habilidade você gostaria de mostrar?',headline:'Seu próximo talento começa aqui',accent:'amber',likes:16,liked:false,saved:false,comments:[],createdAt:2,demo:true},
 {id:'post-demo-3',author:'bia-demo',kind:'photo',caption:'Uma comunidade é mais forte quando seus membros se ajudam.',headline:'Uma comunidade. Muitas possibilidades.',accent:'blue',likes:8,liked:false,saved:false,comments:[],createdAt:3,demo:true}
 ],
 following:[],requests:[],messages:[],notifications:[],stories:[],mode:'todos',savedView:false
});
let state=defaultState();
try {
 const loaded=JSON.parse(localStorage.getItem(storeKey)||'null');
 if(loaded && typeof loaded==='object' && Array.isArray(loaded.posts)) {
   state={...defaultState(),...loaded};
   for(const prop of ['posts','following','requests','messages','notifications','stories'])if(!Array.isArray(state[prop]))state[prop]=[];
 }
}catch(_){}
let tab='inicio',searchTerm='',exploreTab='pessoas',profileTab='publicacoes',reelsIndex=0;
let tempVideo={};let modal=null;
const byId=id=>document.getElementById(id);
const escapeText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=s=>escapeText(s);
const jdate=()=>new Date().toISOString();
const id=()=>('id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
const profile=who=>who==='me'?{id:'me',name:state.me.name,handle:state.me.handle,initials:(state.me.avatar||'V').slice(0,2),bio:state.me.bio}:sampleProfiles.find(p=>p.id===who)||{name:'Perfil de exemplo',handle:'demo',initials:'V'};
const isFollowing=who=>state.following.includes(who);
const save=()=>{try{const data={...state,posts:state.posts.map(p=>({...p,videoUrl:undefined}))};localStorage.setItem(storeKey,JSON.stringify(data));return true}catch(e){toast('O armazenamento local está cheio. Remova algumas fotos ou publicações.');return false}};
const toast=m=>{const e=byId('toast');e.textContent=m;e.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove('show'),3500)};
const avatar=(person,small=false)=>'<div class="avatar '+(small?'tiny ':'')+(person.id==='me'?'avatar-me':'')+'">'+txt(person.initials||'V')+'</div>';
const icon=(n)=>({inicio:'⌂',explorar:'◇',reels:'▷',resolver:'✓',perfil:'♙',mensagens:'✉',notificacoes:'♡'}[n]||'○');
const routes=[['inicio','Início'],['explorar','Explorar'],['reels','Reels'],['resolver','Resolver'],['perfil','Perfil']];
const entityTag=who=>{const p=profile(who);return '<button class="ghost-btn" data-act="open-profile" data-id="'+txt(who)+'">@'+txt(p.handle)+'</button>'};
function updateNav(){
 for(const el of [byId('side-nav'),byId('bottom-nav')])el.innerHTML=routes.map(([key,name])=>'<button type="button" class="nav-link '+(tab===key?'active':'')+'" data-route="'+key+'" aria-label="'+name+'"><span class="nav-ico">'+icon(key)+'</span><span>'+name+'</span></button>').join('');
 byId('suggestions').innerHTML=sampleProfiles.map(p=>'<div class="suggestion">'+avatar(p,true)+'<div class="grow"><b>'+txt(p.name)+'</b><small>@'+txt(p.handle)+'</small></div><button data-act="follow" data-id="'+p.id+'">'+(isFollowing(p.id)?'Seguindo':'Seguir')+'</button></div>').join('');
}
function setTab(next){tab=next;updateNav();render();window.scrollTo({top:0,behavior:'instant'})}
const storyList=()=>'<div class="stories"><button class="story mine" data-act="create-story"><span class="story-ring">'+avatar(profile('me'))+'</span><span>+ Seu story</span></button>'+sampleProfiles.map(p=>'<button class="story" data-act="view-story" data-id="'+p.id+'"><span class="story-ring">'+avatar(p)+'</span><span>'+txt(p.name.replace(' • Exemplo',''))+'</span></button>').join('')+state.stories.slice(0,5).map(s=>'<button class="story" data-act="view-story" data-id="'+s.id+'"><span class="story-ring">'+avatar(profile('me'))+'</span><span>Meu story</span></button>').join('')+'</div>';
const postMedia=p=>{
 const label=p.kind==='reel'?'▶ REEL':'✦';
 if(p.image)return '<div class="media"><img src="'+txt(p.image)+'" alt="'+txt(p.headline||'Foto publicada')+'"></div>';
 if(p.kind==='reel'&&tempVideo[p.id])return '<div class="media"><video controls playsinline preload="metadata" src="'+txt(tempVideo[p.id])+'" aria-label="Vídeo enviado nesta sessão"></video></div>';
 return '<div class="media '+txt(p.accent||'')+'"><span>'+label+'</span><b>'+txt(p.headline||'Compartilhe seu momento')+'</b><small>'+(p.demo?'Conteúdo fictício de demonstração':p.kind==='reel'?'Vídeo disponível apenas durante esta sessão':'Post local')+'</small></div>';
};
const postCard=p=>{
 const who=profile(p.author),whoId=p.author;
 return '<article class="post" data-post="'+txt(p.id)+'"><div class="post-head">'+avatar(who,true)+'<div class="grow"><strong>'+txt(who.name)+'</strong><small>@'+txt(who.handle)+' · '+(p.demo?'Exemplo fictício':'Publicado localmente')+'</small></div><button class="round-btn" title="Opções" aria-label="Opções" data-act="post-options" data-id="'+txt(p.id)+'">⋯</button></div>'+
 postMedia(p)+'<div class="post-actions"><button class="round-btn heart '+(p.liked?'liked':'')+'" data-act="like" data-id="'+txt(p.id)+'" aria-label="Curtir">'+(p.liked?'♥':'♡')+'</button><button class="round-btn" data-act="comments" data-id="'+txt(p.id)+'" aria-label="Comentários">▢</button><button class="round-btn" data-act="share" data-id="'+txt(p.id)+'" aria-label="Compartilhar">↗</button><div class="grow"></div><button class="round-btn bookmark '+(p.saved?'saved':'')+'" data-act="save-post" data-id="'+txt(p.id)+'" aria-label="Salvar">'+(p.saved?'▣':'▤')+'</button></div><div class="post-text"><div class="stats">'+(p.likes+(p.liked?1:0))+' curtidas · '+p.comments.length+' comentários</div><p><b>'+txt(who.name)+'</b> '+txt(p.caption)+'</p><button class="ghost-btn" data-act="comments" data-id="'+txt(p.id)+'">Ver comentários e participar</button></div></article>';
};
function renderHome(){
 const posts=state.posts.filter(p=>state.mode==='todos'||p.author==='me'||isFollowing(p.author)).slice().reverse();
 return '<div class="section-head"><h2>Momentos</h2><span class="pill">Comunidade VIRA</span></div>'+storyList()+
 '<div class="composer">'+avatar(profile('me'),true)+'<button data-act="create-post">No que você está pensando?</button><button class="quick-plus" data-act="create-post" aria-label="Criar publicação">＋</button></div>'+
 '<div class="glass-card"><div class="eyebrow">DIFERENCIAL VIRA</div><h2>Uma conversa pode virar solução.</h2><p>Compartilhe seu dia, crie conexões e encontre pessoas com quem colaborar.</p><button class="primary-btn orange-btn" data-route="resolver">Explorar VIRA Resolve</button></div>'+
 '<div class="feed-mode"><button data-act="feed-mode" data-id="todos" class="chip '+(state.mode==='todos'?'active':'')+'">Para você</button><button data-act="feed-mode" data-id="seguindo" class="chip '+(state.mode==='seguindo'?'active':'')+'">Seguindo</button><span class="muted">Demonstração</span></div>'+
 (posts.length?posts.map(postCard).join(''):'<div class="empty"><b>Seu feed está começando.</b><p>Siga perfis de exemplo ou crie sua primeira publicação.</p><button data-act="create-post" class="primary-btn">Publicar</button></div>');
}
function personCard(p){return '<div class="person">'+avatar(p)+'<div class="grow"><b>'+txt(p.name)+'</b><small>@'+txt(p.handle)+' · Perfil fictício</small></div><button class="small-btn" data-act="follow" data-id="'+p.id+'">'+(isFollowing(p.id)?'Seguindo':'Seguir +')+'</button><button class="round-btn" data-act="messages-with" data-id="'+p.id+'" title="Abrir conversa">✉</button></div>'}
function renderExplore(){
 const filtered=sampleProfiles.filter(p=>(p.name+' '+p.handle+' '+p.bio).toLowerCase().includes(searchTerm));
 const filteredPosts=state.posts.filter(p=>(p.caption+' '+p.headline).toLowerCase().includes(searchTerm));
 return '<div class="section-head"><div><div class="eyebrow">ENCONTRE SUA TRIBO</div><h1>Explorar</h1></div><button class="small-btn" data-act="friends">Amizades</button></div><input id="explore-search" class="search" autocomplete="off" placeholder="Buscar pessoas, ideias e publicações" aria-label="Buscar" value="'+txt(searchTerm)+'">'+
 '<div class="feed-mode"><button class="chip '+(exploreTab==='pessoas'?'active':'')+'" data-act="explore-tab" data-id="pessoas">Pessoas</button><button class="chip '+(exploreTab==='publicacoes'?'active':'')+'" data-act="explore-tab" data-id="publicacoes">Publicações</button></div>'+
 '<div id="explore-results">'+(exploreTab==='pessoas'?filtered.map(personCard).join('')||'<div class="empty">Nenhum perfil de exemplo encontrado.</div>':'<div class="tiles">'+filteredPosts.map(p=>'<button class="tile" data-act="open-post" data-id="'+txt(p.id)+'">'+(p.image?'<img alt="" src="'+txt(p.image)+'">':'')+'<b>'+txt(p.headline||p.caption.slice(0,42))+'</b></button>').join('')+'</div>')+'</div>'+
 '<div class="glass-card"><h2>Descubra mais que curtidas</h2><p>No VIRA, experiências compartilhadas podem gerar amizades, colaboração e soluções. Conexões reais dependem da etapa de lançamento com contas e servidor.</p><button class="small-btn" data-route="resolver">Conhecer o Resolve</button></div>';
}
function renderReels(){
 const reels=state.posts.filter(p=>p.kind==='reel').slice().reverse();if(!reels.length)return '<h1>Reels</h1><div class="empty"><b>Nenhum reel ainda</b><p>Crie um vídeo local para visualizar nesta sessão.</p><button class="primary-btn" data-act="create-post">Criar reel</button></div>';
 reelsIndex=Math.min(reelsIndex,reels.length-1);
 const p=reels[reelsIndex];
 return '<div class="section-head"><h1>Reels</h1><button class="small-btn" data-act="create-post">+ Criar</button></div><div class="post">'+postMedia(p)+'<div class="post-text"><b>'+txt(profile(p.author).name)+'</b><p>'+txt(p.caption)+'</p><p class="muted">O upload e a reprodução neste protótipo são locais. Vídeos enviados não são compartilhados online.</p><div class="button-row"><button class="small-btn" data-act="like" data-id="'+p.id+'">'+(p.liked?'♥ Curtido':'♡ Curtir')+'</button><button class="small-btn" data-act="comments" data-id="'+p.id+'">Comentar</button><button class="small-btn" data-act="share" data-id="'+p.id+'">Compartilhar</button></div></div></div><div class="button-row"><button class="small-btn" data-act="previous-reel">← Anterior</button><button class="primary-btn" data-act="next-reel">Próximo →</button></div>';
}
function requestCard(r){
 const answers=(r.answers||[]).length;
 return '<article class="request"><div class="request-head"><b>'+txt(r.title)+'</b><span class="status '+(r.resolved?'done':'')+'">'+(r.resolved?'✓ Resolvido':'Aberto')+'</span></div><p class="meta">'+txt(r.category)+' · Publicado apenas no seu navegador</p><p>'+txt(r.description)+'</p><div class="button-row"><button class="small-btn" data-act="request-answers" data-id="'+r.id+'">▢ Respostas ('+answers+')</button><button class="small-btn" data-act="request-resolve" data-id="'+r.id+'" '+(r.resolved?'disabled':'')+'>'+ (r.resolved?'Concluído':'✓ Marcar resolvido')+'</button></div></article>';
}
function renderResolve(){return '<div class="glass-card"><div class="eyebrow">VIRA A CHAVE</div><h1>Conexões que <span style="color:#f4a3fd">resolvem.</span></h1><p>Peça orientação, compartilhe conhecimento e encontre colaboração. Nesta demonstração, os pedidos e respostas ficam neste aparelho.</p><button class="primary-btn orange-btn" data-act="create-request">+ Fazer pedido de ajuda</button></div><div class="section-head" style="margin-top:23px"><h2>Seus pedidos ('+state.requests.length+')</h2></div>'+
 (state.requests.length?state.requests.slice().reverse().map(requestCard).join(''):'<div class="empty"><b>Comece uma conversa útil.</b><p>Publique um pedido de demonstração e explore as interações.</p><button class="primary-btn" data-act="create-request">Criar primeiro pedido</button></div>');}
function renderProfile(){
 const mine=state.posts.filter(p=>p.author==='me');
 const shown=state.savedView?state.posts.filter(p=>p.saved):mine;
 return '<div class="profile-cover"></div><div class="profile-body"><div class="avatar avatar-me big">'+txt(state.me.avatar||'V')+'</div><div class="section-head"><div><h1>'+txt(state.me.name)+'</h1><p class="muted">@'+txt(state.me.handle)+'</p></div><button class="small-btn" data-act="edit-profile">Editar perfil</button></div><p>'+txt(state.me.bio)+'</p><div class="counter-row"><div><b>'+mine.length+'</b><small>Publicações</small></div><div><b>0</b><small>Seguidores reais</small></div><div><b>'+state.following.length+'</b><small>Seguindo (demo)</small></div></div><div class="profile-controls"><button class="small-btn" data-act="friends">Amizades</button><button class="small-btn" data-act="settings">Configurações</button><button class="small-btn" data-act="create-post">+ Publicar</button></div></div>'+
 '<div class="feed-mode"><button class="chip '+(!state.savedView?'active':'')+'" data-act="profile-view" data-id="posts">Minhas publicações</button><button class="chip '+(state.savedView?'active':'')+'" data-act="profile-view" data-id="saved">Salvos</button></div>'+
 (shown.length?'<div class="tiles">'+shown.map(p=>'<button class="tile" data-act="open-post" data-id="'+txt(p.id)+'">'+(p.image?'<img alt="" src="'+txt(p.image)+'">':'')+'<b>'+txt(p.headline||p.caption.slice(0,55))+'</b></button>').join('')+'</div>':'<div class="empty"><b>Ainda não há publicações aqui</b><p>Crie um momento ou salve alguma publicação do feed.</p></div>')+
 '<p class="muted" style="font-size:11px;margin-top:18px">Os dados do seu perfil são locais e não criam uma conta VIRA real.</p>';
}
function render(){updateNav();byId('view').innerHTML=tab==='inicio'?renderHome():tab==='explorar'?renderExplore():tab==='reels'?renderReels():tab==='resolver'?renderResolve():renderProfile();}
function track(message){state.notifications.unshift({id:id(),message,time:jdate()});state.notifications=state.notifications.slice(0,25);save();}
function dialog(title,content,footer=''){
 closeDialog();
 const root=byId('overlay-root');
 root.innerHTML='<div class="overlay" id="active-overlay"><div class="dialog" role="dialog" aria-modal="true" aria-label="'+txt(title)+'"><div class="dialog-head"><h2>'+txt(title)+'</h2><button class="round-btn" data-act="close-dialog" aria-label="Fechar">×</button></div>'+content+footer+'</div></div>';
 modal=root.firstElementChild;modal.addEventListener('click',event=>{if(event.target===modal)closeDialog()});
 setTimeout(()=>{const el=root.querySelector('input,textarea,button');el?.focus()},20);
}
function closeDialog(){byId('overlay-root').replaceChildren();modal=null;}
function follow(who){if(who==='me')return;state.following=isFollowing(who)?state.following.filter(x=>x!==who):[...state.following,who];save();render();toast(isFollowing(who)?'Seguindo perfil de demonstração':'Deixou de seguir perfil de demonstração');}
function openProfile(who){const p=profile(who);if(who==='me'){setTab('perfil');return}dialog(p.name,
 '<div class="person">'+avatar(p)+'<div><b>'+txt(p.name)+'</b><small>@'+txt(p.handle)+' · Exemplo fictício</small></div></div><p>'+txt(p.bio)+'</p><p class="muted">Este perfil demonstra o funcionamento futuro do VIRA. Não representa uma pessoa real.</p><div class="button-row"><button class="primary-btn" data-act="follow-dialog" data-id="'+txt(who)+'">'+(isFollowing(who)?'Deixar de seguir':'Seguir')+'</button><button class="small-btn" data-act="messages-with" data-id="'+txt(who)+'">Mensagem</button></div>');}
function openComments(postid){const p=state.posts.find(p=>p.id===postid);if(!p)return;dialog('Comentários',
 '<p class="muted">Publicação de '+txt(profile(p.author).name)+'. Os comentários ficam neste navegador.</p><div class="stack" id="comment-list">'+(p.comments.length?p.comments.map(c=>'<div class="card"><b>'+txt(c.author)+'</b> '+txt(c.text)+'</div>').join(''):'<div class="empty">Seja o primeiro a comentar nesta demonstração.</div>')+'</div><form id="comment-form" data-id="'+txt(p.id)+'" class="msg-form"><input required minlength="1" maxlength="800" id="comment-input" placeholder="Adicionar um comentário" aria-label="Comentário"><button type="submit">Enviar</button></form>');
}
function createPost(){dialog('Criar publicação',
 '<form id="post-form"><div class="field"><label for="post-type">Tipo</label><select id="post-type"><option value="photo">Foto / texto</option><option value="reel">Reel / vídeo local</option></select></div><div class="field"><label for="post-caption">Legenda</label><textarea id="post-caption" required maxlength="1500" minlength="2" placeholder="Compartilhe algo com a comunidade..."></textarea></div><div class="field"><label for="post-file">Foto ou vídeo (opcional)</label><input type="file" id="post-file" accept="image/*,video/mp4,video/webm,video/quicktime"><small>Fotos são reduzidas e salvas no navegador. Vídeos ficam disponíveis somente nesta sessão.</small></div><div class="modal-footer"><button class="small-btn" type="button" data-act="close-dialog">Cancelar</button><button class="primary-btn" type="submit">Publicar no meu protótipo</button></div></form>');
}
const readImage=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');const scale=Math.min(1,900/Math.max(img.width,img.height));canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.72))};img.onerror=()=>reject(new Error('Imagem inválida'));img.src=reader.result};reader.onerror=()=>reject(new Error('Falha ao abrir imagem'));reader.readAsDataURL(file)});
async function submitPost(){
 const caption=byId('post-caption').value.trim(),kind=byId('post-type').value,file=byId('post-file').files?.[0];if(caption.length<2)return toast('Digite uma legenda.');
 const p={id:id(),author:'me',caption,kind,headline:caption.slice(0,60),accent:'',likes:0,liked:false,saved:false,comments:[],createdAt:Date.now(),demo:false};
 if(file){if(file.type.startsWith('image/')){if(file.size>12*1024*1024)return toast('Imagem muito grande. Limite: 12 MB.');try{p.image=await readImage(file);p.kind='photo'}catch(e){return toast('Não foi possível processar a imagem.')}}
 else if(file.type.startsWith('video/')){if(file.size>80*1024*1024)return toast('Vídeo muito grande. Limite: 80 MB.');p.kind='reel';p.headline='Vídeo enviado nesta sessão';tempVideo[p.id]=URL.createObjectURL(file)}else return toast('Formato de mídia não suportado.')}
 state.posts.push(p);track('Você criou uma publicação no protótipo VIRA.');if(!save()){state.posts.pop();return}closeDialog();setTab(p.kind==='reel'?'reels':'inicio');toast('Publicação criada localmente.');}
function createStory(){dialog('Adicionar story',
 '<form id="story-form"><div class="field"><label for="story-text">Seu momento</label><textarea id="story-text" required minlength="2" maxlength="350" placeholder="Compartilhe seu momento..."></textarea></div><p class="muted">Stories demonstrativos não são publicados na internet.</p><div class="modal-footer"><button class="primary-btn" type="submit">Adicionar meu story</button></div></form>')}
function viewStory(who){
 const s=state.stories.find(x=>x.id===who);const p=s?profile('me'):profile(who);
 dialog('Stories · '+p.name,
 '<div class="media" style="aspect-ratio:3/4"><span>✦</span><b>'+txt(s?s.text:'Stories e momentos aproximam pessoas.')+'</b><small>'+(s?'Seu story de demonstração':'Story fictício de demonstração')+'</small></div><p class="muted" style="margin-top:10px">A função de stories compartilhados ficará disponível com contas reais e backend.</p>');
}
function createRequest(){dialog('Novo pedido VIRA Resolve',
 '<form id="request-form"><div class="field"><label for="req-title">O que você precisa?</label><input id="req-title" required minlength="5" maxlength="120" placeholder="Ex.: Preciso de ajuda para divulgar meu negócio"></div><div class="field"><label for="req-category">Categoria</label><select id="req-category"><option>Empreendedorismo</option><option>Aprendizagem</option><option>Serviços</option><option>Oportunidades</option><option>Comunidade</option></select></div><div class="field"><label for="req-desc">Descreva sua necessidade</label><textarea id="req-desc" minlength="10" maxlength="2500" required placeholder="Conte o problema e o tipo de ajuda que procura. Não informe dados pessoais."></textarea></div><p class="muted">Os pedidos ficam somente no seu navegador. Ninguém mais consegue responder online nesta versão.</p><div class="modal-footer"><button class="primary-btn" type="submit">Criar pedido local</button></div></form>');
}
function replyRequest(requestId){const r=state.requests.find(x=>x.id===requestId);if(!r)return;dialog('Respostas — '+r.title,
 '<div class="stack">'+((r.answers||[]).length?r.answers.map(a=>'<div class="card"><b>'+txt(a.author)+'</b><p>'+txt(a.text)+'</p></div>').join(''):'<div class="empty">Nenhuma resposta neste protótipo.</div>')+'</div><form id="answer-form" data-id="'+r.id+'"><div class="field"><label for="answer-input">Escreva uma resposta</label><textarea id="answer-input" required minlength="2" maxlength="1500"></textarea></div><div class="modal-footer"><button type="submit" class="primary-btn">Adicionar resposta local</button></div></form>');
}
function messages(who){const p=profile(who||'lia-demo'),conv=state.messages.filter(m=>m.to===p.id);
 dialog('Mensagens · '+p.name,
 '<p class="muted">Conversa de demonstração. Mensagens NÃO são enviadas a outra pessoa.</p><div class="message-area" id="message-list">'+(conv.length?conv.map(m=>'<div class="bubble">'+txt(m.text)+'</div>').join(''):'<div class="empty">Inicie uma conversa de teste.</div>')+'</div><form id="message-form" data-id="'+p.id+'" class="msg-form"><input id="msg-input" maxlength="1200" required placeholder="Escreva uma mensagem..." aria-label="Nova mensagem"><button type="submit">Enviar</button></form>');
}
function openInbox(){dialog('Mensagens',
 '<p class="muted">Explore uma interface de conversa com perfis fictícios. Nenhum usuário real receberá mensagens.</p>'+sampleProfiles.map(p=>'<button class="person" style="width:100%;color:white;text-align:left" data-act="messages-with" data-id="'+p.id+'">'+avatar(p)+'<span><b>'+txt(p.name)+'</b><small>Conversa de teste</small></span><span style="margin-left:auto">→</span></button>').join(''));}
function showNotifications(){dialog('Notificações',
 '<p class="muted">Notificações geradas apenas pelas suas próprias ações nesta demonstração.</p>'+
 (state.notifications.length?state.notifications.map(n=>'<div class="card"><span>✦</span> '+txt(n.message)+'</div>').join(''):'<div class="empty">Você ainda não tem notificações locais.</div>'))}
function showFriends(){dialog('Amizades e conexões',
 '<p class="muted">Siga perfis de demonstração para explorar como funcionará a descoberta de amigos. A conexão real entre pessoas ainda não está ativada.</p>'+
 sampleProfiles.map(personCard).join('')+'<p class="muted">Seguindo: '+state.following.length+' perfis de exemplo.</p>')}
function settings(){dialog('Configurações e privacidade',
 '<div class="stack"><div class="card"><b>Modo de demonstração</b><p>Este site não possui login, seguidores reais ou comunicação entre aparelhos. Interações são armazenadas no navegador.</p></div><div class="card"><b>Controle dos meus dados</b><p>Você pode apagar todas as publicações, mensagens e pedidos criados neste aparelho.</p><button data-act="clear-all" class="small-btn">Apagar todos os dados locais</button></div><div class="card"><b>Adicionar à tela inicial</b><p>No Safari, toque em Compartilhar → Adicionar à Tela de Início.</p></div></div>');
}
function editProfile(){dialog('Editar meu perfil de demonstração',
 '<form id="profile-form"><div class="field"><label>Seu nome</label><input required id="profile-name" minlength="2" maxlength="45" value="'+txt(state.me.name)+'"></div><div class="field"><label>Nome de usuário</label><input required id="profile-handle" minlength="3" maxlength="24" value="'+txt(state.me.handle)+'"></div><div class="field"><label>Biografia</label><textarea id="profile-bio" maxlength="180">'+txt(state.me.bio)+'</textarea></div><div class="modal-footer"><button type="submit" class="primary-btn">Salvar no navegador</button></div></form>')}
function options(postId){const p=state.posts.find(p=>p.id===postId);if(!p)return;
 dialog('Opções da publicação','<div class="stack"><button class="small-btn" data-act="save-post" data-id="'+p.id+'">'+(p.saved?'Remover dos salvos':'Salvar publicação')+'</button>'+
 (p.author==='me'?'<button class="small-btn" data-act="delete-post" data-id="'+p.id+'">Excluir minha publicação</button>':'<button class="small-btn" data-act="report" data-id="'+p.id+'">Simular denúncia (sem envio)</button>')+'</div>');
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-route],[data-act]');if(!b)return;
 if(b.dataset.route){setTab(b.dataset.route);return}
 const action=b.dataset.act,what=b.dataset.id;
 switch(action){
 case 'show-search':setTab('explorar');setTimeout(()=>byId('explore-search')?.focus(),30);break;
 case 'notifications':showNotifications();break;
 case 'messages':openInbox();break;
 case 'messages-with':messages(what);break;
 case 'close-dialog':closeDialog();break;
 case 'friends':showFriends();break;
 case 'follow':follow(what);break;
 case 'follow-dialog':follow(what);openProfile(what);break;
 case 'open-profile':openProfile(what);break;
 case 'create-post':createPost();break;
 case 'create-story':createStory();break;
 case 'view-story':viewStory(what);break;
 case 'create-request':createRequest();break;
 case 'like':{const p=state.posts.find(x=>x.id===what);if(p){p.liked=!p.liked;save();render();toast(p.liked?'Você curtiu esta publicação':'Curtida removida')}}break;
 case 'save-post':{const p=state.posts.find(x=>x.id===what);if(p){p.saved=!p.saved;save();closeDialog();render();toast(p.saved?'Publicação salva no navegador':'Removida dos salvos')}}break;
 case 'comments':openComments(what);break;
 case 'open-post':{const p=state.posts.find(x=>x.id===what);if(p)dialog('Publicação',postCard(p))}break;
 case 'post-options':options(what);break;
 case 'delete-post':{if(confirm('Excluir esta publicação local?')){state.posts=state.posts.filter(x=>x.id!==what);save();closeDialog();render()}}break;
 case 'report':toast('Demonstração: denúncias reais dependerão de servidor e moderação.');closeDialog();break;
 case 'share':{const link=location.href.split('#')[0];try{if(navigator.share)await navigator.share({title:'VIRA Social — Protótipo',url:link});else if(navigator.clipboard){await navigator.clipboard.writeText(link);toast('Link do VIRA copiado.')}else toast('Copie o endereço do navegador para compartilhar.')}catch(_){}}break;
 case 'feed-mode':state.mode=what;save();render();break;
 case 'explore-tab':exploreTab=what;render();break;
 case 'profile-view':state.savedView=what==='saved';save();render();break;
 case 'next-reel':{const n=state.posts.filter(x=>x.kind==='reel').length;reelsIndex=n?(reelsIndex+1)%n:0;render()}break;
 case 'previous-reel':{const n=state.posts.filter(x=>x.kind==='reel').length;reelsIndex=n?(reelsIndex-1+n)%n:0;render()}break;
 case 'request-answers':replyRequest(what);break;
 case 'request-resolve':{const r=state.requests.find(x=>x.id===what);if(r){r.resolved=true;save();render();toast('Pedido marcado como resolvido localmente.')}}break;
 case 'edit-profile':editProfile();break;
 case 'settings':settings();break;
 case 'clear-all':if(confirm('Apagar todos os dados do VIRA deste navegador? Esta ação não pode ser desfeita.')){state=defaultState();save();closeDialog();setTab('inicio');toast('Dados locais apagados.')}break;
 default:break;
 }
});
document.addEventListener('submit',async e=>{
 const f=e.target;if(!f.id)return;e.preventDefault();
 if(f.id==='post-form'){await submitPost();return}
 if(f.id==='story-form'){const text=byId('story-text').value.trim();if(text.length<2)return toast('Escreva seu momento.');state.stories.unshift({id:id(),text});save();closeDialog();setTab('inicio');toast('Story salvo neste navegador.');return}
 if(f.id==='request-form'){const title=byId('req-title').value.trim(),description=byId('req-desc').value.trim();if(title.length<5||description.length<10)return toast('Descreva melhor o pedido.');state.requests.push({id:id(),title,description,category:byId('req-category').value,resolved:false,answers:[]});track('Seu pedido VIRA Resolve foi criado localmente.');closeDialog();setTab('resolver');toast('Pedido criado no navegador.');return}
 if(f.id==='comment-form'){const p=state.posts.find(x=>x.id===f.dataset.id),comment=byId('comment-input').value.trim();if(p&&comment){p.comments.push({author:state.me.name,text:comment});save();openComments(p.id);toast('Comentário local adicionado.')}return}
 if(f.id==='answer-form'){const r=state.requests.find(x=>x.id===f.dataset.id),answer=byId('answer-input').value.trim();if(r&&answer){r.answers.push({author:state.me.name,text:answer});save();replyRequest(r.id);toast('Resposta registrada no navegador.')}return}
 if(f.id==='message-form'){const message=byId('msg-input').value.trim();if(message){state.messages.push({id:id(),to:f.dataset.id,text:message,date:jdate()});save();messages(f.dataset.id);toast('Mensagem guardada localmente; não foi enviada.')}return}
 if(f.id==='profile-form'){const name=byId('profile-name').value.trim(),handle=byId('profile-handle').value.trim().replace(/[^\w.]/g,'_').slice(0,24);if(name.length<2||handle.length<3)return toast('Nome ou usuário muito curto.');state.me={name,handle,bio:byId('profile-bio').value.trim(),avatar:name.slice(0,1).toUpperCase()};save();closeDialog();setTab('perfil');toast('Perfil de demonstração atualizado.');return}
});
document.addEventListener('input',e=>{if(e.target?.id==='explore-search'){searchTerm=e.target.value.toLowerCase();const cards=exploreTab==='pessoas'?sampleProfiles.filter(p=>(p.name+' '+p.handle+' '+p.bio).toLowerCase().includes(searchTerm)).map(personCard).join(''): '<div class="tiles">'+state.posts.filter(p=>(p.caption+' '+p.headline).toLowerCase().includes(searchTerm)).map(p=>'<button class="tile" data-act="open-post" data-id="'+txt(p.id)+'"><b>'+txt(p.headline||p.caption)+'</b></button>').join('')+'</div>';byId('explore-results').innerHTML=cards||'<div class="empty">Sem resultados.</div>'}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal)closeDialog()});
render();
