# Screenshot shot list

The README references these six files by exact name. Drop them in this folder
and the README images will resolve.

| File | What to capture |
| --- | --- |
| `01-sign-in.png` | ✅ Done — extracted from the walkthrough recording. |
| `02-contact-list.png` | `/contacts` with a few contacts, showing the sort/filter controls and the priority badges. |
| `03-add-contact.png` | The **Add contact** dialog filled in, or the list right after saving with the "Contact added" toast visible. |
| `04-invalid-input.png` | The Add contact dialog submitted with an **empty name** — shows the red field and "Name is required." Nothing is sent to the server. |
| `05-mobile.png` | `/contacts` at a phone width (~375px). Use responsive mode in devtools. The layout switches from a table to cards. |
| `06-two-accounts.png` | Two browsers (or one normal + one private window) side by side, signed in as the two test accounts, showing different contact lists. |

## Two-account test

Credentials are in your git-ignored `.env.local` as `TEST_USER_A_*` and
`TEST_USER_B_*`. Sign in as A in a normal window and B in a private window, add
a contact as A, and confirm it never appears for B.

The same property is asserted automatically by `tests/rls.integration.test.ts`,
so this screenshot is corroboration rather than the only proof.
