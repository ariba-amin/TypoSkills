const DBKEY = "typoSkillsOfflineDB_v6";
const SESSIONKEY = "typoSkillsSession_v6";
const RESET_WINDOW = 24 * 60 * 60 * 1000;

function freshDB(){
  return {version:6, admin:null, users:[], tests:[], submissions:[], results:[]};
}

function normalizeDB(db){
  db = db && typeof db === "object" ? db : freshDB();
  db.version = 6;
  db.admin = db.admin || null;
  db.users = Array.isArray(db.users) ? db.users : [];
  db.tests = Array.isArray(db.tests) ? db.tests : [];
  db.submissions = Array.isArray(db.submissions) ? db.submissions : [];
  db.results = Array.isArray(db.results) ? db.results : [];
  db.users.forEach(u => {
    if (u.resetAllowed && u.resetAllowedAt && !isResetActive(u)) {
      u.resetAllowed = false;
      delete u.resetAllowedAt;
    }
  });
  return db;
}

function isResetActive(u){
  if(!u?.resetAllowed || !u.resetAllowedAt) return false;
  return Date.now() - new Date(u.resetAllowedAt).getTime() < RESET_WINDOW;
}

function loadDB(){
  try {
    const raw = localStorage.getItem(DBKEY);
    return normalizeDB(raw ? JSON.parse(raw) : freshDB());
  } catch(e){ return freshDB(); }
}

function saveDB(db){ localStorage.setItem(DBKEY, JSON.stringify(normalizeDB(db))); }
function getSession(){ try{return JSON.parse(localStorage.getItem(SESSIONKEY)||"null")}catch(e){return null} }
function setSession(value){ localStorage.setItem(SESSIONKEY, JSON.stringify(value)); }
function clearSession(){ localStorage.removeItem(SESSIONKEY); }

function migrateOldDB(){
  // v6 intentionally uses a new storage key so the distributed build starts fresh.
  if(!localStorage.getItem(DBKEY)) saveDB(freshDB());
  return loadDB();
}

function clearAllAppData(){
  localStorage.removeItem(DBKEY);
  localStorage.removeItem(SESSIONKEY);
}

function downloadBlob(filename, content, type="application/octet-stream"){
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
