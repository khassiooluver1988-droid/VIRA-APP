const fs=require('node:fs');const assert=require('node:assert/strict');
const path='docs/assets/branding/klix-splash.webp',bytes=fs.readFileSync(path);
assert.ok(bytes.length>1000,'Arte de abertura ausente ou inválida');
assert.equal(bytes.toString('ascii',0,4),'RIFF');
assert.equal(bytes.toString('ascii',8,12),'WEBP');
for(const name of ['docs/index.html','docs/index-live.html']){
 const text=fs.readFileSync(name,'utf8');
 assert.match(text, /KLIX/);
 assert.ok(text.includes('assets/branding/klix-splash.webp'),name+' sem arte de abertura');
 assert.equal((text.match(/klix-splash.webp/g)||[]).length,2);
 assert.doesNotMatch(text,/kora-logo.webp|kora-original.jpg|alt="KORA"/);
 assert.ok(!/<img[^>]+class="[^"]*header-logo/.test(text),'Logo quadrada nao pode aparecer no cabecalho');
 assert.ok(text.includes('class="klix-wordmark">KLIX'));
}
const js=fs.readFileSync('docs/live.js','utf8');
assert.match(js,/compressProfilePhoto/);
assert.match(js,/avatar_path/);
assert.match(js,/klix-story-plus/);
console.log('PASSOU: KLIX na abertura, apenas nome no cabecalho, botao story e foto de perfil preparados.');
