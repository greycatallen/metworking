# Screenshot shot list

The README references these files by exact name.

| File | Status |
| --- | --- |
| `01-sign-in.png` | ✅ Done — frame from the sign-in/sign-out recording |
| `02-contact-list.png` | ✅ Done — frame from the CRUD recording |
| `03-add-contact.png` | ✅ Done — frame from the CRUD recording |
| `04-invalid-input.png` | ⬜ **Needed** |
| `05-mobile.png` | ⬜ **Needed** |
| `06-two-accounts.png` | ⬜ **Needed** |

## The three still needed

**`04-invalid-input.png`** — Open **Add contact**, leave the name blank, click
**Add contact**. Capture the red field and "Name is required." Nothing is sent
to the server, which is the point.

**`05-mobile.png`** — Open `/contacts` at a phone width (~375px; Chrome devtools
responsive mode). The layout switches from a table to cards.

**`06-two-accounts.png`** — Sign in as User A in a normal window and User B in a
private window, side by side. A has contacts; B shows the empty state.
Credentials are in your git-ignored `.env.local` (`TEST_USER_A_*`, `TEST_USER_B_*`).

The two-account property is also asserted automatically by
`tests/rls.integration.test.ts`, so this screenshot corroborates the tests
rather than being the only proof.
