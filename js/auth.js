/* =========================================================
   AUTHENTICATION
   Typo Skills Writing Test System
   ========================================================= */

const EMAILJS_SERVICE_ID = "service_vsqacet";
const EMAILJS_TEMPLATE_ID = "template_5udal5r";

/* =========================================================
   OTP HELPERS
   ========================================================= */

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function saveResetOTP(key, data) {
  sessionStorage.setItem(
    "typo_reset_" + key,
    JSON.stringify(data)
  );
}

function getResetOTP(key) {
  try {
    return JSON.parse(
      sessionStorage.getItem("typo_reset_" + key)
    );
  } catch {
    return null;
  }
}

function clearResetOTP(key) {
  sessionStorage.removeItem("typo_reset_" + key);
}

async function sendResetOTP(user, accountType) {
  if (!user.email) {
    alert("No email address is registered for this account.");
    return false;
  }

  const otp = generateOTP();
  const expiryMinutes = 10;

  saveResetOTP(
    accountType + "_" + (user.id || user.username),
    {
      otp,
      expiresAt: Date.now() + expiryMinutes * 60 * 1000
    }
  );

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        name: user.name || user.username || user.id,
        email: user.email,
        otp: otp,
        expiry: expiryMinutes
      }
    );

    return true;
  } catch (error) {
    console.error("EmailJS error:", error);

    clearResetOTP(
      accountType + "_" + (user.id || user.username)
    );

    alert("Unable to send the verification email. Please try again.");
    return false;
  }
}

function verifyResetOTP(userKey, enteredOTP) {
  const data = getResetOTP(userKey);

  if (!data) {
    alert("No verification code found. Please request a new code.");
    return false;
  }

  if (Date.now() > data.expiresAt) {
    clearResetOTP(userKey);
    alert("The verification code has expired. Please request a new code.");
    return false;
  }

  if (enteredOTP !== data.otp) {
    alert("Incorrect verification code.");
    return false;
  }

  clearResetOTP(userKey);
  return true;
}

/* =========================================================
   LOGIN PAGE
   ========================================================= */

function renderLogin() {
  const db = loadDB();

  document.getElementById("app").innerHTML = `
    <div class="login-page">
      <div class="login-panel">

        <div class="login-brand">
          ${logoMarkup("login-logo")}
        </div>

        <div class="tag"></div>

        <div class="login-tabs">
          <button
            id="adminTab"
            class="login-tab active"
            onclick="showLoginMode('admin')">
            Admin Access
          </button>

          <button
            id="studentTab"
            class="login-tab"
            onclick="showLoginMode('student')">
            Student Access
          </button>
        </div>

        <div id="loginArea"></div>

      </div>
    </div>
  `;

  showLoginMode("admin");
}

/* =========================================================
   LOGIN MODE
   ========================================================= */

function showLoginMode(mode) {
  document
    .getElementById("adminTab")
    ?.classList.toggle("active", mode === "admin");

  document
    .getElementById("studentTab")
    ?.classList.toggle("active", mode === "student");

  const area = document.getElementById("loginArea");

  if (!area) return;

  if (mode === "admin") {
    renderAdminAuth(area);
  } else {
    renderStudentAuth(area, "login");
  }
}

/* =========================================================
   ADMIN AUTH
   ========================================================= */

function renderAdminAuth(area) {
  const db = loadDB();

  if (db.admin) {

    area.innerHTML = `
      <div class="eyebrow">ADMINISTRATOR</div>

      <h2>Welcome back</h2>

      <p class="muted small">
        Sign in to manage your tests, students and results.
      </p>

      <label>Username</label>
      <input
        id="adminUsername"
        autocomplete="username"
      >

      <label>Password</label>
      <input
        id="adminPassword"
        type="password"
        autocomplete="current-password"
      >

      <button
        class="btn primary full"
        onclick="adminLogin()">
        Sign In
      </button>

      <button
        class="link-button full"
        onclick="showAdminReset()">
        Forgot Password?
      </button>
    `;

  } else {

    area.innerHTML = `
      <div class="eyebrow">FIRST-TIME SETUP</div>

      <h2>Create Admin Account</h2>

      <p class="muted small">
        Create your administrator account using a username,
        email and password.
      </p>

      <label>Username</label>
      <input
        id="adminUsername"
        autocomplete="username"
      >

      <label>Email</label>
      <input
        id="adminEmail"
        type="email"
        autocomplete="email"
      >

      <label>Password</label>
      <input
        id="adminPassword"
        type="password"
        autocomplete="new-password"
      >

      <label>Confirm Password</label>
      <input
        id="adminConfirmPassword"
        type="password"
        autocomplete="new-password"
      >

      <button
        class="btn primary full"
        onclick="createAdmin()">
        Create Account & Continue
      </button>
    `;
  }
}

/* =========================================================
   CREATE ADMIN
   ========================================================= */

async function createAdmin() {

  const u = document
    .getElementById("adminUsername")
    .value;

  const email = document
    .getElementById("adminEmail")
    .value
    .trim();

  const p = document
    .getElementById("adminPassword")
    .value;

  const c = document
    .getElementById("adminConfirmPassword")
    .value;

  /*
    Do NOT trim username or password.
    This keeps authentication case-sensitive.
  */
  if (!/^[A-Za-z0-9._-]{3,30}$/.test(u)) {
    return alert(
      "Username must be 3–30 characters and use letters, numbers, dot, underscore or hyphen."
    );
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return alert("Please enter a valid email address.");
  }

  if (p.length < 6) {
    return alert("Password must be at least 6 characters.");
  }

  if (p !== c) {
    return alert("Passwords do not match.");
  }

  const db = loadDB();

  if (db.admin) {
    return alert("An admin account already exists.");
  }

  const salt = newSalt();

  db.admin = {
    username: u,
    email: email,
    passwordHash: await hashPassword(p, salt),
    passwordSalt: salt,
    createdAt: new Date().toISOString()
  };

  saveDB(db);

  setSession({
    role: "admin",
    id: "admin",
    name: u
  });

  renderAdmin();
}

/* =========================================================
   ADMIN LOGIN
   ========================================================= */

async function adminLogin() {

  const u = document
    .getElementById("adminUsername")
    .value;

  const p = document
    .getElementById("adminPassword")
    .value;

  const db = loadDB();

  if (!db.admin) {
    return alert("Create the admin account first.");
  }

  /*
    Username comparison is intentionally CASE-SENSITIVE.
  */
  const usernameCorrect =
    u === db.admin.username;

  const passwordCorrect =
    await hashPassword(
      p,
      db.admin.passwordSalt
    ) === db.admin.passwordHash;

  if (!usernameCorrect || !passwordCorrect) {
    return alert("Incorrect username or password.");
  }

  setSession({
    role: "admin",
    id: "admin",
    name: db.admin.username
  });

  renderAdmin();
}

/* =========================================================
   ADMIN PASSWORD RESET
   ========================================================= */

function showAdminReset() {

  const area = document.getElementById("loginArea");

  area.innerHTML = `
    <div class="eyebrow">ACCOUNT RECOVERY</div>

    <h2>Reset Admin Password</h2>

    <p class="muted small">
      A verification code will be sent to your registered email.
    </p>

    <label>Username</label>
    <input
      id="resetAdminUsername"
      autocomplete="username"
    >

    <label>Registered Email</label>
    <input
      id="resetAdminEmail"
      type="email"
      autocomplete="email"
    >

    <button
      class="btn primary full"
      onclick="sendAdminResetCode()">
      Send Verification Code
    </button>

    <button
      class="link-button full"
      onclick="renderLogin()">
      Back to Login
    </button>
  `;
}

async function sendAdminResetCode() {

  const db = loadDB();

  if (!db.admin) {
    return alert("Admin account does not exist.");
  }

  const username =
    document
      .getElementById("resetAdminUsername")
      .value;

  const email =
    document
      .getElementById("resetAdminEmail")
      .value
      .trim();

  /*
    Both username and email must match exactly.
  */
  if (username !== db.admin.username) {
    return alert("Username not found.");
  }

  if (
    email !== db.admin.email
  ) {
    return alert("The email does not match the registered email.");
  }

  const sent = await sendResetOTP(
    db.admin,
    "admin"
  );

  if (!sent) return;

  renderAdminOTPForm(
    db.admin.username
  );
}

/* =========================================================
   ADMIN OTP FORM
   ========================================================= */

function renderAdminOTPForm(username) {

  const area = document.getElementById("loginArea");

  area.innerHTML = `
    <div class="eyebrow">EMAIL VERIFICATION</div>

    <h2>Enter Verification Code</h2>

    <p class="muted small">
      A 6-digit code has been sent to your registered email.
      The code expires in 10 minutes.
    </p>

    <label>Verification Code</label>
    <input
      id="adminOTP"
      inputmode="numeric"
      maxlength="6"
      autocomplete="one-time-code"
    >

    <label>New Password</label>
    <input
      id="adminNewPassword"
      type="password"
      autocomplete="new-password"
    >

    <label>Confirm New Password</label>
    <input
      id="adminNewPasswordConfirm"
      type="password"
      autocomplete="new-password"
    >

    <button
      class="btn primary full"
      onclick="resetAdminPassword()">
      Reset Password
    </button>

    <button
      class="link-button full"
      onclick="showAdminReset()">
      Back
    </button>
  `;

  window.currentAdminResetUsername = username;
}

/* =========================================================
   RESET ADMIN PASSWORD
   ========================================================= */

async function resetAdminPassword() {

  const db = loadDB();

  if (!db.admin) {
    return alert("Admin account does not exist.");
  }

  const otp =
    document
      .getElementById("adminOTP")
      .value
      .trim();

  const p =
    document
      .getElementById("adminNewPassword")
      .value;

  const c =
    document
      .getElementById("adminNewPasswordConfirm")
      .value;

  if (!/^\d{6}$/.test(otp)) {
    return alert("Please enter the 6-digit verification code.");
  }

  if (p.length < 6) {
    return alert("Password must be at least 6 characters.");
  }

  if (p !== c) {
    return alert("Passwords do not match.");
  }

  const key = "admin_" + db.admin.username;

  if (!verifyResetOTP(key, otp)) {
    return;
  }

  const salt = newSalt();

  db.admin.passwordSalt = salt;
  db.admin.passwordHash =
    await hashPassword(p, salt);

  saveDB(db);

  alert(
    "Password reset successfully. Please sign in."
  );

  window.currentAdminResetUsername = null;

  renderLogin();
}

/* =========================================================
   STUDENT AUTH
   ========================================================= */

function renderStudentAuth(area, mode) {

  area.innerHTML = `
    <div class="eyebrow">STUDENT</div>

    <h2 id="studentAuthTitle"></h2>

    <p
      id="studentAuthHelp"
      class="muted small">
    </p>

    <input
      type="hidden"
      id="studentAuthMode"
    >

    <div id="studentNameWrap">

      <label>Name</label>

      <input
        id="studentName"
        autocomplete="name"
      >

    </div>

    <label>SKANS ID</label>

    <input
      id="studentId"
      inputmode="numeric"
      maxlength="4"
      autocomplete="username"
    >

    <div id="studentEmailWrap">

      <label>Email</label>

      <input
        id="studentEmail"
        type="email"
        autocomplete="email"
      >

    </div>

    <label>Password</label>

    <input
      id="studentPassword"
      type="password"
      autocomplete="current-password"
    >

    <div id="studentConfirmWrap">

      <label>Confirm Password</label>

      <input
        id="studentConfirmPassword"
        type="password"
        autocomplete="new-password"
      >

    </div>

    <button
      class="btn primary full"
      onclick="studentSubmit()"
      id="studentAuthBtn">
    </button>

    <button
      class="link-button full"
      onclick="studentForgotPassword()"
      id="studentResetBtn">
      Forgot Password?
    </button>

    <button
      class="link-button full"
      onclick="showStudentAuth(
        document.getElementById('studentAuthMode').value === 'create'
          ? 'login'
          : 'create'
      )"
      id="studentToggle">
    </button>
  `;

  showStudentAuth(mode);
}

/* =========================================================
   STUDENT AUTH MODE
   ========================================================= */

function showStudentAuth(mode) {

  const create = mode === "create";

  document.getElementById(
    "studentAuthMode"
  ).value = mode;

  document.getElementById(
    "studentAuthTitle"
  ).textContent =
    create
      ? "Create Student Account"
      : "Student Sign In";

  document.getElementById(
    "studentAuthHelp"
  ).textContent =
    create
      ? "Enter your name, SKANS ID, email and password."
      : "Use your SKANS ID and password to enter the dashboard.";

  document
    .getElementById("studentNameWrap")
    .classList
    .toggle("hidden", !create);

  document
    .getElementById("studentEmailWrap")
    .classList
    .toggle("hidden", !create);

  document
    .getElementById("studentConfirmWrap")
    .classList
    .toggle("hidden", !create);

  document.getElementById(
    "studentAuthBtn"
  ).textContent =
    create
      ? "Create Account"
      : "Sign In";

  document
    .getElementById("studentResetBtn")
    .classList
    .toggle("hidden", create);

  document.getElementById(
    "studentToggle"
  ).textContent =
    create
      ? "Already have an account? Sign In"
      : "Create Student Account";
}

/* =========================================================
   STUDENT SUBMIT
   ========================================================= */

async function studentSubmit() {

  const mode =
    document.getElementById(
      "studentAuthMode"
    ).value;

  if (mode === "create") {
    await createStudent();
  } else {
    await studentLogin();
  }
}

/* =========================================================
   CREATE STUDENT
   ========================================================= */

async function createStudent() {

  const name =
    document
      .getElementById("studentName")
      .value
      .trim();

  const sid =
    document
      .getElementById("studentId")
      .value
      .trim();

  const email =
    document
      .getElementById("studentEmail")
      .value
      .trim();

  const p =
    document
      .getElementById("studentPassword")
      .value;

  const c =
    document
      .getElementById("studentConfirmPassword")
      .value;

  if (!name) {
    return alert("Please enter your name.");
  }

  if (!/^\d{4}$/.test(sid)) {
    return alert(
      "SKANS ID must be exactly 4 digits."
    );
  }

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return alert("Please enter a valid email address.");
  }

  if (p.length < 6) {
    return alert(
      "Password must be at least 6 characters."
    );
  }

  if (p !== c) {
    return alert("Passwords do not match.");
  }

  const db = loadDB();

  if (
    db.users.some(
      u => u.id === sid
    )
  ) {
    return alert(
      "This SKANS ID already has an account."
    );
  }

  const salt = newSalt();

  db.users.push({
    id: sid,
    name: name,
    email: email,
    passwordHash:
      await hashPassword(p, salt),
    salt: salt,
    role: "student",
    createdAt:
      new Date().toISOString()
  });

  saveDB(db);

  alert(
    "Student account created successfully. Please sign in."
  );

  showStudentAuth("login");

  document.getElementById(
    "studentId"
  ).value = sid;
}

/* =========================================================
   STUDENT LOGIN
   ========================================================= */

async function studentLogin() {

  const sid =
    document
      .getElementById("studentId")
      .value
      .trim();

  const p =
    document
      .getElementById("studentPassword")
      .value;

  const db = loadDB();

  if (!/^\d{4}$/.test(sid)) {
    return alert(
      "SKANS ID must be exactly 4 digits."
    );
  }

  const u =
    db.users.find(
      x =>
        x.id === sid &&
        x.role === "student"
    );

  if (!u) {
    return alert(
      "No account found for this SKANS ID."
    );
  }

  const passwordCorrect =
    await hashPassword(
      p,
      u.salt
    ) === u.passwordHash;

  if (!passwordCorrect) {
    return alert(
      "Incorrect password."
    );
  }

  setSession({
    role: "student",
    id: u.id,
    name: u.name
  });

  renderStudent();
}

/* =========================================================
   STUDENT PASSWORD RESET
   ========================================================= */

function studentForgotPassword() {

  const area =
    document.getElementById(
      "loginArea"
    );

  area.innerHTML = `
    <div class="eyebrow">ACCOUNT RECOVERY</div>

    <h2>Reset Student Password</h2>

    <p class="muted small">
      Enter your SKANS ID and registered email.
      A verification code will be sent to your email.
    </p>

    <label>SKANS ID</label>

    <input
      id="resetStudentId"
      inputmode="numeric"
      maxlength="4"
    >

    <label>Registered Email</label>

    <input
      id="resetStudentEmail"
      type="email"
      autocomplete="email"
    >

    <button
      class="btn primary full"
      onclick="sendStudentResetCode()">
      Send Verification Code
    </button>

    <button
      class="link-button full"
      onclick="renderLogin()">
      Back to Login
    </button>
  `;
}

/* =========================================================
   SEND STUDENT OTP
   ========================================================= */

async function sendStudentResetCode() {

  const sid =
    document
      .getElementById(
        "resetStudentId"
      )
      .value
      .trim();

  const email =
    document
      .getElementById(
        "resetStudentEmail"
      )
      .value
      .trim();

  if (!/^\d{4}$/.test(sid)) {
    return alert(
      "SKANS ID must be exactly 4 digits."
    );
  }

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return alert(
      "Please enter a valid email address."
    );
  }

  const db = loadDB();

  const u =
    db.users.find(
      x =>
        x.id === sid &&
        x.role === "student"
    );

  if (!u) {
    return alert(
      "Student account not found."
    );
  }

  if (email !== u.email) {
    return alert(
      "The email does not match the registered email."
    );
  }

  const sent =
    await sendResetOTP(
      u,
      "student"
    );

  if (!sent) return;

  renderStudentOTPForm(sid);
}

/* =========================================================
   STUDENT OTP FORM
   ========================================================= */

function renderStudentOTPForm(sid) {

  const area =
    document.getElementById(
      "loginArea"
    );

  area.innerHTML = `
    <div class="eyebrow">EMAIL VERIFICATION</div>

    <h2>Enter Verification Code</h2>

    <p class="muted small">
      A 6-digit code has been sent to your registered email.
      The code expires in 10 minutes.
    </p>

    <label>Verification Code</label>

    <input
      id="studentOTP"
      inputmode="numeric"
      maxlength="6"
      autocomplete="one-time-code"
    >

    <label>New Password</label>

    <input
      id="studentNewPassword"
      type="password"
      autocomplete="new-password"
    >

    <label>Confirm New Password</label>

    <input
      id="studentNewPasswordConfirm"
      type="password"
      autocomplete="new-password"
    >

    <button
      class="btn primary full"
      onclick="resetStudentPassword()">
      Reset Password
    </button>

    <button
      class="link-button full"
      onclick="studentForgotPassword()">
      Back
    </button>
  `;

  window.currentStudentResetId = sid;
}

/* =========================================================
   RESET STUDENT PASSWORD
   ========================================================= */

async function resetStudentPassword() {

  const sid =
    window.currentStudentResetId;

  if (!sid) {
    return alert(
      "Password reset session expired."
    );
  }

  const otp =
    document
      .getElementById(
        "studentOTP"
      )
      .value
      .trim();

  const p =
    document
      .getElementById(
        "studentNewPassword"
      )
      .value;

  const c =
    document
      .getElementById(
        "studentNewPasswordConfirm"
      )
      .value;

  if (!/^\d{6}$/.test(otp)) {
    return alert(
      "Please enter the 6-digit verification code."
    );
  }

  if (p.length < 6) {
    return alert(
      "Password must be at least 6 characters."
    );
  }

  if (p !== c) {
    return alert(
      "Passwords do not match."
    );
  }

  const key =
    "student_" + sid;

  if (!verifyResetOTP(key, otp)) {
    return;
  }

  const db = loadDB();

  const u =
    db.users.find(
      x =>
        x.id === sid &&
        x.role === "student"
    );

  if (!u) {
    return alert(
      "Student account not found."
    );
  }

  const salt = newSalt();

  u.passwordHash =
    await hashPassword(
      p,
      salt
    );

  u.salt = salt;

  saveDB(db);

  alert(
    "Password reset successfully. Please sign in."
  );

  window.currentStudentResetId = null;

  showStudentAuth("login");

  document.getElementById(
    "studentId"
  ).value = sid;
}

/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

  clearSession();

  if (window.exam) {
    cancelExamListeners?.();
  }

  renderLogin();
}