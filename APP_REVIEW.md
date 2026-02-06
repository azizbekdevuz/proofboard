# World App Review – PostIt

Use this when submitting PostIt to the World App Mini App review.

## App name
**PostIt**

## Short description (under 25 words)
Share thoughts by category and get answers from verified humans. One person per identity—no bots, no spam.

## MiniKit integration
- **Wallet Auth**: Sign-in via MiniKit `walletAuth`; session used for posting and commenting.
- **World ID (Verify)**: Incognito Actions used to gate:
  - Posting a new thought (post)
  - Posting a comment (answer)
  - Accepting an answer (question owner only)
- **Data minimization**: We only use wallet (from auth) and optional username; no extra permissions.

## Safety
- Content is user-generated; no objectionable, violent, or NSFW content promoted by the app.
- No impersonation of TFH or Worldcoin.
- No weapons, drugs, or harmful behavior encouraged.

## Naming
- Name: **PostIt** (short, no “World”, no generic terms like Earn/Swap).
- No special characters or emojis in the name.
- Description: plain language, benefit-focused, under 25 words.

## Legal / privacy
- **Consent**: Sign-in and posting require the user to approve wallet auth and World ID verification in World App before we store any data.
- **Data minimization**: We store only wallet, optional username, and user-generated posts/comments.
- **Privacy**: In-app “Privacy & data” link (Profile → Privacy) explains what we collect and that we do not sell data.

## Technical requirements (Android & iOS)

- **Poor connections / disconnections**: All API calls use `fetchWithTimeout` (15s read, 30s write). Failed requests show an error message and a **Retry** button—no infinite loading. An offline banner appears when the device loses connection (`navigator.onLine`).
- **No infinite loading**: Every data-loading screen (Explore, Category, Profile, New Post categories, etc.) clears loading in `finally` and shows either content, an error message, or a **Retry** button.
- **App store compliance**: Web-based mini app; no native-only or platform-specific features. Same behavior on Android and iOS WebView.
- **User progress sync**: All user data (posts, comments, profile) is stored on the server (database). No critical progress is kept only in `localStorage` or in-memory, so progress is the same across devices and platform versions.

## Testing and distribution

**Submission and QA must be done in World App on real devices**, not only in a desktop or mobile browser. Use the [testing flow](https://docs.world.org/mini-apps/quick-start/testing): enter your app id from the Developer Portal (format `app_xxxxxxxxxx`) and scan the generated QR code with your phone to open the mini app inside World App. This ensures safe area, MiniKit, and WebView behavior match production.

## Submission checklist
- [ ] App name and short description filled in the Developer Portal as above.
- [ ] MiniKit Wallet Auth and Verify (Incognito Actions) configured and tested.
- [ ] Privacy notice accessible from the app (Profile → Privacy & data).
- [ ] Tested inside World App (not only in browser).
- [ ] Tested with slow or offline network (Retry and offline banner behave correctly).
