const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const html = fs.readFileSync('docs/index-live.html','utf8');
const source = fs.readFileSync('docs/live.js','utf8');
assert.match(html, /KLIX/);
assert.match(source, /auth\.signUp/);
assert.match(source, /auth\.signInWithPassword/);
assert.match(source, /from\('posts'\)/);
assert.match(source, /from\('profiles'\)/);
assert.match(source, /from\('follows'\)/);
assert.match(source, /from\('likes'\)/);
assert.match(source, /from\('direct_messages'\)/);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function boot(config={},mock=null) {
 const dom = new JSDOM(html,{url:'https://example.org/VIRA-APP/index-live.html',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.scrollTo=()=>{};w.VIRA_CONFIG=config;if(mock)w.supabase={createClient:()=>mock};
 w.eval(source);await wait(50);
 return dom;
}
(async()=>{
 let dom=await boot();
 assert.match(dom.window.document.body.textContent,/Ativação do cadastro pendente/);
 dom.window.close();
 const sid='c95b89de-7347-4214-af53-bb42534f70dc';
 const data={profiles:[{id:sid,username:'pessoa_vira',display_name:'Pessoa VIRA',bio:'Eu gosto do VIRA'}],posts:[],likes:[],comments:[],follows:[],help_requests:[],help_answers:[],direct_messages:[],stories:[]};
 const mutator=(table,method,payload)=>{if(method==='insert'){data[table].push({...payload,id:'a2fce48f-2511-4dc0-b8e3-835cace64222',created_at:new Date().toISOString()})}return {data:[],error:null}};
 const query=table=>({
  select(){return this},order(){return this},limit(){return this},eq(){return this},gt(){return this},
  insert(v){return Promise.resolve(mutator(table,'insert',v))},
  update(v){return {eq(){return Promise.resolve({data:[],error:null})}}},
  delete(){return {eq(){return this},then(fn){return Promise.resolve({data:[],error:null}).then(fn)}}},
  then(resolve,reject){return Promise.resolve({data:data[table]||[],error:null}).then(resolve,reject)}
 });
 const mock={
  auth:{
   getSession:async()=>({data:{session:{user:{id:sid}}},error:null}),
   onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
   signOut:async()=>({error:null}),
   signInWithPassword:async()=>({data:{session:{user:{id:sid}}},error:null}),
   signUp:async()=>({data:{session:{user:{id:sid}}},error:null}),
  },
  from:query,storage:{from:()=>({getPublicUrl:path=>({data:{publicUrl:'https://example.org/'+path}})})}
 };
 dom=await boot({url:'https://abcdabcdabcdabcdabcd.supabase.co',publishableKey:'sb_publishable_test'},mock);
 const d=dom.window.document;
 assert.match(d.querySelector('#view').textContent,/Stories e momentos/);
 assert.equal(d.querySelectorAll('#bottom-nav [data-route]').length,5);
 d.querySelector('[data-route="criar"]').click();await wait(10);
 assert.ok(d.querySelector('#post-form'));
 const input=d.querySelector('textarea[name=caption]');input.value='Meu primeiro post com dados persistidos';
 d.querySelector('#post-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await wait(70);
 assert.equal(data.posts.length,1);
 assert.match(d.querySelector('#view').textContent,/Meu primeiro post/);
 d.querySelector('[data-route="resolver"]').click();
 assert.match(d.querySelector('#view').textContent,/Um lugar para se ajudar/);
 d.querySelector('[data-act="new-help"]').click();
 assert.ok(d.querySelector('#help-form'));
 dom.window.close();
 console.log('PASSOU: página pendente segura + carregamento autenticado simulado + cinco abas + criação de postagem e interface Resolve.');
})().catch(e=>{console.error(e);process.exitCode=1});
