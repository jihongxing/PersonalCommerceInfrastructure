(() => {
const visible = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
const controls = Array.from(document.querySelectorAll('main button, main input, main select, main [role="tab"], main a')).filter(visible);
return JSON.stringify({route:location.pathname+location.search,width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth,smallTargets:controls.map(e=>({name:(e.getAttribute('aria-label')||e.textContent||e.getAttribute('placeholder')||e.tagName).trim().slice(0,45),height:Math.round(e.getBoundingClientRect().height),width:Math.round(e.getBoundingClientRect().width)})).filter(e=>e.height<43||e.width<43),headings:Array.from(document.querySelectorAll('h1')).filter(visible).map(e=>e.textContent)});
})()
