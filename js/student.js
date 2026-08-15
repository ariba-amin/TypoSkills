/* =========================================================
   STUDENT DASHBOARD
   ========================================================= */

function renderStudent() {
  const session = getSession();
  const db = loadDB();

  if (!session || session.role !== "student") {
    return renderLogin();
  }

  const results = Array.isArray(db.results)
    ? db.results.filter(
        result =>
          result &&
          String(result.studentId) === String(session.id)
      )
    : [];

  const submissions = Array.isArray(db.submissions)
    ? db.submissions.filter(
        submission =>
          submission &&
          String(submission.studentId) === String(session.id)
      )
    : [];

  document.getElementById("app").innerHTML = `
    ${header("Typo Skills • Student")}

    <main class="container">

      <!-- STUDENT HERO -->
      <section class="hero student-hero">

        <div>
          <span class="eyebrow">
            STUDENT DASHBOARD
          </span>

          <h1>
            Welcome, ${esc(session.name)}
          </h1>

          <p>
            SKANS ID:
            <strong>${esc(session.id)}</strong>
          </p>
        </div>

        <div class="student-avatar">
          ${initials(session.name)}
        </div>

      </section>


      <!-- STUDENT STATS -->
      <div class="student-info-grid">

        <div class="info-card accent">
          <span>Tests Attempted</span>
          <strong>${submissions.length}</strong>
        </div>

        <div class="info-card">
          <span>Published Results</span>
          <strong>${results.length}</strong>
        </div>

        <div class="info-card">
          <span>Test Access</span>
          <strong>Code Required</strong>
        </div>

      </div>


      <!-- TEST ACCESS -->
      <section class="card student-start">

        <div class="section-icon">
          T
        </div>

        <div class="start-content">

          <span class="eyebrow">
            TEST ACCESS
          </span>

          <h2>
            Enter Your Test Code
          </h2>

          <p class="muted">
            Your teacher will give you the code for the
            test you need to take. Other tests are not
            listed or shown here.
          </p>

          <div class="code-input-row">

            <input
              id="accessCode"
              type="text"
              maxlength="50"
              placeholder="Enter test code"
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
              oninput="normalizeAccessCodeInput(this)"
              onkeydown="handleAccessCodeKeydown(event)"
            >

            <button
              type="button"
              class="btn primary"
              onclick="startByCode()"
            >
              Open Test
            </button>

          </div>

          <div id="studentNotice"></div>

        </div>

      </section>


      <!-- RESULTS -->
      <section class="section-block">

        <div class="section-head">

          <div>

            <span class="eyebrow">
              RESULTS
            </span>

            <h2>
              My Results
            </h2>

            <p class="muted">
              Only results published by the administrator
              appear here.
            </p>

          </div>

        </div>


        <div class="list">

          ${
            results.length
              ? results
                  .map(
                    result => `
                      <div class="list-item">

                        <div>

                          <strong>
                            ${esc(result.testTitle || "Untitled Test")}
                          </strong>

                          <span class="muted">
                            Published
                            ${
                              result.publishedAt
                                ? new Date(
                                    result.publishedAt
                                  ).toLocaleString()
                                : "—"
                            }
                          </span>

                        </div>

                        <div class="actions">

                          <span class="badge">
                            ${result.obtained ?? 0}/${result.total ?? 0}
                            •
                            ${result.percentage ?? 0}%
                          </span>

                          <button
                            type="button"
                            class="btn secondary"
                            onclick="showStudentResult('${esc(result.id)}')"
                          >
                            View Result
                          </button>

                        </div>

                      </div>
                    `
                  )
                  .join("")
              : `
                <div class="empty">

                  <strong>
                    No published results yet
                  </strong>

                  <span>
                    Your results will appear here after
                    the administrator publishes them.
                  </span>

                </div>
              `
          }

        </div>

      </section>

    </main>
  `;
}


/* =========================================================
   TEST CODE INPUT HANDLING
   ========================================================= */

function normalizeAccessCode(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}


function normalizeAccessCodeInput(input) {
  if (!input) {
    return;
  }

  const cleaned = normalizeAccessCode(input.value);

  if (input.value !== cleaned) {
    input.value = cleaned;
  }
}


function handleAccessCodeKeydown(event) {
  if (!event) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    startByCode();
  }
}


/* =========================================================
   TEST CODE ACCESS
   ========================================================= */

function startByCode() {
  const input = document.getElementById("accessCode");
  const notice = document.getElementById("studentNotice");
  const session = getSession();
  const db = loadDB();

  if (!session || session.role !== "student") {
    return renderLogin();
  }

  if (!input) {
    return;
  }

  const code = normalizeAccessCode(input.value);

  input.value = code;

  if (!code) {

    if (notice) {
      notice.innerHTML = `
        <div class="notice error">
          Please enter the test code given by your teacher.
        </div>
      `;
    }

    input.focus();
    return;
  }


  /* -------------------------------------------------------
     FIND TEST
     ------------------------------------------------------- */

  const test =
    Array.isArray(db.tests)
      ? db.tests.find(item => {

          if (!item || item.code === undefined) {
            return false;
          }

          const storedCode =
            normalizeAccessCode(item.code);

          return storedCode === code;
        })
      : null;


  if (!test) {

    if (notice) {
      notice.innerHTML = `
        <div class="notice error">
          Test code not found.
          Please check the code with your teacher.
        </div>
      `;
    }

    input.focus();
    input.select();

    return;
  }


  /* -------------------------------------------------------
     PREVENT DUPLICATE ATTEMPT
     ------------------------------------------------------- */

  const alreadySubmitted =
    Array.isArray(db.submissions) &&
    db.submissions.some(
      submission =>
        submission &&
        String(submission.testId) === String(test.id) &&
        String(submission.studentId) === String(session.id)
    );


  if (alreadySubmitted) {

    if (notice) {
      notice.innerHTML = `
        <div class="notice error">
          You have already submitted this test.
          You cannot attempt it again.
        </div>
      `;
    }

    return;
  }


  /* -------------------------------------------------------
     START TEST
     ------------------------------------------------------- */

  startTest(test.id);
}


/* =========================================================
   SHOW STUDENT RESULT
   ========================================================= */

function showStudentResult(resultId) {

  const db = loadDB();
  const session = getSession();


  /* -------------------------------------------------------
     SECURITY CHECK
     ------------------------------------------------------- */

  if (
    !session ||
    session.role !== "student"
  ) {
    return renderLogin();
  }


  /* -------------------------------------------------------
     FIND RESULT
     ------------------------------------------------------- */

  const result =
    Array.isArray(db.results)
      ? db.results.find(
          item =>
            item &&
            String(item.id) ===
              String(resultId)
        )
      : null;


  if (!result) {
    alert("Result not found.");
    return;
  }


  /* -------------------------------------------------------
     STUDENT CAN ONLY VIEW THEIR OWN RESULT
     ------------------------------------------------------- */

  if (
    String(result.studentId) !==
    String(session.id)
  ) {
    alert(
      "You are not allowed to view this result."
    );

    return;
  }


  /* -------------------------------------------------------
     ANSWERS
     ------------------------------------------------------- */

  const answers =
    Array.isArray(result.answers)
      ? result.answers
      : [];


  document.getElementById("app").innerHTML = `

    ${header("Typo Skills • Result")}

    <main class="container">

      <div class="page-title">

        <span class="eyebrow">
          PUBLISHED RESULT
        </span>

        <h1>
          ${esc(result.testTitle || "Test Result")}
        </h1>

        <p class="muted">
          Result for
          ${esc(result.studentName || session.name)}
        </p>

      </div>


      <!-- RESULT SUMMARY -->

      <div class="result-box">

        <div class="result-stat">

          <span>
            Obtained
          </span>

          <b>
            ${result.obtained ?? 0}
          </b>

        </div>


        <div class="result-stat">

          <span>
            Total
          </span>

          <b>
            ${result.total ?? 0}
          </b>

        </div>


        <div class="result-stat">

          <span>
            Percentage
          </span>

          <b>
            ${result.percentage ?? 0}%
          </b>

        </div>

      </div>


      <!-- ANSWERS -->

      <div class="list">

        ${
          answers.length
            ? answers
                .map(
                  (answer, index) => `

                    <div class="card">

                      <div class="badge">

                        Question ${index + 1}

                        •

                        ${answer.awarded ?? 0}/
                        ${answer.marks ?? 0}

                      </div>


                      <h3>

                        ${esc(
                          answer.prompt || ""
                        ).replace(
                          /\n/g,
                          "<br>"
                        )}

                      </h3>


                      <p class="answer-preview">

                        ${
                          esc(answer.answer || "") ||
                          "<span class='muted'>No answer</span>"
                        }

                      </p>


                      ${
                        answer.feedback
                          ? `
                            <div class="notice info">

                              <b>
                                Feedback:
                              </b>

                              ${esc(
                                answer.feedback
                              )}

                            </div>
                          `
                          : ""
                      }

                    </div>

                  `
                )
                .join("")
            : `
              <div class="empty">

                <strong>
                  No answer details available.
                </strong>

              </div>
            `
        }

      </div>


      <!-- BACK BUTTON -->

      <button
        type="button"
        class="btn secondary back-button"
        onclick="renderStudent()"
      >
        Back to Dashboard
      </button>

    </main>
  `;
}