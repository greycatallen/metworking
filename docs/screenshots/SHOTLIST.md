# Screenshot shot list

The README references these files by exact name.

| File | Status |
| --- | --- |
| `01-sign-in.png` | ✅ Done — frame from the sign-in/sign-out recording |
| `02-contact-list.png` | ✅ Done — frame from the CRUD recording |
| `03-add-contact.png` | ✅ Done — frame from the CRUD recording |
| `04-invalid-input.png` | ⬜ **Needed** |
| `05-mobile.png` | ⬜ **Needed** |
| `06-two-accounts.png` | ✅ Done — composed from clean frames of the two-account recording |

## The three still needed

**`04-invalid-input.png`** — Open **Add contact**, leave the name blank, click
**Add contact**. Capture the red field and "Name is required." Nothing is sent
to the server, which is the point.

**`05-mobile.png`** — Open `/contacts` at a phone width (~375px; Chrome devtools
responsive mode). The layout switches from a table to cards.

The two-account property is also asserted automatically by
`tests/rls.integration.test.ts`, so the screenshot corroborates the tests
rather than being the only proof.

## A note on the source recording

`06-two-accounts.png` was composed from two frames of a screen recording rather
than committing the recording itself. The recording incidentally captured an
editor window displaying both test-account passwords in plaintext, so publishing
it would have leaked working credentials for the live app into public git
history. The two frames used contain no credentials.
