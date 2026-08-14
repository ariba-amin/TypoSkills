function renderLogin(){
  const db=loadDB();
  document.getElementById("app").innerHTML=`<div class="login-page"><div class="login-panel">
    <div class="login-brand">${logoMarkup("login-logo")}</div>
    <div class="tag"></div>
    <div class="login-tabs"><button id="adminTab" class="login-tab active" onclick="showLoginMode('admin')">Admin Access</button><button id="studentTab" class="login-tab" onclick="showLoginMode('student')">Student Access</button></div>
    <div id="loginArea"></div>
  </div></div>`;
  showLoginMode(db.admin ? "admin" : "admin");
}
function showLoginMode(mode){
  document.getElementById("adminTab")?.classList.toggle("active",mode==="admin");
  document.getElementById("studentTab")?.classList.toggle("active",mode==="student");
  const area=document.getElementById("loginArea"); if(!area)return;
  mode==="admin" ? renderAdminAuth(area) : renderStudentAuth(area,"login");
}
function renderAdminAuth(area){
  const db=loadDB();
  if(db.admin){
    area.innerHTML=`<div class="eyebrow">ADMINISTRATOR</div><h2>Welcome back</h2><p class="muted small">Sign in to manage your tests, students and results.</p><label>Username</label><input id="adminUsername" autocomplete="username"><label>Password</label><input id="adminPassword" type="password" autocomplete="current-password"><button class="btn primary full" onclick="adminLogin()">Sign In</button><button class="link-button full" onclick="showAdminReset()">Forgot Password?</button>`;
  }else{
    area.innerHTML=`<div class="eyebrow">FIRST-TIME SETUP</div><h2>Create Admin Account</h2><p class="muted small">Create one secure administrator account. Keep your recovery code safe.</p><label>Username</label><input id="adminUsername" autocomplete="username"><label>Password</label><input id="adminPassword" type="password" autocomplete="new-password"><label>Confirm Password</label><input id="adminConfirmPassword" type="password" autocomplete="new-password"><label>Recovery Code</label><input id="adminRecovery" autocomplete="off"><label>Confirm Recovery Code</label><input id="adminRecoveryConfirm" autocomplete="off"><button class="btn primary full" onclick="createAdmin()">Create Account & Continue</button>`;
  }
}
async function createAdmin(){
  const u=document.getElementById("adminUsername").value.trim(),p=document.getElementById("adminPassword").value,c=document.getElementById("adminConfirmPassword").value,r=document.getElementById("adminRecovery").value.trim(),rc=document.getElementById("adminRecoveryConfirm").value.trim();
  if(!/^[A-Za-z0-9._-]{3,30}$/.test(u))return alert("Username must be 3–30 characters and use letters, numbers, dot, underscore or hyphen.");
  if(p.length<6)return alert("Password must be at least 6 characters.");
  if(p!==c)return alert("Passwords do not match.");
  if(r.length<4)return alert("Recovery code must be at least 4 characters.");
  if(r!==rc)return alert("Recovery codes do not match.");
  const db=loadDB(); if(db.admin)return alert("An admin account already exists.");
  const salt=newSalt();
  db.admin={username:u,passwordHash:await hashPassword(p,salt),passwordSalt:salt,recoveryHash:await hashPassword(r,salt+"|recovery"),recoverySalt:salt+"|recovery",createdAt:new Date().toISOString()};
  saveDB(db); setSession({role:"admin",id:"admin",name:u}); renderAdmin();
}
async function adminLogin(){
  const u=document.getElementById("adminUsername").value.trim(),p=document.getElementById("adminPassword").value,db=loadDB();
  if(!db.admin)return alert("Create the admin account first.");
  const ok=u.toLowerCase()===db.admin.username.toLowerCase() && await hashPassword(p,db.admin.passwordSalt)===db.admin.passwordHash;
  if(!ok)return alert("Incorrect username or password.");
  setSession({role:"admin",id:"admin",name:db.admin.username}); renderAdmin();
}
function showAdminReset(){
  const area=document.getElementById("loginArea");
  area.innerHTML=`<div class="eyebrow">ACCOUNT RECOVERY</div><h2>Reset Admin Password</h2><p class="muted small">Use the recovery code you created during account setup.</p><label>Username</label><input id="resetAdminUsername"><label>Recovery Code</label><input id="resetRecovery"><label>New Password</label><input id="resetAdminPassword" type="password"><label>Confirm New Password</label><input id="resetAdminConfirm" type="password"><button class="btn primary full" onclick="resetAdminPassword()">Reset Password</button><button class="link-button full" onclick="renderLogin()">Back to Login</button>`;
}
async function resetAdminPassword(){
  const db=loadDB(),u=document.getElementById("resetAdminUsername").value.trim(),r=document.getElementById("resetRecovery").value,p=document.getElementById("resetAdminPassword").value,c=document.getElementById("resetAdminConfirm").value;
  if(!db.admin)return;if(u.toLowerCase()!==db.admin.username.toLowerCase())return alert("Username not found.");if(p.length<6)return alert("Password must be at least 6 characters.");if(p!==c)return alert("Passwords do not match.");
  if(await hashPassword(r,db.admin.recoverySalt)!==db.admin.recoveryHash)return alert("Incorrect recovery code.");
  const salt=newSalt();db.admin.passwordSalt=salt;db.admin.passwordHash=await hashPassword(p,salt);saveDB(db);alert("Password reset successfully. Please sign in.");renderLogin();
}
function renderStudentAuth(area,mode){
  area.innerHTML=`<div class="eyebrow">STUDENT</div><h2 id="studentAuthTitle"></h2><p id="studentAuthHelp" class="muted small"></p><input type="hidden" id="studentAuthMode"><div id="studentNameWrap"><label>Name</label><input id="studentName" autocomplete="name"></div><label>SKANS ID</label><input id="studentId" inputmode="numeric" maxlength="4" autocomplete="username"><label>Password</label><input id="studentPassword" type="password" autocomplete="current-password"><div id="studentConfirmWrap"><label>Confirm Password</label><input id="studentConfirmPassword" type="password" autocomplete="new-password"></div><button class="btn primary full" onclick="studentSubmit()" id="studentAuthBtn"></button><button class="link-button full" onclick="studentForgotPassword()" id="studentResetBtn">Forgot Password?</button><button class="link-button full" onclick="showStudentAuth(document.getElementById('studentAuthMode').value==='create'?'login':'create')" id="studentToggle"></button>`;
  showStudentAuth(mode);
}
function showStudentAuth(mode){
  const create=mode==="create";document.getElementById("studentAuthMode").value=mode;document.getElementById("studentAuthTitle").textContent=create?"Create Student Account":"Student Sign In";document.getElementById("studentAuthHelp").textContent=create?"Enter your name, SKANS ID and password.":"Use your SKANS ID and password to enter the dashboard.";document.getElementById("studentNameWrap").classList.toggle("hidden",!create);document.getElementById("studentConfirmWrap").classList.toggle("hidden",!create);document.getElementById("studentAuthBtn").textContent=create?"Create Account":"Sign In";document.getElementById("studentResetBtn").classList.toggle("hidden",create);document.getElementById("studentToggle").textContent=create?"Already have an account? Sign In":"Create Student Account";
}
async function studentSubmit(){document.getElementById("studentAuthMode").value==="create"?await createStudent():await studentLogin()}
async function createStudent(){
  const name=document.getElementById("studentName").value.trim(),sid=document.getElementById("studentId").value.trim(),p=document.getElementById("studentPassword").value,c=document.getElementById("studentConfirmPassword").value;
  if(!name)return alert("Please enter your name.");if(!/^\d{4}$/.test(sid))return alert("SKANS ID must be exactly 4 digits.");if(p.length<6)return alert("Password must be at least 6 characters.");if(p!==c)return alert("Passwords do not match.");
  const db=loadDB();if(db.users.some(u=>u.id===sid))return alert("This SKANS ID already has an account.");const salt=newSalt();db.users.push({id:sid,name,passwordHash:await hashPassword(p,salt),salt,role:"student",resetAllowed:false,createdAt:new Date().toISOString()});saveDB(db);alert("Student account created successfully. Please sign in.");showStudentAuth("login");document.getElementById("studentId").value=sid;
}
async function studentLogin(){
  const sid=document.getElementById("studentId").value.trim(),p=document.getElementById("studentPassword").value,db=loadDB();
  if(!/^\d{4}$/.test(sid))return alert("SKANS ID must be exactly 4 digits.");const u=db.users.find(x=>x.id===sid&&x.role==="student");if(!u)return alert("No account found for this SKANS ID.");
  if(await hashPassword(p,u.salt)!==u.passwordHash)return alert("Incorrect password.");setSession({role:"student",id:u.id,name:u.name});renderStudent();
}
async function studentForgotPassword(){
  const sid=prompt("Enter your SKANS ID:")?.trim();if(!sid)return;const db=loadDB(),u=db.users.find(x=>x.id===sid&&x.role==="student");if(!u)return alert("Student account not found.");
  if(!isResetActive(u)){u.resetAllowed=false;delete u.resetAllowedAt;saveDB(db);return alert("Password reset is not currently allowed. Ask the administrator first.");}
  const p=prompt("Enter your new password (minimum 6 characters):");if(!p||p.length<6)return alert("Password must be at least 6 characters.");const c=prompt("Confirm your new password:");if(p!==c)return alert("Passwords do not match.");
  const salt=newSalt();u.passwordHash=await hashPassword(p,salt);u.salt=salt;u.resetAllowed=false;delete u.resetAllowedAt;saveDB(db);alert("Password reset successfully. Please sign in.");showStudentAuth("login");document.getElementById("studentId").value=sid;
}
function logout(){clearSession();if(window.exam) cancelExamListeners?.();renderLogin()}
