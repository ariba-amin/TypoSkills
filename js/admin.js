function renderAdmin(){
  const db=loadDB();

  document.getElementById("app").innerHTML=`${header("Typo Skills • Admin")}<main class="container">
    
    <section class="hero admin-hero">
      <div>
        <span class="eyebrow light">ADMIN CONTROL CENTER</span>
        <h1>Admin Dashboard</h1>
        <p>Manage tests, students, submissions and published results with ease.</p>
      </div>
      <div class="hero-logo">${logoMarkup("hero-logo-img")}</div>
    </section>

    <div class="grid stats-grid">
      <div class="stat-card">
        <span>Tests</span>
        <strong>${db.tests.length}</strong>
        <small>Created tests</small>
      </div>

      <div class="stat-card">
        <span>Students</span>
        <strong>${db.users.length}</strong>
        <small>Registered accounts</small>
      </div>

      <div class="stat-card">
        <span>Submissions</span>
        <strong>${db.submissions.length}</strong>
        <small>Total attempts</small>
      </div>

      <div class="stat-card">
        <span>Results</span>
        <strong>${db.results.length}</strong>
        <small>Published results</small>
      </div>
    </div>

    <div class="card quick-card">
      <div>
        <span class="eyebrow">QUICK ACTIONS</span>
        <h2>Manage your test system</h2>
        <p class="muted">
          Create a test, manage student accounts, or review submissions.
        </p>
      </div>

      <div class="actions">
        <button class="btn cyan" onclick="makeTest()">
          + Create New Test
        </button>

        <button class="btn secondary" onclick="manageStudents()">
          Student Accounts
        </button>
      </div>
    </div>

    <section class="section-block">
      <div class="section-head">
        <div>
          <span class="eyebrow">TEST LIBRARY</span>
          <h2>Created Tests</h2>
          <p class="muted">
            Students can access a test only with the exact code you give them.
          </p>
        </div>
      </div>

      <div class="list">
        ${db.tests.length
          ? db.tests.map(t=>`
            <div class="list-item">
              <div>
                <strong>${esc(t.title)}</strong>
                <span class="muted">
                  ${t.sections.reduce((n,s)=>n+s.questions.length,0)}
                  questions • Code: <b>${esc(t.code)}</b>
                </span>
              </div>

              <div class="actions">
                <button class="btn secondary" onclick="viewTest('${t.id}')">
                  View
                </button>

                <button class="btn danger" onclick="deleteTest('${t.id}')">
                  Delete
                </button>
              </div>
            </div>
          `).join("")
          : `
            <div class="empty">
              <strong>No tests yet</strong>
              <span>Create your first writing test to get started.</span>
            </div>
          `
        }
      </div>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <span class="eyebrow">SUBMISSIONS</span>
          <h2>Student Submissions</h2>
          <p class="muted">
            Check answers, award marks and publish results.
          </p>
        </div>
      </div>

      <div class="list">
        ${db.submissions.length
          ? db.submissions.map(s=>{
              const r=db.results.find(x=>x.submissionId===s.id);

              return `
                <div class="list-item">
                  <div>
                    <strong>
                      ${esc(s.studentName)}
                      <span class="muted">
                        (${esc(s.studentId)})
                      </span>
                    </strong>

                    <span class="muted">
                      ${esc(s.testTitle)} •
                      ${new Date(s.submittedAt).toLocaleString()}
                      ${s.autoSubmitted ? "• Auto-submitted" : ""}
                    </span>

                    <div class="submission-status">
                      ${
                        r
                        ? `
                          <span class="badge success-badge">
                            Checked
                          </span>
                          <b>
                            ${r.obtained}/${r.total} • ${r.percentage}%
                          </b>
                        `
                        : `
                          <span class="badge pending">
                            Pending review
                          </span>
                        `
                      }
                    </div>
                  </div>

                  <button
                    class="btn primary"
                    onclick="markSubmission('${s.id}')"
                  >
                    ${r ? "Edit Result" : "Check / Mark"}
                  </button>
                </div>
              `;
            }).join("")
          : `
            <div class="empty">
              <strong>No submissions yet</strong>
              <span>
                Student attempts will appear here after submission.
              </span>
            </div>
          `
        }
      </div>
    </section>

  </main>`;
}


function manageStudents(){
  const db=loadDB();

  document.getElementById("app").innerHTML=`${header("Typo Skills • Student Accounts")}
  <main class="container">

    <div class="page-title">
      <span class="eyebrow">ACCOUNT MANAGEMENT</span>
      <h1>Student Accounts</h1>
      <p class="muted">
        Allow a student to reset their password for 24 hours when needed.
      </p>
    </div>

    <div class="actions top-actions">
      <button class="btn cyan" onclick="addStudentByAdmin()">
        + Create Student Account
      </button>

      <button class="btn secondary" onclick="renderAdmin()">
        Back to Dashboard
      </button>
    </div>

    <div class="list" style="margin-top:18px">

      ${
        db.users.length
        ? db.users.map(u=>{
            const active=isResetActive(u);

            return `
              <div class="list-item">
                <div>
                  <strong>${esc(u.name)}</strong>

                  <span class="muted">
                    SKANS ID: ${esc(u.id)}
                  </span>

                  <div class="submission-status">
                    ${
                      active
                      ? `
                        <span class="badge warning-badge">
                          Reset allowed for 24 hours
                        </span>
                      `
                      : `
                        <span class="badge">
                          Reset locked
                        </span>
                      `
                    }
                  </div>
                </div>

                <div class="actions">
                  <button
                    class="btn ${active ? "danger" : "success"}"
                    onclick="toggleStudentReset('${u.id}')"
                  >
                    ${active ? "Lock Reset" : "Allow Reset (24h)"}
                  </button>

                  <button
                    class="btn danger"
                    onclick="deleteStudentByAdmin('${u.id}')"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            `;
          }).join("")
        : `
          <div class="empty">
            <strong>No student accounts</strong>
            <span>Create one from the button above.</span>
          </div>
        `
      }

    </div>
  </main>`;
}


async function addStudentByAdmin(){
  const name=prompt("Student full name:")?.trim();

  if(!name)return;

  const sid=prompt("4-digit SKANS ID:")?.trim();

  if(!/^\d{4}$/.test(sid||"")){
    return alert("SKANS ID must be exactly 4 digits.");
  }

  const p=prompt("Student password (minimum 6 characters):");

  if(!p||p.length<6){
    return alert("Password must be at least 6 characters.");
  }

  const db=loadDB();

  if(db.users.some(u=>u.id===sid)){
    return alert("This SKANS ID already exists.");
  }

  const salt=newSalt();

  db.users.push({
    id:sid,
    name,
    passwordHash:await hashPassword(p,salt),
    salt,
    role:"student",
    resetAllowed:false,
    createdAt:new Date().toISOString()
  });

  saveDB(db);

  alert("Student account created successfully.");

  manageStudents();
}


function toggleStudentReset(sid){
  const db=loadDB();
  const u=db.users.find(x=>x.id===sid);

  if(!u)return;

  const active=isResetActive(u);

  if(active){
    u.resetAllowed=false;
    delete u.resetAllowedAt;
  }else{
    u.resetAllowed=true;
    u.resetAllowedAt=new Date().toISOString();
  }

  saveDB(db);
  manageStudents();
}


function deleteStudentByAdmin(sid){
  const db=loadDB();
  const u=db.users.find(x=>x.id===sid);

  if(!u)return;

  if(!confirm(
    `Delete ${u.name}'s account and all related attempts/results?`
  ))return;

  const submissionIds=new Set(
    db.submissions
      .filter(s=>s.studentId===sid)
      .map(s=>s.id)
  );

  db.users=db.users.filter(x=>x.id!==sid);

  db.submissions=db.submissions.filter(
    s=>s.studentId!==sid
  );

  db.results=db.results.filter(
    r=>r.studentId!==sid &&
       !submissionIds.has(r.submissionId)
  );

  saveDB(db);

  manageStudents();
}


function makeTest(){
  document.getElementById("app").innerHTML=`${header("Typo Skills • Create Test")}
  <main class="container">

    <div class="page-title">
      <span class="eyebrow">TEST BUILDER</span>
      <h1>Create a Writing Test</h1>
      <p class="muted">
        Students will see clear word-limit and timing instructions before each section.
      </p>
    </div>

    <div class="card form-card">

      <label>Test Title</label>
      <input
        id="testTitle"
        placeholder="e.g. Typo Skills Writing Test"
      >

      <label>Test Code</label>
      <input
        id="testCode"
        value="${makeId().slice(0,6)}"
        maxlength="12"
      >

      <div class="question-row">
        <div class="q-head">
          <b>Part 1 — Word-Level Writing</b>
          <span class="badge">
            5 questions • 3 minutes • 1–5 words
          </span>
        </div>

        <p class="muted">
          Instruction shown to students: Write 1–5 words for each answer.
        </p>

        <div id="part1Builder"></div>
      </div>

      <div class="question-row">
        <div class="q-head">
          <b>Part 2 — Short Text Writing</b>
          <span class="badge">
            7 minutes • 20–30 words
          </span>
        </div>

        <label>Question / Prompt</label>
        <textarea id="part2Prompt"></textarea>

        <label>Marks</label>
        <input
          id="part2Marks"
          type="number"
          min="1"
          value="3"
        >
      </div>

      <div class="question-row">
        <div class="q-head">
          <b>Part 3 — Social Network / Chatroom</b>
          <span class="badge">
            3 questions • 10 minutes • 30–40 words
          </span>
        </div>

        <p class="muted">
          Instruction shown to students: Write 30–40 words for each reply.
        </p>

        <div id="part3Builder"></div>
      </div>

      <div class="question-row">
        <div class="q-head">
          <b>Part 4 — Formal & Informal Email</b>
          <span class="badge">
            30 minutes
          </span>
        </div>

        <p class="muted">
          Informal: 40–50 words. Formal: 120–150 words.
        </p>

        <label>Scenario / Notice</label>
        <textarea id="part4Scenario"></textarea>

        <label>Informal Email Prompt</label>
        <textarea id="part4Informal"></textarea>

        <label>Informal Email Marks</label>
        <input
          id="part4InformalMarks"
          type="number"
          min="1"
          value="3"
        >

        <label>Formal Email Prompt</label>
        <textarea id="part4Formal"></textarea>

        <label>Formal Email Marks</label>
        <input
          id="part4FormalMarks"
          type="number"
          min="1"
          value="5"
        >
      </div>

      <div class="actions form-actions">
        <button class="btn primary" onclick="saveTest()">
          Save Test
        </button>

        <button class="btn secondary" onclick="renderAdmin()">
          Cancel
        </button>
      </div>

    </div>
  </main>`;

  for(let i=1;i<=5;i++){
    addBuilderQuestion("part1Builder",i);
  }

  for(let i=1;i<=3;i++){
    addBuilderQuestion("part3Builder",i);
  }
}


function addBuilderQuestion(container,n){
  const box=document.getElementById(container);
  const d=document.createElement("div");

  d.className="builder-question";

  d.innerHTML=`
    <div class="q-head">
      <b>Question ${n}</b>
    </div>

    <label>Question / Prompt</label>
    <textarea class="qprompt"></textarea>

    <label>Marks</label>
    <input
      class="qmarks"
      type="number"
      min="1"
      value="1"
    >
  `;

  box.appendChild(d);
}


function saveTest(){

  const title=document.getElementById("testTitle").value.trim();

  const code=document
    .getElementById("testCode")
    .value
    .trim()
    .toUpperCase();

  const p1=[
    ...document.querySelectorAll(
      "#part1Builder .builder-question"
    )
  ]
  .map(r=>({
    id:makeId(),
    prompt:r.querySelector(".qprompt").value.trim(),
    marks:Number(r.querySelector(".qmarks").value)||1
  }))
  .filter(q=>q.prompt);

  const p2=document
    .getElementById("part2Prompt")
    .value
    .trim();

  const p2m=Number(
    document.getElementById("part2Marks").value
  )||1;

  const p3=[
    ...document.querySelectorAll(
      "#part3Builder .builder-question"
    )
  ]
  .map(r=>({
    id:makeId(),
    prompt:r.querySelector(".qprompt").value.trim(),
    marks:Number(r.querySelector(".qmarks").value)||1
  }))
  .filter(q=>q.prompt);

  const sc=document
    .getElementById("part4Scenario")
    .value
    .trim();

  const inf=document
    .getElementById("part4Informal")
    .value
    .trim();

  const infm=Number(
    document.getElementById("part4InformalMarks").value
  )||1;

  const form=document
    .getElementById("part4Formal")
    .value
    .trim();

  const formm=Number(
    document.getElementById("part4FormalMarks").value
  )||1;

  if(
    !title||
    !code||
    p1.length!==5||
    !p2||
    p3.length!==3||
    !sc||
    !inf||
    !form
  ){
    return alert(
      "Complete all four sections. Part 1 needs 5 questions and Part 3 needs 3 questions."
    );
  }

  if(!/^[A-Z0-9_-]{3,12}$/.test(code)){
    return alert(
      "Test code can contain only letters, numbers, underscore or hyphen."
    );
  }

  const db=loadDB();

  if(
    db.tests.some(
      t=>t.code.toLowerCase()===code.toLowerCase()
    )
  ){
    return alert("This test code already exists.");
  }

  const sections=[

    {
      id:makeId(),
      name:"Part 1 — Word-Level Writing",
      duration:3,
      instruction:"Write a single word or a very short phrase for each answer.",
      wordRange:"1–5 words",
      questions:p1
    },

    {
      id:makeId(),
      name:"Part 2 — Short Text Writing",
      duration:7,
      instruction:"Write a full, grammatically correct response.",
      wordRange:"20–30 words",
      questions:[
        {
          id:makeId(),
          prompt:p2,
          marks:p2m,
          wordRange:"20–30 words"
        }
      ]
    },

    {
      id:makeId(),
      name:"Part 3 — Social Network / Chatroom Responses",
      duration:10,
      instruction:"Answer in a casual, conversational style.",
      wordRange:"30–40 words per reply",
      questions:p3.map(q=>({
        ...q,
        wordRange:"30–40 words"
      }))
    },

    {
      id:makeId(),
      name:"Part 4 — Formal & Informal Email Writing",
      duration:30,
      instruction:"Read the scenario, then write the required email.",
      wordRange:"See the word limit shown for each question.",
      questions:[
        {
          id:makeId(),
          prompt:`SCENARIO / NOTICE:
${sc}

INFORMAL EMAIL:
${inf}`,
          marks:infm,
          wordRange:"40–50 words"
        },

        {
          id:makeId(),
          prompt:`SCENARIO / NOTICE:
${sc}

FORMAL EMAIL:
${form}`,
          marks:formm,
          wordRange:"120–150 words"
        }
      ]
    }

  ];

  const totalMarks=sections.reduce(
    (a,s)=>a+s.questions.reduce(
      (b,q)=>b+q.marks,
      0
    ),
    0
  );

  db.tests.push({
    id:makeId(),
    title,
    code,
    sections,
    totalMarks,
    createdAt:new Date().toISOString()
  });

  saveDB(db);

  alert("Test saved successfully.");

  renderAdmin();
}


function viewTest(tid){

  const db=loadDB();
  const t=db.tests.find(x=>x.id===tid);

  if(!t)return;

  document.getElementById("app").innerHTML=`
    ${header("Typo Skills • Test Details")}

    <main class="container">

      <div class="page-title">
        <span class="eyebrow">TEST DETAILS</span>
        <h1>${esc(t.title)}</h1>

        <p class="muted">
          Access Code:
          <strong>${esc(t.code)}</strong>
          • ${t.totalMarks} total marks
        </p>
      </div>

      ${t.sections.map(s=>`

        <div class="card section-preview">

          <div class="toolbar">
            <h2>${esc(s.name)}</h2>
            <span class="badge">
              ${s.duration} minutes
            </span>
          </div>

          <div class="instruction-box">
            <strong>Student instruction:</strong>
            ${esc(s.instruction)}
            <br>

            <strong>Answer length:</strong>
            ${esc(s.wordRange)}
          </div>

          ${s.questions.map((q,i)=>`

            <div class="question-row">
              <b>Question ${i+1}</b>

              <div class="prompt-preview">
                ${esc(q.prompt).replace(/\n/g,"<br>")}
              </div>

              <div class="muted">
                ${q.marks} mark(s) •
                ${esc(q.wordRange||s.wordRange||"")}
              </div>
            </div>

          `).join("")}

        </div>

      `).join("")}

      <div class="actions">

        <button
          class="btn secondary"
          onclick="downloadTestResults('${t.id}')"
        >
          Download Results List
        </button>

        <button
          class="btn secondary"
          onclick="renderAdmin()"
        >
          Back to Dashboard
        </button>

      </div>

    </main>
  `;
}


function deleteTest(tid){

  const db=loadDB();
  const t=db.tests.find(x=>x.id===tid);

  if(!t)return;

  if(!confirm(
    `Delete “${t.title}” and every attempt/result connected to it?`
  ))return;

  const ids=new Set(
    db.submissions
      .filter(s=>s.testId===tid)
      .map(s=>s.id)
  );

  db.tests=db.tests.filter(
    x=>x.id!==tid
  );

  db.submissions=db.submissions.filter(
    s=>s.testId!==tid
  );

  db.results=db.results.filter(
    r=>r.testId!==tid &&
       !ids.has(r.submissionId)
  );

  saveDB(db);

  renderAdmin();
}


function downloadTestResults(tid){

  const db=loadDB();
  const t=db.tests.find(x=>x.id===tid);

  if(!t)return;

  const rows=db.submissions
    .filter(s=>s.testId===tid)
    .map(s=>{

      const r=db.results.find(
        x=>x.submissionId===s.id
      );

      return [
        s.studentId,
        s.studentName,
        r?`${r.obtained}/${r.total}`:"Pending",
        r?.obtained??"",
        r?.percentage??"",
        s.submittedAt
      ];
    });

  const csv=[
    [
      "SKANS ID",
      "Student Name",
      "Marks",
      "Obtained",
      "Percentage",
      "Submitted At"
    ],
    ...rows
  ]
  .map(row=>
    row
      .map(v=>`"${String(v??"").replace(/"/g,'""')}"`)
      .join(",")
  )
  .join("\n");

  downloadBlob(
    `${t.code}_results.csv`,
    csv,
    "text/csv;charset=utf-8"
  );
}


function markSubmission(sid){

  const db=loadDB();

  const s=db.submissions.find(
    x=>x.id===sid
  );

  const t=db.tests.find(
    x=>x.id===s?.testId
  );

  if(!s)return;

  const existing=db.results.find(
    r=>r.submissionId===sid
  );

  document.getElementById("app").innerHTML=`
    ${header("Typo Skills • Marking")}

    <main class="container">

      <div class="page-title">

        <span class="eyebrow">
          MANUAL MARKING
        </span>

        <h1>
          ${existing ? "Edit Result" : "Check Submission"}
        </h1>

        <p class="muted">
          ${esc(s.studentName)}
          • SKANS ID: ${esc(s.studentId)}
          • ${esc(t?.title||"Test")}
        </p>

      </div>

      ${s.answers.map((a,i)=>{

        const old=existing?.answers?.[i];

        return `
          <div class="card mark-card">

            <div class="badge">
              Question ${i+1} • ${a.marks} max
            </div>

            <h3>
              ${esc(a.prompt).replace(/\n/g,"<br>")}
            </h3>

            <div class="answer-preview">
              ${
                esc(a.answer) ||
                "<span class='muted'>No answer</span>"
              }
            </div>

            <label>
              Marks awarded
            </label>

            <input
              class="award"
              data-i="${i}"
              type="number"
              min="0"
              max="${a.marks}"
              value="${old?.awarded??0}"
            >

            <label>
              Feedback
            </label>

            <textarea
              class="feedback"
              data-i="${i}"
            >${esc(old?.feedback||"")}</textarea>

          </div>
        `;

      }).join("")}

      <div class="card form-actions">

        <button
          class="btn primary"
          onclick="publishMarking('${sid}')"
        >
          ${existing
            ? "Update & Publish"
            : "Save & Publish Result"
          }
        </button>

        <button
          class="btn secondary"
          onclick="renderAdmin()"
        >
          Cancel
        </button>

      </div>

    </main>
  `;
}


function publishMarking(sid){

  const db=loadDB();

  const s=db.submissions.find(
    x=>x.id===sid
  );

  const t=db.tests.find(
    x=>x.id===s?.testId
  );

  if(!s)return;

  const awards=[
    ...document.querySelectorAll(".award")
  ];

  const feedback=[
    ...document.querySelectorAll(".feedback")
  ];

  let obtained=0;
  let total=0;

  s.answers.forEach((a,i)=>{

    const m=Math.max(
      0,
      Math.min(
        a.marks,
        Number(awards[i].value)||0
      )
    );

    a.awarded=m;
    a.feedback=feedback[i].value;

    obtained+=m;
    total+=a.marks;

  });

  const percentage=
    total
    ? Math.round(obtained/total*100)
    : 0;

  db.results=db.results.filter(
    r=>r.submissionId!==sid
  );

  db.results.push({
    id:makeId(),
    submissionId:sid,
    testId:t.id,
    testTitle:t.title,
    studentId:s.studentId,
    studentName:s.studentName,
    obtained,
    total,
    percentage,
    answers:s.answers,
    publishedAt:new Date().toISOString()
  });

  saveDB(db);

  alert("Result published successfully.");

  renderAdmin();
}