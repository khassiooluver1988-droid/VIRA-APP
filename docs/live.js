'use strict';
/* VIRA Social — beta real. Os dados são persistidos apenas no Supabase do VIRA.
 * Não há conta demonstrativa e não há simulação de publicações.
 */
const cfg = window.VIRA_CONFIG || {};
const BASE = location.href.split('#')[0].split('?')[0];
let sb = null, session = null, me = null, route = 'inicio', busy = false, authMode = 'login', notice = '';
let people=[],posts=[],likes=[],comments=[],follows=[],requests=[],answers=[],messages=[];
let currentProfile='me', currentChat=null, filter='',lastError='';
const el = id => document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
const formatDate=v=>{try{return new Date(v).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}catch{return ''}};
const toast=text=>{const n=el('toast');n.textContent=text;n.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>n.classList.remove('show'),5000)};
const busyUI=flag=>{busy=flag;document.querySelectorAll('button[type="submit"]').forEach(x=>x.disabled=flag)};
const fallbackError=e=>String(e?.message||e||'Erro inesperado');
const nav=[['inicio','⌂','Início'],['explorar','◇','Pessoas'],['criar','＋','Criar'],['resolver','✓','Resolver'],['perfil','♙','Perfil']];
const empty=(heading,description,action='')=>'<div class="empty-state"><b>'+safe(heading)+'</b><p>'+safe(description)+'</p>'+action+'</div>';
const pOf=id=>people.find(x=>x.id===id)||{id,display_name:'Usuário VIRA',username:'membro',bio:''};
const avatar=(p,cls='')=>'<div class="avatar '+cls+'">'+safe((p.display_name||'V').trim().charAt(0).toUpperCase())+'</div>';
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
 el('view').innerHTML='<div class="auth-shell"><div class="auth-logo"><img src="./assets/branding/vira-original.webp" alt="VIRA"></div>'+
 '<div class="auth-panel"><h1 class="auth-title">VIRA Social</h1><div class="view-notice"><b>Ativação do cadastro pendente.</b><p class="muted-block">A interface já está preparada. Para criar contas de verdade, o projeto exclusivo do VIRA precisa ser criado no Supabase e conectado com uma chave pública.</p></div><p class="muted">Nenhuma conta será simulada. Quando a integração estiver ativa, esta tela dará lugar a Entrar e Criar conta.</p></div></div>';
}
function renderAuth(){
 el('app').classList.remove('authenticated');
 el('bottom-nav').innerHTML='';
 el('view').innerHTML='<div class="auth-shell"><div class="auth-logo"><img src="./assets/branding/vira-original.webp" alt="VIRA — Assista, Conecte-se, Resolva"></div>'+
 '<div class="auth-panel"><h1 class="auth-title">Entre para a comunidade VIRA</h1>'+
 '<p style="text-align:center" class="muted-block">Encontre amigos, compartilhe momentos e faça novas conexões.</p>'+
 '<div class="auth-toggle"><button class="chip '+(authMode==='login'?'active':'')+'" data-act="mode" data-id="login">Entrar</button><button class="chip '+(authMode==='signup'?'active':'')+'" data-act="mode" data-id="signup">Criar conta</button></div>'+
 (authMode==='reset'?'<form id="reset-form"><label class="auth-field"><span>Seu e-mail</span><input type="email" name="email" required autocomplete="email" placeholder="voce@exemplo.com"></label><button class="primary-btn" type="submit">Enviar link de recuperação</button><p class="auth-help"><button class="ghost-btn" data-act="mode" data-id="login">Voltar</button></p></form>':
 '<form id="auth-form">'+(authMode==='signup'?'<label class="auth-field"><span>Seu nome</span><input name="display_name" minlength="2" maxlength="70" required autocomplete="name" placeholder="Como quer ser chamado?"></label>':'')+
 '<label class="auth-field"><span>E-mail</span><input name="email" required type="email" autocomplete="email" placeholder="voce@exemplo.com"></label>'+
 '<label class="auth-field"><span>Senha</span><input name="password" type="password" minlength="8" required autocomplete="'+(authMode==='signup'?'new-password':'current-password')+'" placeholder="Mínimo de 8 caracteres"></label>'+
 '<button type="submit" class="primary-btn" style="width:100%">'+(authMode==='signup'?'Criar minha conta':'Entrar no VIRA')+'</button></form>'+
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
function homePage(){
 return '<div class="section-head"><div><div class="eyebrow">SUA COMUNIDADE</div><h1>Novidades do VIRA</h1></div><button class="small-btn" data-act="reload">Atualizar ↻</button></div>'+
 '<div class="compose-box">'+avatar(me,'tiny')+'<button data-route="criar">Compartilhe algo com seus amigos...</button></div>'+
 '<div class="glass-card"><div class="eyebrow">BEM-VINDO À REDE</div><h2>Amizades, momentos e soluções.</h2><p>Convide quem você gosta, publique fotos, siga pessoas e participe da comunidade.</p><button class="primary-btn orange-btn" data-act="invite">Convidar amigos</button></div>'+
 '<h2 style="margin-top:20px">Publicações recentes</h2>'+
 (posts.length?posts.map(postCard).join(''):empty('Seu feed está começando','Convide amigos para criar as primeiras publicações.','<button class="primary-btn" data-route="criar">Criar primeira publicação</button>'));
}
function personRow(p){
 return '<div class="person-row">'+avatar(p)+'<div><button class="ghost-btn" data-act="open-profile" data-id="'+p.id+'">'+safe(p.display_name)+'</button><small>@'+safe(p.username)+'</small></div>'+
 (p.id===session.user.id?'<span class="user-label">Você</span>':
 '<button class="small-btn" data-act="follow" data-id="'+p.id+'">'+(isFollow(p.id)?'Seguindo':'Seguir +')+'</button><button class="round-btn" aria-label="Mensagem" data-act="chat" data-id="'+p.id+'">✉</button>')+'</div>';
}
function explorePage(){
 const list=people.filter(p=>(p.display_name+' '+p.username).toLowerCase().includes(filter.toLowerCase()));
 return '<div class="page-title"><h1>Encontre amigos</h1><button class="small-btn" data-act="invite">Convidar</button></div><p class="muted">Pessoas que já criaram uma conta no VIRA.</p>'+
 '<input class="search" id="search-people" placeholder="Pesquisar nome ou @usuário" value="'+safe(filter)+'">'+
 '<div id="people-list">'+(list.length?list.map(personRow).join(''):empty('Nenhum perfil encontrado','Convide seus amigos e familiares para entrar no VIRA.'))+'</div>';
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
 const p=currentProfile==='me'?me:pOf(currentProfile),mine=posts.filter(x=>x.author_id===p.id),followerCount=follows.filter(x=>x.following_id===p.id).length,followingCount=follows.filter(x=>x.follower_id===p.id).length;
 return '<div class="profile-cover"></div><div class="profile-body"><div class="profile-head">'+avatar(p,'big')+
 '<div><h1 style="margin:0">'+safe(p.display_name)+'</h1><p style="margin:0" class="muted">@'+safe(p.username)+'</p></div></div>'+
 '<p style="margin-top:18px" class="bio">'+safe(p.bio||'Novo integrante da comunidade VIRA.')+'</p>'+
 '<div class="stat-line"><span><b>'+mine.length+'</b><small>Publicações</small></span><span><b>'+followerCount+'</b><small>Seguidores</small></span><span><b>'+followingCount+'</b><small>Seguindo</small></span></div>'+
 '<div class="buttonbar">'+(p.id===session.user.id?'<button class="small-btn" data-act="edit-profile">Editar perfil</button><button class="small-btn" data-act="signout">Sair</button>':
 '<button class="small-btn" data-act="follow" data-id="'+p.id+'">'+(isFollow(p.id)?'Deixar de seguir':'Seguir')+'</button><button class="small-btn" data-act="chat" data-id="'+p.id+'">Mensagem</button>')+'</div></div>'+
 '<h2 style="margin-top:24px">Publicações de '+safe(p.display_name)+'</h2>'+
 (mine.length?mine.map(postCard).join(''):empty('Sem publicações','Nenhuma publicação neste perfil ainda.'));}
function requestCard(r){
 const author=pOf(r.author_id),count=answers.filter(x=>x.request_id===r.id).length;
 return '<div class="request"><div class="request-head"><b>'+safe(r.title)+'</b><span class="status '+(r.status==='resolved'?'done':'')+'">'+(r.status==='resolved'?'Resolvido':'Aberto')+'</span></div>'+
 '<div class="meta">Por '+safe(author.display_name)+' · '+safe(r.category)+' · '+formatDate(r.created_at)+'</div><p>'+safe(r.description)+'</p>'+
 '<div class="buttonbar"><button class="small-btn" data-act="help-answers" data-id="'+r.id+'">'+count+' respostas · Participar</button>'+
 (r.author_id===session.user.id&&r.status!=='resolved'?'<button class="small-btn" data-act="help-resolve" data-id="'+r.id+'">Marcar resolvido</button>':'')+'</div></div>';
}
function resolvePage(){
 return '<div class="glass-card"><span class="eyebrow">VIRA A CHAVE</span><h1>Um lugar para se ajudar.</h1><p>Faça perguntas, compartilhe dicas e conecte-se com quem pode contribuir.</p><button class="primary-btn orange-btn" data-act="new-help">+ Pedir ajuda</button></div>'+
 '<h2 style="margin-top:24px">Pedidos da comunidade</h2>'+
 (requests.length?requests.map(requestCard).join(''):empty('Nenhum pedido ainda','Você pode iniciar a comunidade de ajuda.','<button class="small-btn" data-act="new-help">Criar pedido</button>'));
}
function render(){
 if(!session){renderAuth();return}
 el('app').classList.add('authenticated');renderNav();
 el('view').innerHTML=route==='inicio'?homePage():route==='explorar'?explorePage():route==='criar'?createPage():route==='resolver'?resolvePage():profilePage();
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
 ]);
 [people,posts,likes,comments,follows,requests,answers,messages]=all;
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
 session=r.data.session||null;if(session){route='inicio';await refresh();toast('Bem-vindo ao VIRA!')}else renderAuth();
 }catch(err){notice=fallbackError(err);renderAuth()}finally{busyUI(false)}
}
async function action(q){if(busy)return;busy=true;try{await q();}catch(err){toast(fallbackError(err))}finally{busy=false}}
function editProfile(){
 modal('Editar perfil','<form id="profile-form"><label class="field"><span>Nome</span><input name="display_name" maxlength="70" minlength="2" required value="'+safe(me.display_name)+'"></label><label class="field"><span>Usuário (letras minúsculas, números, _ e .)</span><input name="username" pattern="[a-z][a-z0-9_.]{2,23}" minlength="3" maxlength="24" required value="'+safe(me.username)+'"></label><label class="field"><span>Bio</span><textarea name="bio" maxlength="220">'+safe(me.bio)+'</textarea></label><div class="modal-footer"><button type="submit" class="primary-btn">Salvar perfil</button></div></form>');
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
 if(navigator.share){try{await navigator.share({title:'Entre para o VIRA!',text:'Vamos nos conectar no VIRA — nossa nova rede social.',url:u});return}catch{}}
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
 if(b.dataset.route){go(b.dataset.route);return}
 const a=b.dataset.act,id=b.dataset.id;
 switch(a){
 case 'close':closeModal();break;
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
 if(f.id==='post-form'){
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
 result=await sb.from('profiles').update({display_name:val('display_name'),username:val('username').toLowerCase(),bio:val('bio')}).eq('id',session.user.id);
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
 toast(fid==='report-form'?'Denúncia registrada.':'Salvo no VIRA.');
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
