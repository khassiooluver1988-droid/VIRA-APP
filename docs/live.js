'use strict';
/* KLIX Social — beta real. Os dados são persistidos apenas no Supabase do KLIX.
 * Não há conta demonstrativa e não há simulação de publicações.
 */
const cfg = window.VIRA_CONFIG || {};
const BASE = 'https://khassiooluver1988-droid.github.io/VIRA-APP/index-live.html';
let sb = null, session = null, me = null, route = 'inicio', busy = false, authMode = 'login', notice = '';
let people=[],posts=[],likes=[],comments=[],follows=[],requests=[],answers=[],messages=[],stories=[];
let currentProfile='me', currentChat=null, filter='',lastError='';
const el = id => document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
const formatDate=v=>{try{return new Date(v).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}catch{return ''}};
const toast=text=>{const n=el('toast');n.textContent=text;n.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>n.classList.remove('show'),5000)};
const busyUI=flag=>{busy=flag;document.querySelectorAll('button[type="submit"]').forEach(x=>x.disabled=flag)};
const fallbackError=e=>String(e?.message||e||'Erro inesperado');
const nav=[['inicio','⌂','Início'],['videos','▷','Vídeos'],['criar','＋','Criar'],['explorar','⌕','Buscar'],['perfil','♙','Perfil']];
const empty=(heading,description,action='')=>'<div class="empty-state"><b>'+safe(heading)+'</b><p>'+safe(description)+'</p>'+action+'</div>';
const pOf=id=>people.find(x=>x.id===id)||{id,display_name:'Usuário KLIX',username:'membro',bio:''};
const avatar=(p,cls='')=>{
 const letter=safe((p?.display_name||'K').trim().charAt(0).toUpperCase());
 const src=p?.avatar_path?picture(p.avatar_path):'';
 return '<div class="avatar '+safe(cls)+' klix-avatar">'+letter+(src?'<img loading="lazy" class="avatar-photo" alt="" src="'+safe(src)+'" onerror="this.remove()">':'')+'</div>';
};
const picture=path=>{
 if(!path)return '';
 try{const o=sb.storage.from('vira-media').getPublicUrl(path);const u=new URL(o.data.publicUrl);if(u.protocol!=='https:')return '';return u.href}catch{return ''}
};
const initStatus=()=>!!(cfg.url&&cfg.publishableKey&&/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg.url));
function modal(title,body){
 const node=el('overlay-root');
 node.innerHTML='<div class="overlay" id="veil"><div class="dialog" role="dialog" aria-modal="true" aria-label="'+safe(title)+'"><div class="dialog-head"><h2>'+safe(title)+'</h2><button class="round-btn" data-act="close" aria-label="Fechar">×</button></div>'+body+'</div></div>';
 node.querySelector('#veil').addEventListener('click',e=>{if(e.target.id==='veil')closeModal()});
}
function closeModal(){el('overlay-root').replaceChildren()}
function statusPage(){
 el('app').classList.remove('authenticated');
 el('view').innerHTML='<div class="auth-shell"><div class="auth-logo"><strong class="klix-auth-mark">KLIX</strong></div>'+
 '<div class="auth-panel"><h1 class="auth-title">KLIX Social</h1><div class="view-notice"><b>Ativação do cadastro pendente.</b><p class="muted-block">A interface já está preparada. Para criar contas de verdade, o projeto exclusivo do KLIX precisa ser criado no Supabase e conectado com uma chave pública.</p></div><p class="muted">Nenhuma conta será simulada. Quando a integração estiver ativa, esta tela dará lugar a Entrar e Criar conta.</p></div></div>';
}
function renderAuth(){
 el('app').classList.remove('authenticated');
 el('bottom-nav').innerHTML='';
 el('view').innerHTML='<div class="auth-shell"><div class="auth-logo"><strong class="klix-auth-mark">KLIX</strong></div>'+
 '<div class="auth-panel"><h1 class="auth-title">Entre para a comunidade KLIX</h1>'+
 '<p style="text-align:center" class="muted-block">Encontre amigos, compartilhe momentos e faça novas conexões.</p>'+
 '<div class="auth-toggle"><button class="chip '+(authMode==='login'?'active':'')+'" data-act="mode" data-id="login">Entrar</button><button class="chip '+(authMode==='signup'?'active':'')+'" data-act="mode" data-id="signup">Criar conta</button></div>'+
 (authMode==='reset'?'<form id="reset-form"><label class="auth-field"><span>Seu e-mail</span><input type="email" name="email" required autocomplete="email" placeholder="voce@exemplo.com"></label><button class="primary-btn" type="submit">Enviar link de recuperação</button><p class="auth-help"><button class="ghost-btn" data-act="mode" data-id="login">Voltar</button></p></form>':
 '<form id="auth-form">'+(authMode==='signup'?'<label class="auth-field"><span>Seu nome</span><input name="display_name" minlength="2" maxlength="70" required autocomplete="name" placeholder="Como quer ser chamado?"></label>':'')+
 '<label class="auth-field"><span>E-mail</span><input name="email" required type="email" autocomplete="email" placeholder="voce@exemplo.com"></label>'+
 '<label class="auth-field"><span>Senha</span><input name="password" type="password" minlength="8" required autocomplete="'+(authMode==='signup'?'new-password':'current-password')+'" placeholder="Mínimo de 8 caracteres"></label>'+
 '<button type="submit" class="primary-btn" style="width:100%">'+(authMode==='signup'?'Criar minha conta':'Entrar no KLIX')+'</button></form>'+
 (authMode==='login'?'<p class="auth-help"><button data-act="mode" data-id="reset" class="ghost-btn">Esqueceu a senha?</button></p>':'<p class="auth-footnote">Você poderá ajustar seu nome de usuário no seu perfil após entrar. Se o e-mail exigir confirmação, abra o link recebido para ativar a conta.</p>'))+
 (notice?'<p class="view-notice" role="status">'+safe(notice)+'</p>':'')+'<p class="auth-footnote">Ao criar conta, compartilhe somente informações que você deseja tornar visíveis aos membros da comunidade. Fotos publicadas podem ser acessadas por link.</p></div></div>';
}
function renderNav(){
 const output=nav.map(([k,ico,label])=>'<button class="nav-link '+(route===k?'active':'')+'" data-route="'+k+'"><span class="nav-ico">'+ico+'</span><span>'+label+'</span></button>').join('');
 el('side-nav').innerHTML=output;el('bottom-nav').innerHTML=output;
}
const stats=(ids,c)=>c.filter(x=>x===ids).length;
const commentsOf=postid=>comments.filter(x=>x.post_id===postid);
const likesOf=postid=>likes.filter(x=>x.post_id===postid);
const isLike=id=>likes.some(x=>x.post_id===id&&x.user_id===session.user.id);
const isFollow=id=>follows.some(x=>x.follower_id===session.user.id&&x.following_id===id);
const cardPhoto=path=>path?'<img loading="lazy" class="card-photo" src="'+safe(picture(path))+'" alt="Foto da publicação">':'';
function postCard(post){
 const author=pOf(post.author_id);
 return '<article class="post"><div class="post-head">'+avatar(author,'tiny')+'<div class="grow"><strong>'+safe(author.display_name)+'</strong><small>@'+safe(author.username)+' · '+formatDate(post.created_at)+'</small></div><button class="round-btn" data-act="post-options" data-id="'+post.id+'" aria-label="Opções">⋯</button></div>'+
 cardPhoto(post.image_path)+'<div class="post-body"><p class="simple-text">'+safe(post.caption)+'</p><div class="action-count">'+likesOf(post.id).length+' curtidas · '+commentsOf(post.id).length+' comentários</div><div class="buttonbar">'+
 '<button class="small-btn '+(isLike(post.id)?'liked':'')+'" data-act="like" data-id="'+post.id+'">'+(isLike(post.id)?'♥ Curtido':'♡ Curtir')+'</button>'+
 '<button class="small-btn" data-act="comments" data-id="'+post.id+'">▢ Comentar</button>'+
 '<button class="small-btn" data-act="share" data-id="'+post.id+'">↗ Convidar</button></div></div></article>';
}
function storiesBar(){
 const now=Date.now(),active=stories.filter(x=>new Date(x.expires_at).getTime()>now);
 const own=active.find(x=>x.author_id===session.user.id);
 const others=active.filter((x,i,a)=>x.author_id!==session.user.id&&a.findIndex(y=>y.author_id===x.author_id)===i);
 const ownCard='<button class="kora-story mine" data-act="'+(own?'story-open':'story-create')+'" data-id="'+(own?.id||'')+'" aria-label="'+(own?'Ver meu story':'Criar meu story')+'"><span class="kora-ring"><span class="klix-story-center">'+(own?avatar(me):'<span class="klix-story-plus" aria-hidden="true">+</span>')+'</span></span><b>Seu story</b></button>';
 return '<div class="kora-stories">'+ownCard+others.map(x=>{const p=pOf(x.author_id);return '<button class="kora-story" data-act="story-open" data-id="'+x.id+'"><span class="kora-ring">'+avatar(p)+'</span><b>'+safe(p.username)+'</b></button>'}).join('')+'</div>';
}
function createStory(){
 modal('Publicar story','<p class="muted">Seu story ficará visível para os membros da rede por até 24 horas.</p><form id="story-form"><label class="field"><span>Escolher foto (até 5 MB)</span><input name="photo" type="file" required accept="image/jpeg,image/png,image/webp"></label><label class="field"><span>Legenda opcional</span><input name="caption" maxlength="250" placeholder="Compartilhe seu momento..."></label><button type="submit" class="primary-btn">Publicar meu story</button></form>')
}
function openStory(storyId){
 const st=stories.find(x=>x.id===storyId);if(!st)return;
 const p=pOf(st.author_id),img=picture(st.image_path);
 modal('Story de '+p.display_name,'<div class="story-full"><img src="'+safe(img)+'" alt="Story publicado por '+safe(p.display_name)+'" loading="eager"></div><p>'+safe(st.caption||'')+'</p>'+(st.author_id===session.user.id?'<button class="small-btn" data-act="story-delete" data-id="'+st.id+'">Excluir meu story</button>':'')+'<p class="muted">Disponível até '+safe(new Date(st.expires_at).toLocaleString('pt-BR'))+'.</p>');
}
function homePage(){
 return '<div class="section-head"><h2>Stories e momentos</h2><button class="small-btn" data-act="invite">Convidar +</button></div>'+storiesBar()+
 '<div class="compose-box">'+avatar(me,'tiny')+'<button data-route="criar">O que deseja compartilhar hoje?</button></div>'+
 '<div class="kora-intro"><div><h3>Encontre, compartilhe e conecte-se.</h3><p>Seus amigos e familiares poderão aparecer aqui após se cadastrarem.</p></div><button class="small-btn" data-route="resolver">Ajudar</button></div>'+
 '<div class="section-head"><h2 class="kora-posts-heading">Publicações</h2><button class="ghost-btn" data-act="reload">Atualizar ↻</button></div>'+
 (posts.length?posts.map(postCard).join(''):empty('Ainda não há publicações','Seu feed será formado por pessoas reais. Publique a primeira foto ou convide familiares.','<button class="primary-btn" data-route="criar">Criar publicação</button>'));
}
function personRow(p){
 return '<div class="person-row">'+avatar(p)+'<div><button class="ghost-btn" data-act="open-profile" data-id="'+p.id+'">'+safe(p.display_name)+'</button><small>@'+safe(p.username)+'</small></div>'+
 (p.id===session.user.id?'<span class="user-label">Você</span>':
 '<button class="small-btn" data-act="follow" data-id="'+p.id+'">'+(isFollow(p.id)?'Seguindo':'Seguir +')+'</button><button class="round-btn" aria-label="Mensagem" data-act="chat" data-id="'+p.id+'">✉</button>')+'</div>';
}
function explorePage(){
 const list=people.filter(p=>(p.display_name+' '+p.username).toLowerCase().includes(filter.toLowerCase()));
 return '<div class="page-title"><h1>Encontre amigos</h1><button class="small-btn" data-act="invite">Convidar</button></div><p class="muted">Pessoas que já criaram uma conta no KLIX.</p>'+
 '<input class="search" id="search-people" placeholder="Pesquisar nome ou @usuário" value="'+safe(filter)+'">'+
 '<div id="people-list">'+(list.length?list.map(personRow).join(''):empty('Nenhum perfil encontrado','Convide seus amigos e familiares para entrar no KLIX.'))+'</div>';
}
function createPage(){
 return '<div class="page-title"><h1>Nova publicação</h1></div><p class="muted">O que você quer compartilhar com seus amigos?</p>'+
 '<div class="box" style="padding:18px"><form id="post-form">'+
 '<label class="field"><span>Legenda</span><textarea name="caption" minlength="1" maxlength="2200" placeholder="Escreva sobre um momento, uma ideia ou algo que deseja compartilhar..." required></textarea></label>'+
 '<label class="field"><span>Foto (opcional)</span><input type="file" accept="image/jpeg,image/png,image/webp" name="photo"><small>JPG, PNG ou WebP, até 5 MB. A imagem será pública para quem tiver o link.</small></label>'+
 '<div class="buttonbar"><button class="primary-btn" type="submit">Publicar para a comunidade</button></div></form></div>'+
 '<div class="view-notice">Publicação de vídeos curtos, stories e transmissão ao vivo serão implementadas em fases posteriores. Esta versão inicial aceita texto e fotos reais.</div>';
}
function profilePage(){
 const p=currentProfile==='me'?me:pOf(currentProfile),mine=posts.filter(x=>x.author_id===p.id);
 const followerCount=follows.filter(x=>x.following_id===p.id).length,followingCount=follows.filter(x=>x.follower_id===p.id).length;
 return '<div class="kora-profile"><div class="page-title"><h1>@'+safe(p.username)+'</h1></div>'+
 '<div class="profile-head">'+avatar(p,'big')+'<div class="stats-row"><div class="counter">'+mine.length+'<span>publicações</span></div><div class="counter">'+followerCount+'<span>seguidores</span></div><div class="counter">'+followingCount+'<span>seguindo</span></div></div></div>'+
 '<div class="profile-bio"><strong>'+safe(p.display_name)+'</strong><p class="bio">'+safe(p.bio||'Compartilhando meus momentos na KLIX.')+'</p></div>'+
 '<div class="profile-actions">'+(p.id===session.user.id?'<button class="small-btn" data-act="edit-profile">Editar perfil</button><button class="small-btn" data-act="signout">Sair</button>':
 '<button class="small-btn" data-act="follow" data-id="'+p.id+'">'+(isFollow(p.id)?'Deixar de seguir':'Seguir')+'</button><button class="small-btn" data-act="chat" data-id="'+p.id+'">Mensagem</button>')+'</div>'+
 '<h2 style="margin-top:28px">Publicações</h2>'+
 (mine.length?'<div class="kora-grid">'+mine.map(x=>'<button class="kora-tile" data-act="post-open" data-id="'+x.id+'" aria-label="Abrir publicação">'+(x.image_path?'<img alt="" src="'+safe(picture(x.image_path))+'">':'<span class="no-image">✦</span>')+'</button>').join('')+'</div>':
 empty('Sem publicações ainda','O perfil será preenchido pelas fotos e textos que essa pessoa publicar.'))+'</div>';
}
function requestCard(r){
 const author=pOf(r.author_id),count=answers.filter(x=>x.request_id===r.id).length;
 return '<div class="request"><div class="request-head"><b>'+safe(r.title)+'</b><span class="status '+(r.status==='resolved'?'done':'')+'">'+(r.status==='resolved'?'Resolvido':'Aberto')+'</span></div>'+
 '<div class="meta">Por '+safe(author.display_name)+' · '+safe(r.category)+' · '+formatDate(r.created_at)+'</div><p>'+safe(r.description)+'</p>'+
 '<div class="buttonbar"><button class="small-btn" data-act="help-answers" data-id="'+r.id+'">'+count+' respostas · Participar</button>'+
 (r.author_id===session.user.id&&r.status!=='resolved'?'<button class="small-btn" data-act="help-resolve" data-id="'+r.id+'">Marcar resolvido</button>':'')+'</div></div>';
}
function resolvePage(){
 return '<div class="glass-card"><span class="eyebrow">KLIX A CHAVE</span><h1>Um lugar para se ajudar.</h1><p>Faça perguntas, compartilhe dicas e conecte-se com quem pode contribuir.</p><button class="primary-btn orange-btn" data-act="new-help">+ Pedir ajuda</button></div>'+
 '<h2 style="margin-top:24px">Pedidos da comunidade</h2>'+
 (requests.length?requests.map(requestCard).join(''):empty('Nenhum pedido ainda','Você pode iniciar a comunidade de ajuda.','<button class="small-btn" data-act="new-help">Criar pedido</button>'));
}
function videosPage(){
 return '<div class="page-title"><h1>Vídeos</h1></div>'+
 '<div class="kora-intro" style="display:block;text-align:center;padding:35px 20px"><span style="font-size:45px">▷</span><h2>Vídeos da comunidade</h2>'+
 '<p>Este espaço receberá vídeos curtos de pessoas cadastradas. O envio e a reprodução de vídeos ainda não foram ativados; nenhuma publicação fictícia será exibida.</p>'+
 '<button class="primary-btn" data-route="criar">Publicar foto ou texto</button></div>';
}
function render(){
 if(!session){renderAuth();return}
 el('app').classList.add('authenticated');renderNav();
 el('view').innerHTML=route==='inicio'?homePage():route==='explorar'?explorePage():route==='criar'?createPage():route==='resolver'?resolvePage():route==='videos'?videosPage():profilePage();
}
function go(r){route=r;render();window.scrollTo({top:0,behavior:'instant'})}
async function fetchCollection(table,q){
 let query=sb.from(table).select('*');if(q)query=q(query);
 const {data,error}=await query;if(error)throw new Error(table+': '+error.message);return data||[];
}
async function refresh(){
 if(!session)return;
 el('view').innerHTML='<div class="center-loader">Carregando a comunidade...</div>';
 try{
 const all=await Promise.all([
 fetchCollection('profiles',q=>q.limit(300)),
 fetchCollection('posts',q=>q.order('created_at',{ascending:false}).limit(80)),
 fetchCollection('likes',q=>q.limit(2000)),
 fetchCollection('comments',q=>q.order('created_at',{ascending:true}).limit(2000)),
 fetchCollection('follows',q=>q.limit(2000)),
 fetchCollection('help_requests',q=>q.order('created_at',{ascending:false}).limit(80)),
 fetchCollection('help_answers',q=>q.order('created_at',{ascending:true}).limit(1500)),
 fetchCollection('direct_messages',q=>q.order('created_at',{ascending:true}).limit(1000)),
 fetchCollection('stories',q=>q.gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(100)),
 ]);
 [people,posts,likes,comments,follows,requests,answers,messages,stories]=all;
 me=people.find(x=>x.id===session.user.id);
 if(!me)throw new Error('Seu perfil ainda não foi criado. Entre novamente ou procure suporte.');
 lastError='';render();
 }catch(err){lastError=fallbackError(err);el('view').innerHTML='<div class="view-notice"><b>Não foi possível carregar os dados.</b><p>'+safe(lastError)+'</p><button class="primary-btn" data-act="reload">Tentar novamente</button></div>'}
}
async function ensureSession(){
 const {data,error}=await sb.auth.getSession();
 if(error){notice=error.message;renderAuth();return}
 session=data.session; if(session)await refresh();else renderAuth();
}
async function processAuth(form){
 const email=form.elements.email.value.trim().toLowerCase(),password=form.elements.password.value,displayName=form.elements.display_name?.value.trim();
 if(authMode==='signup'&&displayName?.length<2)return toast('Informe seu nome com pelo menos 2 caracteres.');
 busyUI(true);
 try{
 let r;
 if(authMode==='signup')r=await sb.auth.signUp({email,password,options:{data:{display_name:displayName},emailRedirectTo:BASE}});
 else r=await sb.auth.signInWithPassword({email,password});
 if(r.error)throw r.error;
 if(authMode==='signup'&&!r.data.session){authMode='login';notice='Cadastro solicitado. Verifique seu e-mail e confirme a conta pelo link de ativação. Depois, entre com sua senha.';renderAuth();return}
 session=r.data.session||null;if(session){route='inicio';await refresh();toast('Bem-vindo ao KLIX!')}else renderAuth();
 }catch(err){notice=fallbackError(err);renderAuth()}finally{busyUI(false)}
}
async function action(q){if(busy)return;busy=true;try{await q();}catch(err){toast(fallbackError(err))}finally{busy=false}}
function editProfile(){
 const current=me.avatar_path?picture(me.avatar_path):'';
 modal('Editar perfil',
 '<form id="profile-form">'+
 '<div class="klix-photo-editor"><div class="klix-photo-preview">'+
 (current?'<img id="avatar-preview" src="'+safe(current)+'" alt="Sua foto atual" onerror="this.remove()">':
 '<span id="avatar-placeholder">'+safe((me.display_name||'K').slice(0,1).toUpperCase())+'</span><img id="avatar-preview" alt="Nova foto selecionada" hidden>')+
 '</div><label class="klix-photo-pick" for="profile-photo">📷 Alterar foto do perfil</label>'+
 '<input id="profile-photo" name="avatar_file" type="file" accept="image/*" aria-label="Selecionar foto do perfil">'+
 '<p class="muted">Escolha uma imagem de até 20 MB. Ela será recortada e reduzida para foto de perfil. A foto ficará visível para outros membros.</p></div>'+
 '<label class="field"><span>Nome</span><input name="display_name" maxlength="70" minlength="2" required value="'+safe(me.display_name)+'"></label>'+
 '<label class="field"><span>Nome de usuário</span><input name="username" pattern="[a-z][a-z0-9_.]{2,23}" minlength="3" maxlength="24" required value="'+safe(me.username)+'"></label>'+
 '<label class="field"><span>Bio</span><textarea name="bio" maxlength="220">'+safe(me.bio||'')+'</textarea></label>'+
 '<div class="modal-footer"><button type="submit" class="primary-btn">Salvar alterações</button></div></form>');
}
function compressProfilePhoto(file){
 return new Promise((resolve,reject)=>{
  if(!file || !file.type.startsWith('image/')){reject(new Error('Selecione uma imagem válida.'));return}
  if(file.size>20*1024*1024){reject(new Error('A foto deve ter até 20 MB.'));return}
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{
   URL.revokeObjectURL(url);
   try{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Seu navegador não conseguiu preparar a foto.');
    const side=Math.min(img.naturalWidth,img.naturalHeight);
    ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,512,512);
    canvas.toBlob(blob=>blob&&blob.size<=5242880?resolve(blob):reject(new Error('Não foi possível reduzir essa foto.')),'image/jpeg',0.82);
   }catch(err){reject(err)}
  };
  img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Não foi possível abrir a imagem escolhida no navegador.'))};
  img.src=url;
 });
}
function commentsDialog(postid){
 const p=posts.find(x=>x.id===postid);if(!p)return;
 const c=commentsOf(postid);
 modal('Comentários','<p class="muted">'+safe(p.caption)+'</p><div class="comment-list">'+(c.length?c.map(x=>'<div class="comment"><b>'+safe(pOf(x.author_id).display_name)+'</b> · '+safe(x.body)+'</div>').join(''):empty('Nenhum comentário ainda','Seja o primeiro a comentar.'))+'</div><form id="comment-form" data-id="'+postid+'" class="inline-form"><input name="body" maxlength="800" minlength="1" required placeholder="Comente..."><button type="submit" class="primary-btn">Enviar</button></form>');
}
function helpDialog(rid){
 const r=requests.find(x=>x.id===rid);if(!r)return;
 const list=answers.filter(x=>x.request_id===rid);
 modal(r.title,'<p>'+safe(r.description)+'</p><h3>Respostas da comunidade</h3><div class="comment-list">'+(list.length?list.map(x=>'<div class="comment"><b>'+safe(pOf(x.author_id).display_name)+'</b><p>'+safe(x.body)+'</p></div>').join(''):empty('Nenhuma resposta ainda','Compartilhe uma orientação útil.'))+'</div>'+
 (r.status==='open'?'<form id="answer-form" data-id="'+rid+'"><label class="field"><span>Sua resposta</span><textarea name="body" minlength="2" maxlength="1500" required placeholder="Escreva uma orientação..."></textarea></label><button type="submit" class="primary-btn">Enviar resposta</button></form>':'<p class="muted">Pedido resolvido.</p>'));
}
function newHelp(){modal('Pedir ajuda','<form id="help-form"><label class="field"><span>Título</span><input name="title" required minlength="5" maxlength="120"></label><label class="field"><span>Categoria</span><select name="category"><option>Comunidade</option><option>Trabalho</option><option>Serviços</option><option>Aprendizagem</option><option>Empreendedorismo</option></select></label><label class="field"><span>Descrição</span><textarea name="description" minlength="10" maxlength="2500" required></textarea></label><button type="submit" class="primary-btn">Publicar pedido</button></form>')}
function openInbox(){const friends=people.filter(p=>p.id!==session.user.id);modal('Mensagens','<p class="muted">Converse em particular com membros da comunidade.</p>'+friends.map(p=>'<div class="person-row">'+avatar(p,'tiny')+'<div><b>'+safe(p.display_name)+'</b><small>@'+safe(p.username)+'</small></div><button class="small-btn" data-act="chat" data-id="'+p.id+'">Conversar</button></div>').join(''))}
function chatWith(userId){
 const p=pOf(userId),m=messages.filter(x=>(x.sender_id===session.user.id&&x.recipient_id===userId)||(x.recipient_id===session.user.id&&x.sender_id===userId));
 currentChat=userId;
 modal('Conversa com '+p.display_name,'<p class="muted">Mensagens privadas entre vocês.</p><div class="message-area">'+(m.length?m.map(x=>'<div class="bubble '+(x.sender_id===session.user.id?'':'them')+'">'+safe(x.body)+'</div>').join(''):empty('Comece a conversa','Envie uma mensagem para criar conexão.'))+'</div><form id="message-form" data-id="'+userId+'" class="inline-form"><input name="body" maxlength="1200" minlength="1" required placeholder="Escreva sua mensagem"><button type="submit" class="primary-btn">Enviar</button></form>');
}
async function invite(){
 const u=BASE;
 if(navigator.share){try{await navigator.share({title:'Entre para o KLIX!',text:'Vamos nos conectar no KLIX — nossa nova rede social.',url:u});return}catch{}}
 try{await navigator.clipboard.writeText(u);toast('Link de convite copiado!')}catch{modal('Convidar amigos','<p>Compartilhe este link:</p><p class="simple-text">'+safe(u)+'</p>')}
}
function postOptions(id){
 const p=posts.find(x=>x.id===id);if(!p)return;
 modal('Publicação',p.author_id===session.user.id?
 '<p>Excluir sua publicação?</p><button class="small-btn danger" data-act="delete-post" data-id="'+id+'">Excluir</button>':
 '<p>Se encontrar conteúdo inadequado, envie uma denúncia à moderação.</p><form id="report-form" data-id="'+id+'"><label class="field"><span>Motivo</span><textarea name="reason" minlength="5" maxlength="500" required></textarea></label><button type="submit" class="primary-btn">Denunciar</button></form>');
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act],[data-route]');if(!b)return;
 if(b.dataset.route){if(b.dataset.route==='perfil')currentProfile='me';go(b.dataset.route);return}
 const a=b.dataset.act,id=b.dataset.id;
 switch(a){
 case 'close':closeModal();break;
 case 'notifications':modal('Atividade','<p class="muted">Aqui estarão as novidades de seguidores, curtidas e comentários quando a função de notificações for ativada.</p>');break;
 case 'story-create':createStory();break;
 case 'story-open':openStory(id);break;
 case 'post-open':{const p=posts.find(x=>x.id===id);if(p)modal('Publicação',postCard(p));break;}
 case 'story-delete':if(confirm('Excluir seu story?'))action(async()=>{const t=await sb.from('stories').delete().eq('id',id).eq('author_id',session.user.id);if(t.error)throw t.error;closeModal();await refresh();});break;
 case 'mode':authMode=id;notice='';renderAuth();break;
 case 'reload':refresh();break;
 case 'search':go('explorar');el('search-people')?.focus();break;
 case 'inbox':openInbox();break;
 case 'invite':invite();break;
 case 'edit-profile':editProfile();break;
 case 'chat':chatWith(id);break;
 case 'new-help':newHelp();break;
 case 'help-answers':helpDialog(id);break;
 case 'post-options':postOptions(id);break;
 case 'comments':commentsDialog(id);break;
 case 'open-profile':currentProfile=id;go('perfil');break;
 case 'like':action(async()=>{
 const own=likes.some(x=>x.post_id===id&&x.user_id===session.user.id);
 const r=own?await sb.from('likes').delete().eq('post_id',id).eq('user_id',session.user.id):await sb.from('likes').insert({post_id:id,user_id:session.user.id});
 if(r.error)throw r.error;await refresh();
 });break;
 case 'follow':action(async()=>{
 const own=isFollow(id);
 const r=own?await sb.from('follows').delete().eq('follower_id',session.user.id).eq('following_id',id):await sb.from('follows').insert({follower_id:session.user.id,following_id:id});
 if(r.error)throw r.error;await refresh();
 });break;
 case 'help-resolve':action(async()=>{
 const r=await sb.from('help_requests').update({status:'resolved'}).eq('id',id).eq('author_id',session.user.id);if(r.error)throw r.error;await refresh();
 });break;
 case 'delete-post':if(confirm('Excluir esta publicação definitivamente?'))action(async()=>{
 const r=await sb.from('posts').delete().eq('id',id).eq('author_id',session.user.id);if(r.error)throw r.error;closeModal();await refresh();
 });break;
 case 'share':invite();break;
 case 'signout':action(async()=>{const r=await sb.auth.signOut();if(r.error)throw r.error;session=null;me=null;closeModal();renderAuth();toast('Você saiu da conta.')});break;
 }
});
document.addEventListener('change',e=>{
 if(e.target?.id!=='profile-photo')return;
 const file=e.target.files?.[0];if(!file)return;
 if(!file.type.startsWith('image/')||file.size>20*1024*1024){toast('Escolha uma foto de até 20 MB.');e.target.value='';return}
 const preview=el('avatar-preview');if(!preview)return;
 const objectUrl=URL.createObjectURL(file);
 preview.onload=()=>URL.revokeObjectURL(objectUrl);
 preview.onerror=()=>{URL.revokeObjectURL(objectUrl);preview.hidden=true;toast('Não foi possível visualizar essa imagem.')};
 preview.src=objectUrl;preview.hidden=false;
 const ph=el('avatar-placeholder');if(ph)ph.hidden=true;
});
document.addEventListener('input',e=>{
 if(e.target.id==='search-people'){filter=e.target.value.toLowerCase();el('people-list').innerHTML=people.filter(p=>(p.display_name+' '+p.username).toLowerCase().includes(filter)).map(personRow).join('')||empty('Nenhuma pessoa encontrada','Tente outro nome ou convide seus amigos.')}
});
document.addEventListener('submit',async e=>{
 const f=e.target;if(!f?.id)return;e.preventDefault();if(busy)return;
 if(f.id==='auth-form'){await processAuth(f);return}
 if(f.id==='reset-form'){await action(async()=>{const email=f.elements.email.value.trim();const r=await sb.auth.resetPasswordForEmail(email,{redirectTo:BASE});if(r.error)throw r.error;notice='Se o e-mail estiver cadastrado, enviaremos orientações de recuperação.';authMode='login';renderAuth()});return}
 await action(async()=>{
 const val=name=>f.elements[name]?.value?.trim()||'';
 let result;
 if(f.id==='story-form'){
 const photo=f.elements.photo.files?.[0];
 if(!photo||!['image/jpeg','image/png','image/webp'].includes(photo.type)||photo.size>5242880)throw new Error('Escolha uma foto JPG, PNG ou WebP com até 5 MB.');
 const ext=photo.type==='image/jpeg'?'jpg':photo.type.split('/')[1];
 const image_path=session.user.id+'/'+crypto.randomUUID()+'.'+ext;
 const up=await sb.storage.from('vira-media').upload(image_path,photo,{contentType:photo.type,upsert:false});
 if(up.error)throw up.error;
 result=await sb.from('stories').insert({author_id:session.user.id,image_path,caption:val('caption')});
 if(result.error){await sb.storage.from('vira-media').remove([image_path]);throw result.error}
 go('inicio');
 }else if(f.id==='post-form'){
 const photo=f.elements.photo.files?.[0];let image_path=null;
 if(photo){
 if(!['image/jpeg','image/png','image/webp'].includes(photo.type)||photo.size>5242880)throw new Error('Use foto JPG, PNG ou WebP de até 5 MB.');
 const ext=photo.type.split('/')[1]==='jpeg'?'jpg':photo.type.split('/')[1];
 image_path=session.user.id+'/'+crypto.randomUUID()+'.'+ext;
 const up=await sb.storage.from('vira-media').upload(image_path,photo,{contentType:photo.type,upsert:false});
 if(up.error)throw up.error;
 }
 result=await sb.from('posts').insert({author_id:session.user.id,caption:val('caption'),image_path});
 if(result.error){if(image_path)await sb.storage.from('vira-media').remove([image_path]);throw result.error}
 go('inicio');
 }else if(f.id==='profile-form'){
 const selected=f.elements.namedItem('avatar_file')?.files?.[0];
 let nextPath=null;
 if(selected){
   const jpeg=await compressProfilePhoto(selected);
   nextPath=session.user.id+'/avatars/'+crypto.randomUUID()+'.jpg';
   const upload=await sb.storage.from('vira-media').upload(nextPath,jpeg,{contentType:'image/jpeg',cacheControl:'3600',upsert:false});
   if(upload.error)throw upload.error;
 }
 const changes={display_name:val('display_name'),username:val('username').toLowerCase(),bio:val('bio')};
 if(nextPath)changes.avatar_path=nextPath;
 result=await sb.from('profiles').update(changes).eq('id',session.user.id).select('id,avatar_path').single();
 if(result.error){if(nextPath)await sb.storage.from('vira-media').remove([nextPath]);throw result.error}
 if(nextPath&&me.avatar_path&&me.avatar_path!==nextPath&&me.avatar_path.startsWith(session.user.id+'/avatars/')){
   // Cleaning the previous photo is best-effort; never roll back the saved profile for cleanup failure.
   await sb.storage.from('vira-media').remove([me.avatar_path]).catch(()=>{});
 }
 }else if(f.id==='comment-form'){
 result=await sb.from('comments').insert({post_id:f.dataset.id,author_id:session.user.id,body:val('body')});
 }else if(f.id==='help-form'){
 result=await sb.from('help_requests').insert({author_id:session.user.id,title:val('title'),category:val('category'),description:val('description')});go('resolver');
 }else if(f.id==='answer-form'){
 result=await sb.from('help_answers').insert({request_id:f.dataset.id,author_id:session.user.id,body:val('body')});
 }else if(f.id==='message-form'){
 result=await sb.from('direct_messages').insert({sender_id:session.user.id,recipient_id:f.dataset.id,body:val('body')});
 }else if(f.id==='report-form'){
 result=await sb.from('reports').insert({reporter_id:session.user.id,post_id:f.dataset.id,reason:val('reason')});
 }else if(f.id==='password-update-form'){
 if(val('new_password').length<8)throw new Error('Use senha com pelo menos 8 caracteres.');
 result=await sb.auth.updateUser({password:val('new_password')});
 }
 if(result?.error)throw result.error;
 const fid=f.id,target=f.dataset.id;
 closeModal();
 await refresh();
 if(fid==='message-form')chatWith(target);
 if(fid==='comment-form')commentsDialog(target);
 if(fid==='answer-form')helpDialog(target);
 toast(fid==='report-form'?'Denúncia registrada.':'Salvo no KLIX.');
 });
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
async function init(){
 if(!initStatus()){statusPage();return}
 if(!window.supabase?.createClient){statusPage();toast('Biblioteca de conexão indisponível. Tente recarregar.');return}
 sb=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 await ensureSession();
 sb.auth.onAuthStateChange((event,newSession)=>{
   if(event==='SIGNED_OUT'){session=null;me=null;renderAuth()}
   else if(event==='SIGNED_IN'&&newSession&&!session){session=newSession;setTimeout(()=>refresh(),30)}
   else if(event==='PASSWORD_RECOVERY'){session=newSession;modal('Redefinir minha senha','<form id="password-update-form"><label class="field"><span>Nova senha</span><input type="password" name="new_password" minlength="8" required autocomplete="new-password"></label><button class="primary-btn" type="submit">Atualizar senha</button></form>')}
 });
}
init().catch(err=>{lastError=fallbackError(err);statusPage();toast('Falha ao iniciar: '+lastError)});
