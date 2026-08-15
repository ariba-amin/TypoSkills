/* =========================================================
   TYPO SKILLS - STUDENT TEST MODULE
   Cleaned & Updated Version
   ========================================================= */

let exam = null;
let timerHandle = null;
let examHandlersAttached = false;


/* =========================================================
   START TEST
   ========================================================= */

function startTest(testId) {

  const db = loadDB();
  const test = db.tests.find(x => x.id === testId);
  const session = getSession();

  if (!test) {
    alert("Test not found.");
    return;
  }

  if (!session || session.role !== "student") {
    renderLogin();
    return;
  }

  /* Prevent duplicate attempt */

  const alreadySubmitted = db.submissions.some(
    submission =>
      submission.testId === testId &&
      submission.studentId === session.id
  );

  if (alreadySubmitted) {
    alert("You have already submitted this test.");
    renderStudent();
    return;
  }


  /* =======================================================
     FLATTEN QUESTIONS
     ======================================================= */

  const flatQuestions = [];

  test.sections.forEach((section, sectionIndex) => {

    section.questions.forEach((question, questionIndex) => {

      flatQuestions.push({
        ...question,

        sectionIndex: sectionIndex,
        questionIndex: questionIndex,

        sectionName: section.name,
        duration: Number(section.duration) || 1,

        instruction: section.instruction || "",
        sectionWordRange: section.wordRange || ""
      });

    });

  });


  if (!flatQuestions.length) {
    alert("This test has no questions.");
    return;
  }


  /* =======================================================
     START INSTRUCTIONS
     ======================================================= */

  const instructions =
`Before you start:

1. Make sure you are ready before starting the test.
2. Changing the browser tab will automatically submit your test.
3. Leaving or refreshing the test page may submit the test.
4. You can attempt this test only once.

Click OK to start the test.`;

  if (!confirm(instructions)) {
    return;
  }


  /* =======================================================
     CREATE EXAM SESSION
     ======================================================= */

  exam = {

    testId: testId,

    flat: flatQuestions,

    index: 0,

    answers: Array(flatQuestions.length).fill(""),

    endAt:
      Date.now() +
      flatQuestions[0].duration * 60 * 1000,

    submitted: false
  };


  /* Browser history entry */

  history.pushState(
    { typoExam: true },
    "",
    `#test-${testId}`
  );


  attachExamLeaveHandlers();

  renderExam();
}


/* =========================================================
   ANTI-CHEATING / LEAVE HANDLERS
   ========================================================= */

function attachExamLeaveHandlers() {

  if (examHandlersAttached) {
    return;
  }

  examHandlersAttached = true;


  window.addEventListener(
    "popstate",
    examNavigationHandler
  );


  document.addEventListener(
    "visibilitychange",
    examVisibilityHandler
  );


  window.addEventListener(
    "beforeunload",
    examBeforeUnloadHandler
  );
}


/* =========================================================
   REMOVE EXAM HANDLERS
   ========================================================= */

function cancelExamListeners() {

  if (!examHandlersAttached) {
    return;
  }

  examHandlersAttached = false;


  window.removeEventListener(
    "popstate",
    examNavigationHandler
  );


  document.removeEventListener(
    "visibilitychange",
    examVisibilityHandler
  );


  window.removeEventListener(
    "beforeunload",
    examBeforeUnloadHandler
  );
}


/* =========================================================
   BROWSER BACK
   ========================================================= */

function examNavigationHandler() {

  if (
    exam &&
    !exam.submitted
  ) {

    submitExam(
      true,
      "You left the test using browser navigation."
    );
  }
}


/* =========================================================
   TAB CHANGE / MINIMIZE
   ========================================================= */

function examVisibilityHandler() {

  if (
    document.visibilityState === "hidden" &&
    exam &&
    !exam.submitted
  ) {

    submitExam(
      true,
      "You left the test page, so your current attempt was submitted automatically."
    );
  }
}


/* =========================================================
   REFRESH / CLOSE
   ========================================================= */

function examBeforeUnloadHandler() {

  if (
    exam &&
    !exam.submitted
  ) {

    submitExam(
      true,
      "Your test was submitted because the page was closed or reloaded.",
      true
    );
  }
}


/* =========================================================
   RENDER EXAM
   ========================================================= */

function renderExam() {

  clearInterval(timerHandle);


  if (!exam) {
    return;
  }


  const db = loadDB();

  const test = db.tests.find(
    x => x.id === exam.testId
  );


  const question =
    exam.flat[exam.index];


  if (!test || !question) {

    submitExam(
      true,
      "The test could not be loaded."
    );

    return;
  }


  const section =
    test.sections[question.sectionIndex];


  if (!section) {

    submitExam(
      true,
      "The test section could not be loaded."
    );

    return;
  }


  const sectionQuestions =
    section.questions.length;


  const progress =
    ((exam.index + 1) /
      exam.flat.length) *
    100;


  /* =======================================================
     TEST SCREEN
     ======================================================= */

  document.getElementById("app").innerHTML = `

    <div class="exam-shell">

      <!-- HEADER -->

      <div class="exam-top">

        <div class="exam-brand">

          <img
            src="assets/typo-skills-logo.png"
            alt="Typo Skills"
            class="exam-logo"
            onerror="this.style.display='none';"
          >

          <div>

            <b>
              ${esc(test.title)}
            </b>

            <div class="muted">

              ${esc(question.sectionName)}

              • Question

              ${question.questionIndex + 1}

              of

              ${sectionQuestions}

            </div>

          </div>

        </div>


        <!-- TIMER -->

        <div
          id="timer"
          class="timer"
        >
          --:--
        </div>

      </div>


      <!-- PROGRESS -->

      <div class="progress">

        <div
          style="width:${progress}%"
        ></div>

      </div>


      <!-- QUESTION CARD -->

      <div class="question-card">


        <!-- SECTION NAME -->

        <div class="question-number">

          ${esc(
            question.sectionName
          ).toUpperCase()}

        </div>


        <!-- INSTRUCTIONS -->

        <div class="instruction-box">

          <strong>
            Instructions:
          </strong>

          ${esc(
            question.instruction || ""
          )}

          <br>

          <strong>
            Answer length:
          </strong>

          ${esc(
            question.wordRange ||
            question.sectionWordRange ||
            "See question instructions"
          )}

        </div>


        <!-- QUESTION -->

        <div class="prompt">

          ${esc(
            question.prompt || ""
          ).replace(/\n/g, "<br>")}

        </div>


        <!-- ANSWER -->

        <textarea
          id="answerBox"
          class="answer"
          placeholder="Write your answer here..."
          autocomplete="off"
          spellcheck="true"
        >${esc(
          exam.answers[exam.index] || ""
        )}</textarea>


        <!-- WORD COUNTER -->

        <div
          id="wordCounter"
          class="word-counter"
        ></div>


        <!-- NAVIGATION -->

        <div class="exam-nav">


          <button
            type="button"
            class="btn danger"
            onclick="confirmExitExam()"
          >
            Leave & Submit
          </button>


          ${
            exam.index <
            exam.flat.length - 1

            ? `

              <button
                type="button"
                class="btn primary"
                onclick="nextQuestion()"
              >
                Next
              </button>

            `

            : `

              <button
                type="button"
                class="btn cyan"
                onclick="submitExam(false, '')"
              >
                Submit Test
              </button>

            `
          }


        </div>

      </div>


      <p class="muted small exam-note">

        Leaving this test, switching to another tab,
        using browser Back, refreshing or closing the page
        will automatically submit your current attempt.

      </p>


    </div>
  `;


  /* =======================================================
     ANSWER BOX
     ======================================================= */

  const answerBox =
    document.getElementById("answerBox");


  if (answerBox) {

    answerBox.addEventListener(
      "input",
      updateWordCounter
    );


    /*
     * ENTER KEY
     *
     * Press Enter to move to next question.
     *
     * For longer writing questions:
     * Shift + Enter creates a new line.
     */

    answerBox.addEventListener(
      "keydown",
      function (event) {

        if (event.key === "Enter") {

          /*
           * Shift + Enter = new line
           */

          if (event.shiftKey) {
            return;
          }


          /*
           * Prevent normal newline
           */

          event.preventDefault();


          /*
           * Move to next question
           */

          if (
            exam &&
            exam.index <
            exam.flat.length - 1
          ) {

            nextQuestion();

          } else {

            submitExam(
              false,
              ""
            );

          }

        }

      }
    );

  }


  updateWordCounter();

  updateTimer();
}


/* =========================================================
   WORD COUNTER
   ========================================================= */

function updateWordCounter() {

  const question =
    exam?.flat?.[exam.index];


  const counter =
    document.getElementById(
      "wordCounter"
    );


  const answer =
    document.getElementById(
      "answerBox"
    );


  if (
    !counter ||
    !answer ||
    !question
  ) {
    return;
  }


  counter.textContent =
    `Current word count: ${countWords(
      answer.value
    )} • Required: ${
      question.wordRange ||
      question.sectionWordRange ||
      "See instructions"
    }`;
}


/* =========================================================
   SAVE CURRENT ANSWER
   ========================================================= */

function saveCurrent() {

  if (!exam) {
    return;
  }


  const answer =
    document.getElementById(
      "answerBox"
    );


  if (answer) {

    exam.answers[
      exam.index
    ] = answer.value;

  }
}


/* =========================================================
   NEXT QUESTION
   ========================================================= */

function nextQuestion() {

  if (!exam) {
    return;
  }


  /* Save current answer */

  saveCurrent();


  const nextIndex =
    exam.index + 1;


  /* No more questions */

  if (
    nextIndex >=
    exam.flat.length
  ) {

    submitExam(
      false,
      ""
    );

    return;
  }


  const currentQuestion =
    exam.flat[exam.index];


  const nextQuestionData =
    exam.flat[nextIndex];


  const oldSection =
    currentQuestion.sectionIndex;


  const newSection =
    nextQuestionData.sectionIndex;


  /* Move */

  exam.index =
    nextIndex;


  /* =======================================================
     NEW SECTION = RESET TIMER
     ======================================================= */

  if (
    newSection !== oldSection
  ) {

    exam.endAt =
      Date.now() +
      nextQuestionData.duration *
      60 *
      1000;
  }


  renderExam();
}


/* =========================================================
   TIMER
   ========================================================= */

function updateTimer() {

  clearInterval(timerHandle);


  const tick = () => {

    if (!exam) {
      return;
    }


    const left =
      Math.max(
        0,
        exam.endAt -
        Date.now()
      );


    const totalSeconds =
      Math.floor(
        left / 1000
      );


    const minutes =
      Math.floor(
        totalSeconds / 60
      );


    const seconds =
      totalSeconds % 60;


    const timer =
      document.getElementById(
        "timer"
      );


    if (!timer) {
      return;
    }


    timer.textContent =
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


    timer.classList.toggle(
      "warning",
      totalSeconds <= 30
    );


    /* Time finished */

    if (left <= 0) {

      clearInterval(
        timerHandle
      );


      saveCurrent();

      sectionTimeUp();
    }

  };


  tick();


  timerHandle =
    setInterval(
      tick,
      250
    );
}


/* =========================================================
   SECTION TIME UP
   ========================================================= */

function sectionTimeUp() {

  if (!exam) {
    return;
  }


  const current =
    exam.flat[
      exam.index
    ];


  const nextIndex =
    exam.index + 1;


  /* Test completely finished */

  if (
    nextIndex >=
    exam.flat.length
  ) {

    submitExam(
      true,
      "Time ended. Your test was submitted automatically."
    );

    return;
  }


  let index =
    nextIndex;


  /*
   * Skip remaining questions
   * from the expired section.
   */

  while (

    index <
    exam.flat.length &&

    exam.flat[index].sectionIndex ===
    current.sectionIndex

  ) {

    index++;

  }


  /*
   * No next section
   */

  if (
    index >=
    exam.flat.length
  ) {

    submitExam(
      true,
      "Time ended. Your test was submitted automatically."
    );

    return;
  }


  /* Move to next section */

  exam.index =
    index;


  /*
   * New section timer
   */

  exam.endAt =
    Date.now() +
    exam.flat[index].duration *
    60 *
    1000;


  renderExam();
}


/* =========================================================
   MANUAL EXIT
   ========================================================= */

function confirmExitExam() {

  const confirmed =
    confirm(
      "Leave the test? Your current answers will be submitted automatically."
    );


  if (!confirmed) {
    return;
  }


  submitExam(
    true,
    "You left the test, so your current attempt was submitted automatically."
  );
}


/* =========================================================
   SUBMIT TEST
   ========================================================= */

function submitExam(
  auto = false,
  message = "",
  silent = false
) {

  if (
    !exam ||
    exam.submitted
  ) {
    return;
  }


  /* Mark submitted */

  exam.submitted = true;


  /* Save latest answer */

  saveCurrent();


  /* Stop timer */

  clearInterval(
    timerHandle
  );


  /* Remove listeners */

  cancelExamListeners();


  const db =
    loadDB();


  const test =
    db.tests.find(
      x => x.id === exam.testId
    );


  const session =
    getSession();


  if (
    !test ||
    !session
  ) {

    exam = null;

    renderLogin();

    return;
  }


  /* =======================================================
     DUPLICATE PROTECTION
     ======================================================= */

  const alreadySubmitted =
    db.submissions.some(
      submission =>

        submission.testId ===
        test.id &&

        submission.studentId ===
        session.id
    );


  if (alreadySubmitted) {

    exam = null;

    renderStudent();

    return;
  }


  /* =======================================================
     PREPARE ANSWERS
     ======================================================= */

  const answers =
    exam.flat.map(
      (question, index) => ({

        questionId:
          question.id,

        prompt:
          question.prompt,

        answer:
          exam.answers[index] || "",

        marks:
          question.marks,

        section:
          question.sectionName

      })
    );


  /* =======================================================
     CREATE SUBMISSION
     ======================================================= */

  db.submissions.push({

    id:
      makeId(),

    testId:
      test.id,

    testTitle:
      test.title,

    studentId:
      session.id,

    studentName:
      session.name,

    answers:
      answers,

    submittedAt:
      new Date().toISOString(),

    autoSubmitted:
      !!auto

  });


  /* Save database */

  saveDB(db);


  /* Clear exam */

  exam = null;


  /* Silent submit */

  if (silent) {
    return;
  }


  /* =======================================================
     SUCCESS SCREEN
     ======================================================= */

  document.getElementById(
    "app"
  ).innerHTML = `

    ${header(
      "Typo Skills • Submitted"
    )}


    <main class="container">

      <div class="success-screen">

        <div class="success-icon">
          ✓
        </div>


        <span class="eyebrow">
          SUBMISSION RECEIVED
        </span>


        <h1>
          Test Submitted
        </h1>


        <p>
          ${esc(
            message ||
            "Your writing test has been submitted successfully."
          )}
        </p>


        <p class="muted">

          The administrator will check
          your answers and publish your result.

        </p>


        <button
          type="button"
          class="btn primary"
          onclick="renderStudent()"
        >
          Back to Dashboard
        </button>

      </div>

    </main>

  `;
}