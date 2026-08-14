let exam=null,timerHandle=null;
let examHandlersAttached=false;

function startTest(tid){
  const db=loadDB(),t=db.tests.find(x=>x.id===tid);if(!t)return;
  const s=getSession();if(!s||s.role!=="student")return renderLogin();
  if(db.submissions.some(x=>x.testId===tid&&x.studentId===s.id)){alert("You have already submitted this test.");return renderStudent();}
  const flat=[];t.sections.forEach((sec,si)=>sec.questions.forEach((q,qi)=>flat.push({...q,sectionIndex:si,questionIndex:qi,sectionName:sec.name,duration:sec.duration,instruction:sec.instruction,sectionWordRange:sec.wordRange})));
  if(!flat.length)return alert("This test has no questions.");
  exam={testId:tid,flat,index:0,answers:Array(flat.length).fill(""),endAt:Date.now()+flat[0].duration*60000,submitted:false};
  history.pushState({typoExam:true},"",`#test-${tid}`);
  attachExamLeaveHandlers();
  renderExam();
}
function attachExamLeaveHandlers(){
  if(examHandlersAttached)return;examHandlersAttached=true;
  window.addEventListener("popstate",examNavigationHandler);
  document.addEventListener("visibilitychange",examVisibilityHandler);
  window.addEventListener("beforeunload",examBeforeUnloadHandler);
}
function cancelExamListeners(){
  if(!examHandlersAttached)return;examHandlersAttached=false;
  window.removeEventListener("popstate",examNavigationHandler);document.removeEventListener("visibilitychange",examVisibilityHandler);window.removeEventListener("beforeunload",examBeforeUnloadHandler);
}
function examNavigationHandler(){if(exam&&!exam.submitted)submitExam(true,"You left the test using browser navigation.")}
function examVisibilityHandler(){if(document.visibilityState==="hidden"&&exam&&!exam.submitted)submitExam(true,"You left the test page, so your current attempt was submitted automatically.")}
function examBeforeUnloadHandler(){if(exam&&!exam.submitted)submitExam(true,"Your test was submitted because the page was closed or reloaded.",true)}
function renderExam(){
  clearInterval(timerHandle);const db=loadDB(),t=db.tests.find(x=>x.id===exam.testId),q=exam.flat[exam.index];if(!t||!q)return submitExam(true,"The test could not be loaded.");
  document.getElementById("app").innerHTML=`<div class="exam-shell"><div class="exam-top"><div class="exam-brand"><img src="assets\typo-skills-logo.png" alt="Typo Skills"><div><b>${esc(t.title)}</b><div class="muted">${esc(q.sectionName)} • Question ${q.questionIndex+1} of ${t.sections[q.sectionIndex].questions.length}</div></div></div><div id="timer" class="timer">--:--</div></div><div class="progress"><div style="width:${((exam.index+1)/exam.flat.length)*100}%"></div></div><div class="question-card"><div class="question-number">${esc(q.sectionName).toUpperCase()}</div><div class="instruction-box"><strong>Instructions:</strong> ${esc(q.instruction||"")}<br><strong>Answer length:</strong> ${esc(q.wordRange||q.sectionWordRange||"See question instructions")}</div><div class="prompt">${esc(q.prompt).replace(/\n/g,"<br>")}</div><textarea id="answerBox" class="answer" placeholder="Write your answer here...">${esc(exam.answers[exam.index])}</textarea><div id="wordCounter" class="word-counter"></div><div class="exam-nav"><button class="btn danger" onclick="confirmExitExam()">Leave & Submit</button>${exam.index<exam.flat.length-1?`<button class="btn primary" onclick="nextQuestion()">Next</button>`:`<button class="btn cyan" onclick="submitExam(false,'')">Submit Test</button>`}</div></div><p class="muted small exam-note">Leaving this test, switching to another tab, using browser Back, refreshing or closing the page will automatically submit your current attempt.</p></div>`;
  const a=document.getElementById("answerBox");a?.addEventListener("input",updateWordCounter);updateWordCounter();updateTimer();
}
function updateWordCounter(){const q=exam?.flat?.[exam.index],el=document.getElementById("wordCounter"),a=document.getElementById("answerBox");if(!el||!a)return;el.textContent=`Current word count: ${countWords(a.value)} • Required: ${q.wordRange||q.sectionWordRange||"See instructions"}`}
function saveCurrent(){const a=document.getElementById("answerBox");if(a&&exam)exam.answers[exam.index]=a.value}
function nextQuestion(){saveCurrent();const next=exam.index+1;if(next>=exam.flat.length)return submitExam(false,"");const oldSec=exam.flat[exam.index].sectionIndex,newSec=exam.flat[next].sectionIndex;exam.index=next;if(newSec!==oldSec)exam.endAt=Date.now()+exam.flat[next].duration*60000;renderExam()}
function updateTimer(){clearInterval(timerHandle);const tick=()=>{if(!exam)return;const left=Math.max(0,exam.endAt-Date.now()),sec=Math.floor(left/1000),m=Math.floor(sec/60),s=sec%60,el=document.getElementById("timer");if(!el)return;el.textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;el.classList.toggle("warning",sec<=30);if(left<=0){clearInterval(timerHandle);saveCurrent();sectionTimeUp()}};tick();timerHandle=setInterval(tick,250)}
function sectionTimeUp(){const current=exam.flat[exam.index],next=exam.index+1;if(next>=exam.flat.length)return submitExam(true,"Time ended. Your test was submitted automatically.");let idx=next;while(idx<exam.flat.length&&exam.flat[idx].sectionIndex===current.sectionIndex)idx++;if(idx>=exam.flat.length)return submitExam(true,"Time ended. Your test was submitted automatically.");exam.index=idx;exam.endAt=Date.now()+exam.flat[idx].duration*60000;renderExam()}
function confirmExitExam(){if(confirm("Leave the test? Your current answers will be submitted automatically."))submitExam(true,"You left the test, so your current attempt was submitted automatically.")}
function submitExam(auto=false,message="",silent=false){
  if(!exam||exam.submitted)return;exam.submitted=true;saveCurrent();clearInterval(timerHandle);cancelExamListeners();
  const db=loadDB(),t=db.tests.find(x=>x.id===exam.testId),s=getSession();if(!t||!s){exam=null;return renderLogin();}
  if(db.submissions.some(x=>x.testId===t.id&&x.studentId===s.id)){exam=null;return renderStudent();}
  const answers=exam.flat.map((q,i)=>({questionId:q.id,prompt:q.prompt,answer:exam.answers[i]||"",marks:q.marks,section:q.sectionName}));
  db.submissions.push({id:makeId(),testId:t.id,testTitle:t.title,studentId:s.id,studentName:s.name,answers,submittedAt:new Date().toISOString(),autoSubmitted:!!auto});saveDB(db);exam=null;
  if(silent)return;
  document.getElementById("app").innerHTML=`${header("Typo Skills • Submitted")}<main class="container"><div class="success-screen"><div class="success-icon">✓</div><span class="eyebrow">SUBMISSION RECEIVED</span><h1>Test Submitted</h1><p>${esc(message||"Your writing test has been submitted successfully.")}</p><p class="muted">The administrator will check your answers and publish your result.</p><button class="btn primary" onclick="renderStudent()">Back to Dashboard</button></div></main>`;
}
