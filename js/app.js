function init(){
  try{migrateOldDB();const s=getSession();if(s?.role==="admin")renderAdmin();else if(s?.role==="student")renderStudent();else renderLogin();}
  catch(err){console.error(err);document.getElementById("app").innerHTML=`<main class="container"><div class="card"><h2>Typo Skills could not start</h2><p>${esc(err.message||err)}</p><button class="btn primary" onclick="clearAllAppData();location.reload()">Reset App Data</button></div></main>`;}
}
init();
