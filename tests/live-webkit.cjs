const assert = require('node:assert/strict'); const {webkit,devices}=require('playwright');
(async()=>{
 const browser=await webkit.launch({headless:true});
 const page=await browser.newPage({...devices['iPhone 13'],locale:'pt-BR'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto('https://khassiooluver1988-droid.github.io/VIRA-APP/index-live.html',{waitUntil:'domcontentloaded',timeout:60000});
 assert.equal(response.status(),200);
 await page.getByText('Ativação do cadastro pendente.').waitFor({timeout:15000});
 assert.equal(await page.locator('.auth-panel').count(),1);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 assert.equal(overflow,false,'A tela vaza horizontalmente no iPhone');
 assert.deepEqual(errors,[],'Erros JavaScript no WebKit');
 console.log('PASSOU — Safari WebKit virtual, HTTP 200, aviso de ativação honesto, interface iPhone sem rolagem horizontal e sem erro JavaScript.');
 await browser.close();
})().catch(err=>{console.error(err);process.exitCode=1});
