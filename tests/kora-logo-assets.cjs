const fs=require('node:fs');const assert=require('node:assert/strict');
const path='docs/assets/branding/kora-logo.webp',bytes=fs.readFileSync(path);
assert.ok(bytes.length>1000,'Logo muito pequena ou ausente');
assert.equal(bytes.toString('ascii',0,4),'RIFF','Assinatura RIFF inválida');
assert.equal(bytes.toString('ascii',8,12),'WEBP','Imagem não é WebP');
for(const name of ['docs/index.html','docs/index-live.html','docs/live.js']){
 const code=fs.readFileSync(name,'utf8');
 assert.ok(code.includes('kora-logo.webp?v=20261026b'),name+': versão da logo não encontrada');
 assert.ok(!code.includes('./assets/branding/kora-original.jpg'),name+': logo antiga ainda referenciada');
}
assert.ok(fs.readFileSync('docs/index.html','utf8').includes('onerror='),'Sem proteção para imagem quebrada');
console.log('PASSOU: logo WebP válida, caminho consistente nos três arquivos e fallback presente.');