const assert = require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('docs/index.html','utf8');
const js=fs.readFileSync('docs/live.js','utf8');
const uid='3aa5828f-e919-41c7-b8b0-d38561fa2121';
const user={id:uid,username:'pessoa_klix',display_name:'Pessoa KLIX',bio:'Minha bio',avatar_path:null};
const data={profiles:[user],posts:[],likes:[],comments:[],follows:[],help_requests:[],help_answers:[],direct_messages:[],stories:[]};
const uploads=[];
const storage={upload:async(path,blob,opts)=>{uploads.push({path,blob,opts});return {data:{path},error:null}},remove:async(paths)=>({data:paths,error:null}),getPublicUrl:path=>({data:{publicUrl:'https://my-project.supabase.co/storage/v1/object/public/vira-media/'+path}})};
function from(table){
 const q={select(){return this},order(){return this},limit(){return this},gt(){return this},eq(){return this},
  update(changes){assert.equal(table,'profiles');return {eq(field,value){assert.equal(field,'id');assert.equal(value,uid);return {select(){return {single:async()=>{Object.assign(user,changes);return {data:{id:uid,avatar_path:user.avatar_path},error:null}}}}}}}},
  then(resolve,reject){return Promise.resolve({data:data[table]||[],error:null}).then(resolve,reject)}};
 return q;
}
const client={auth:{getSession:async()=>({data:{session:{user:{id:uid}}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from,storage:{from:()=>storage}};
const dom=new JSDOM(html,{url:'https://example.org/VIRA-APP/',pretendToBeVisual:true,runScripts:'outside-only'});
const w=dom.window,d=w.document;w.scrollTo=()=>{};w.VIRA_CONFIG={url:'https://abcdeabcdeabcdeabcde.supabase.co',publishableKey:'sb_publishable_test'};
w.supabase={createClient:()=>client};
w.URL.createObjectURL=()=> 'blob:fake-image';
w.URL.revokeObjectURL=()=>{};
w.Image=class { naturalWidth=1500; naturalHeight=1000; set src(v){setTimeout(()=>this.onload?.(),0)} };
w.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){}});
w.HTMLCanvasElement.prototype.toBlob=(cb)=>cb(new w.Blob(['jpeg test contents'],{type:'image/jpeg'}));
w.eval(js);
(async()=>{
 await new Promise(r=>setTimeout(r,70));
 assert.match(d.querySelector('#view').textContent,/Stories e momentos/);
 assert.equal(d.querySelector('.klix-story-plus').textContent,'+');
 d.querySelector('[data-route="perfil"]').click();
 d.querySelector('[data-act="edit-profile"]').click();
 const form=d.querySelector('#profile-form');
 assert.ok(form,'Editar perfil deve abrir');
 const fileInput=form.querySelector('input[name="avatar_file"]');
 assert.ok(fileInput,'Selecionar foto deve aparecer');
 Object.defineProperty(fileInput,'files',{configurable:true,value:[new w.File(['sample'],'photo.png',{type:'image/png'})]});
 form.querySelector('[name="display_name"]').value='Pessoa KLIX Atualizada';
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 await new Promise(r=>setTimeout(r,180));
 assert.equal(uploads.length,1,'O arquivo deve ser enviado ao storage');
 assert.ok(uploads[0].path.startsWith(uid+'/avatars/'));
 assert.equal(uploads[0].opts.contentType,'image/jpeg','Imagem convertida para JPEG');
 assert.equal(user.display_name,'Pessoa KLIX Atualizada');
 assert.equal(user.avatar_path,uploads[0].path);
 assert.equal(d.querySelectorAll('#view .avatar-photo').length>0,true,'Avatar atualizado no perfil');
 console.log('PASSOU: página autenticada, adicionar story centrado, editor de perfil, conversão de foto, upload por pasta privada de escrita e renderização do avatar.');
 dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
