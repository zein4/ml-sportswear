// ML Sportswear: safe, idempotent studio atmosphere addition.
// Does not modify any checkout component, pricing logic, or APIs.
const fs=require('node:fs');
const path=require('node:path');
const p=path.join(process.cwd(),'app','globals.css');
if(!fs.existsSync(p)){console.error('Could not find app/globals.css. Run this from the ml-sportswear folder.');process.exitCode=1;}
else{
 const marker='/* ML_PATCH9_STONE_STUDIO_THEME */';
 const css=`\n${marker}\n/* Buyer customizer only. Staff dashboard and checkout behavior untouched. */\nbody:has(.customizer-wrap){background-color:#c6cfd9;background-image:radial-gradient(ellipse at 14% 7%,rgba(255,255,255,.5),transparent 55%),repeating-linear-gradient(90deg,transparent 0 246px,rgba(63,82,106,.055) 247px,transparent 248px),repeating-linear-gradient(0deg,transparent 0 246px,rgba(63,82,106,.055) 247px,transparent 248px);background-attachment:fixed}\n:root[data-theme="dark"] body:has(.customizer-wrap){background-color:#182436;background-image:radial-gradient(ellipse at 20% 0%,rgba(100,130,180,.16),transparent 60%),repeating-linear-gradient(90deg,transparent 0 246px,rgba(185,210,242,.03) 247px,transparent 248px),repeating-linear-gradient(0deg,transparent 0 246px,rgba(185,210,242,.03) 247px,transparent 248px)}\nbody:has(.customizer-wrap) .site-header{background:#151f30;color:#f1f3fa;border-bottom:1px solid #57647950}\nbody:has(.customizer-wrap) .site-nav{color:#d6deeb}\nbody:has(.customizer-wrap) .brand-word small{color:#bac6d8}\nbody:has(.customizer-wrap) .header-cta{color:#f7f6ff;border-color:#69758e}\nbody:has(.customizer-wrap) .theme-toggle{background:#26374c;border-color:#53657d;color:#f3f6fb}\nbody:has(.customizer-wrap) .site-footer{background:#121d2d;color:#d5dfeb}\n`;
 const old=fs.readFileSync(p,'utf8');
 if(old.includes(marker)) console.log('Studio atmosphere already installed. No changes made.');
 else {fs.writeFileSync(p,old+'\n'+css,'utf8');console.log('Updated app/globals.css with the stone-blue background on the customer customizer only.');}
}
