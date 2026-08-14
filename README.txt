TYPO SKILLS - OFFLINE WRITING TEST SYSTEM

FINAL BUILD
- Starts with a fresh v6 local database.
- No accounts, tests, attempts or results are bundled.
- Uses the supplied Typo Skills logo.
- HTML, CSS, JS and test source are separated.

ADMIN
1. First open -> Create Admin Account.
2. Fields: username, password, confirm password, recovery code and confirmation.
3. Login uses username + password only.
4. Forgot password requires username + recovery code.
5. Create tests and give the exact test code to students.
6. Students do not see a test list.
7. Delete a test -> its submissions and results are deleted too.
8. Manage students -> allow password reset for 24 hours. It expires automatically or immediately after a successful reset.
9. Delete a student -> the student's attempts, submissions and results are deleted.
10. Download a CSV results list from each test's details page.
11. Delete My Account is in the final Danger Zone section and clears all local app data.

STUDENT
1. Create account with Name, SKANS ID, Password and Confirm Password.
2. Login uses SKANS ID + Password only.
3. Enter only the exact test code given by the teacher.
4. No available-test list is shown.
5. Test instructions show the required word limits as text only:
   Part 1: 1–5 words
   Part 2: 20–30 words
   Part 3: 30–40 words per reply
   Informal Email: 40–50 words
   Formal Email: 120–150 words
6. Word counter is shown while answering.
7. If the student uses browser Back, switches to another tab/page, refreshes, closes the page, or leaves the test, the current attempt is automatically submitted as far as browser events permit.
8. Student can delete their own account from the final Danger Zone section.

IMPORTANT OFFLINE LIMITATION
Each computer has its own local browser database. A test created on one computer does not automatically appear on another computer, and submissions do not automatically sync between computers. A shared live database/server is required for automatic multi-computer synchronization.

GITHUB PAGES
The frontend can be hosted on GitHub Pages because it is static HTML/CSS/JS. GitHub Pages does not provide the shared database needed for live cross-device accounts/tests/submissions.
