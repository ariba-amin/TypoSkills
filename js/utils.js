function esc(value){
  return String(value ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}
function makeId(){ return Math.random().toString(36).slice(2,9).toUpperCase(); }
function initials(name){ return String(name||"U").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"U"; }
function countWords(text){ return String(text||"").trim() ? String(text).trim().split(/\s+/).length : 0; }
function newSalt(){
  if(window.crypto?.getRandomValues) return Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,"0")).join("");
  return makeId()+Date.now();
}
async function hashPassword(password,salt=""){
  const input = `${salt}|${password}`;
  if(window.crypto?.subtle){
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }
  return btoa(unescape(encodeURIComponent(input)));
}
function logoMarkup(className="app-logo"){ return `<img class="${className}" src="assets/typo-skills-logo.png" alt="Typo Skills">`; }
function header(title){
  return `<header class="header"><div class="header-inner"><button class="brand-button" onclick="goDashboard()">${logoMarkup("header-logo-img")}<span>${esc(title)}</span></button><div class="header-actions"><button class="btn header-btn" onclick="logout()">Logout</button></div></div></header>`;
}
function goDashboard(){ const s=getSession(); if(s?.role==="admin") renderAdmin(); else if(s?.role==="student") renderStudent(); else renderLogin(); }
