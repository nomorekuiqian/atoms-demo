// UI regression on a private QA Pomodoro project with version history.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createClient} from '@insforge/sdk';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const app=process.env.APP_URL ?? 'http://localhost:3300';
(async()=>{
const qa=JSON.parse(fs.readFileSync(process.env.QA_SESSION_FILE ?? '.insforge/qa-enhancements.json'));
if(qa.email && qa.password){const client=createClient({baseUrl:process.env.NEXT_PUBLIC_INSFORGE_URL,anonKey:process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY});const login=await client.auth.signInWithPassword({email:qa.email,password:qa.password});if(login.error)throw new Error(login.error.message);qa.token=login.data.accessToken;}
const browser=await chromium.launch({channel:'chrome',headless:true});const c=await browser.newContext();await c.addCookies([{name:'insforge_access_token',value:qa.token,domain:new URL(app).hostname,path:'/'}]);const p=await c.newPage();
for(const width of [375,768,900,1280]){
 await p.setViewportSize({width,height:900});await p.goto(`${app}/project/${qa.projectId}`);
 if(width<1024)await p.getByRole('button',{name:'App',exact:true}).click();
 const panel=p.getByRole('region',{name:'App panel',exact:true});const first=await panel.boundingBox();
 for(const name of ['Preview','Code','Versions']){
  await p.getByRole('tab',{name,exact:true}).click();const rect=await panel.boundingBox();for(const key of ['x','y','width','height'])assert(Math.abs(rect[key]-first[key])<=1,`${width} ${name} ${key}`);
  assert.equal(await p.getByRole('tabpanel',{name,exact:true}).count(),1);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} outer overflow`);
 }
 await p.getByRole('tab',{name:'Code',exact:true}).click();
 const select=async path=>{const picker=p.getByRole('combobox',{name:'File',exact:true});if(await picker.isVisible())await picker.selectOption(path);else await p.getByRole('navigation',{name:'Files',exact:true}).getByRole('button',{name:path,exact:true}).click();};
 await select('app.js');await p.locator('.code-shiki').waitFor({state:'visible'});
 const viewer=p.locator('.code-layout .overflow-auto');await viewer.evaluate(el=>{el.scrollTop=320});await p.waitForTimeout(100);
 await p.getByRole('tab',{name:'Preview',exact:true}).click();await p.getByRole('tab',{name:'Code',exact:true}).click();assert((await viewer.evaluate(el=>el.scrollTop))>=310,`${width} tab scroll`);
 await select('styles.css');await select('app.js');await p.waitForFunction(()=>document.querySelector('.code-layout .overflow-auto')?.scrollTop>=310);console.log('PASS',width,'stable panel, accessible tabs, file controls and scroll retention');
 if(width===1280){const separator=p.getByRole('separator',{name:'Resize chat and app panels; Enter resets',exact:true});await separator.focus();await p.keyboard.press('ArrowRight');assert.equal(await separator.getAttribute('aria-valuenow'),'40');await p.keyboard.press('Enter');assert.equal(await separator.getAttribute('aria-valuenow'),'38');const r=await separator.boundingBox();await p.mouse.move(r.x+4,r.y+100);await p.mouse.down();await p.mouse.move(r.x+110,r.y+100);await p.mouse.up();assert(Number(await separator.getAttribute('aria-valuenow'))>40);await separator.press('Enter');console.log('PASS pointer and keyboard resize, reset');}
 await p.screenshot({path:`/tmp/atoms-ui-${width}.png`});
}
await p.getByRole('tab',{name:'Versions',exact:true}).click();
let held;await p.route('**/api/projects/*/versions/*',route=>{held=route;});
await p.getByRole('tabpanel',{name:'Versions',exact:true}).locator('ol > li').nth(1).locator('button').first().click();await p.getByRole('status').filter({hasText:'Loading version'}).waitFor();await p.getByRole('tab',{name:'Code',exact:true}).click();
await held.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Injected history failure'})});await p.getByRole('button',{name:'Retry version',exact:true}).waitFor();assert.equal(await p.getByRole('tab',{name:'Code',exact:true}).getAttribute('aria-selected'),'true');
await p.unroute('**/api/projects/*/versions/*');await p.getByRole('button',{name:'Retry version',exact:true}).click();await p.getByText(/Viewing v\d+\. Your current version is unchanged/).waitFor();
const popupPromise=p.waitForEvent('popup');await p.getByRole('button',{name:'Open in new tab',exact:true}).click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');assert(popup.url().includes('versionId='));await popup.getByText(/Viewing v\d+/).waitFor();await popup.close();console.log('PASS history loading, persistent retry, no late tab stealing and exact-version new tab');
const text=p.getByRole('textbox');await text.fill(Array.from({length:10},(_,i)=>'Line '+i).join('\n'));assert((await text.boundingBox()).height>150);assert((await text.boundingBox()).height<=193);await text.fill('');
await p.getByRole('button',{name:'Console',exact:true}).click();await p.frames()[1].evaluate(()=>{for(let i=0;i<70;i++)console.log('history log',i)});const consolePanel=p.getByRole('region',{name:'Console',exact:true});const loglist=consolePanel.locator('.overflow-auto');await p.waitForTimeout(150);await loglist.evaluate(el=>{el.scrollTop=0});await p.waitForTimeout(150);await p.frames()[1].evaluate(()=>console.log('new log while reading'));await p.waitForTimeout(150);assert.equal(await loglist.evaluate(el=>el.scrollTop),0);
const h=await consolePanel.boundingBox();await p.getByRole('separator',{name:'Resize console; Enter resets',exact:true}).press('ArrowUp');assert((await consolePanel.boundingBox()).height>h.height);console.log('PASS growing composer, bounded console resize, no forced scroll');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
