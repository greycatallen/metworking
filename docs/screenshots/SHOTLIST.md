# Screenshots

All required screenshots are present.

| File | Source |
| --- | --- |
| `01-sign-in.png` | Frame from the sign-in/sign-out recording |
| `02-contact-list.png` | Frame from the CRUD recording |
| `03-add-contact.png` | Frame from the CRUD recording |
| `04-invalid-input.png` | Blank contact name rejected in the UI |
| `05-mobile.png` | Real phone on the live URL (account email redacted) |
| `06-two-accounts.png` | Composed from two clean frames of the two-account recording |
| `07-signin-error.png` | Invalid sign-in credentials rejected |

## Two notes on provenance

`06-two-accounts.png` was composed from two frames of a screen recording rather
than committing the recording itself. That recording incidentally captured an
editor window displaying both test-account passwords in plaintext, so publishing
it would have leaked working credentials for the live app into public git
history. The two frames used contain none.

`05-mobile.png` has the signed-in account's email painted out, because it was a
personal address and this repository is public.

The two-account property is also asserted automatically by
`tests/rls.integration.test.ts`, so that screenshot corroborates the tests
rather than being the only proof.
