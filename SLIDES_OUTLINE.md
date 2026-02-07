# 📊 Presentation Slides Outline (3-4 Minutes)

## 🎯 Presentation Strategy

**Goal**: Convince judges that ProofBoard is a winning project in 3-4 minutes

**Key Messages**:
1. Clear problem that affects everyone
2. World ID is ESSENTIAL (not optional)
3. Strong anti-abuse implementation
4. Professional execution

**Tone**: Confident, technical, but accessible

---

## 📑 Slide Structure (6 Slides)

### SLIDE 1: Title + Hook (30 seconds)

**Visual**:
- Large title: **"ProofBoard"**
- Subtitle: "Human-Only Q&A Powered by World ID"
- Background: Clean, professional (white or light gradient)
- Bottom: Your name/team, World Build Korea 2026

**Speaker Notes**:
> "Hi, I'm [Name]. I built ProofBoard, a Q&A platform where every action is verified human. Let me show you why this matters."

**Design Tips**:
- Use ProofBoard logo if you have one
- Keep it minimal and professional
- No animations or distractions

---

### SLIDE 2: The Problem (45 seconds)

**Title**: "The Sybil Attack Problem"

**Visual Layout**:

```
┌─────────────────────────────────────────────────┐
│  Traditional Q&A Platforms                      │
│                                                  │
│  ❌ One person → 100 fake accounts              │
│  ❌ Bot-generated spam floods boards            │
│  ❌ Vote manipulation drowns real voices        │
│  ❌ No way to verify uniqueness                 │
│                                                  │
│  [Screenshot: Reddit bot spam example]          │
└─────────────────────────────────────────────────┘
```

**Key Points** (bullet list):
- Online Q&A is plagued by Sybil attacks
- One person creates many accounts to manipulate
- Bots generate spam faster than humans can moderate
- Traditional solutions (CAPTCHA, email) don't verify uniqueness

**Speaker Notes**:
> "Every online Q&A platform faces the same problem: Sybil attacks. One person can create 100 accounts, flood boards with spam, and manipulate votes. CAPTCHA doesn't help—it just proves you're not a bot, not that you're unique. Email verification? Same person can have unlimited emails. This fundamentally breaks the fairness of Q&A platforms."

**Design Tips**:
- Use red/warning colors for problem indicators
- Include a real screenshot of bot spam (Reddit/Twitter)
- Keep text large and readable

---

### SLIDE 3: The Solution (45 seconds)

**Title**: "World ID: Proof of Unique Personhood"

**Visual Layout**:

```
┌─────────────────────────────────────────────────┐
│  ProofBoard with World ID                       │
│                                                  │
│  ✅ One human = one voice per action            │
│  ✅ Cryptographic proof of uniqueness           │
│  ✅ Privacy-preserving (no PII stored)          │
│  ✅ Significantly reduces Sybil attacks         │
│                                                  │
│  [Diagram: User → World ID → ProofBoard]        │
└─────────────────────────────────────────────────┘
```

**Key Points**:
- World ID proves you're a unique human
- Every action (post, answer, accept) requires verification
- Privacy-first: No email, no phone, no personal data
- Makes Sybil attacks economically infeasible

**Speaker Notes**:
> "ProofBoard solves this with World ID. Every time you post a question, answer, or accept an answer, you prove you're a unique human. Not just 'not a bot'—but unique. One person can't create 100 accounts because World ID verifies uniqueness cryptographically. And it's privacy-preserving: we don't store your email, phone, or any personal data. Just your wallet address."

**Design Tips**:
- Use green/success colors
- Show simple flow diagram: User → World ID Verify → Action
- Include World ID logo

---

### SLIDE 4: Technical Implementation (60 seconds)

**Title**: "Anti-Abuse Architecture"

**Visual Layout**:

```
┌─────────────────────────────────────────────────┐
│  Atomic Verification + Write                    │
│                                                  │
│  1. Client requests World ID proof              │
│  2. Server verifies proof (verifyCloudProof)    │
│  3. Store nullifier (anti-replay)               │
│  4. Create note in database                     │
│                                                  │
│  → All or nothing (prevents wasted attempts)    │
│                                                  │
│  [Code snippet or architecture diagram]         │
└─────────────────────────────────────────────────┘
```

**Key Technical Points**:
- **Server-side verification**: All proofs verified with `verifyCloudProof`
- **Atomic transactions**: Verify + write in single transaction
- **Replay protection**: Nullifier storage with unique constraint
- **Signal strategy**: Scoped uniqueness (category:date, question:date)
- **Rate limiting**: Per-action limits in World Dev Portal

**Speaker Notes**:
> "Let me show you the technical implementation. Every action goes through an atomic transaction: verify the World ID proof, store the nullifier to prevent replay, then create the note. If any step fails, everything rolls back—so we never waste a verification attempt. We use signals to scope uniqueness: you can post multiple questions per day, but only one per category per day. This prevents spam while allowing legitimate use. And all proofs are verified server-side—no client-side shortcuts."

**Design Tips**:
- Show code snippet (5-10 lines max)
- Use monospace font for code
- Highlight key functions: `verifyCloudProof`, `$transaction`
- Or use architecture diagram instead of code

---

### SLIDE 5: Demo + Features (60 seconds)

**Title**: "Live Demo"

**Visual Layout**:

```
┌─────────────────────────────────────────────────┐
│  [4-6 screenshots in grid layout]               │
│                                                  │
│  1. Landing Page    2. Category Board           │
│  3. Post Question   4. World ID Verify          │
│  5. My Activity     6. Accepted Answer          │
│                                                  │
│  Key Features:                                  │
│  • 6 categories (Dating, Family, Self, etc.)    │
│  • Clean, professional UI                       │
│  • Demo mode (browse without World App)         │
│  • Mobile-first, safe-area aware               │
└─────────────────────────────────────────────────┘
```

**Key Features** (bullet list):
- 6 diverse categories (Dating, Family, Self, Crypto, Business, Other)
- Clean, professional interface (no amateur styling)
- Demo mode for judges without World App
- Full CRUD: Post, edit, delete (owner only)
- Like/view tracking (human-only)
- Accept answer flow (question owner only)

**Speaker Notes**:
> "Here's the app in action. [Point to screenshots] Users browse categories, post questions, and answer. Every action requires World ID verification. The UI is clean and professional—no gimmicks, just a solid Q&A experience. We even have a demo mode so judges can browse without World App. The app is fully functional: post, edit, delete, like, view, and accept answers. Everything is mobile-first and follows World Mini App guidelines."

**Design Tips**:
- Use actual screenshots from your deployed app
- Arrange in 2x3 or 3x2 grid
- Add captions under each screenshot
- Show the "Why World ID" section from landing page

---

### SLIDE 6: Why We Win (30 seconds)

**Title**: "Why ProofBoard Wins"

**Visual Layout**:

```
┌─────────────────────────────────────────────────┐
│  Judging Criteria Alignment                     │
│                                                  │
│  ⭐⭐⭐⭐⭐ Problem & World ID Fit               │
│    → Sybil attacks are real, World ID essential │
│                                                  │
│  ⭐⭐⭐⭐⭐ Privacy-by-Design                    │
│    → Minimal data, no PII, transparent          │
│                                                  │
│  ⭐⭐⭐⭐⭐ Anti-Abuse                           │
│    → Server-side verify, atomic transactions    │
│                                                  │
│  ⭐⭐⭐⭐⭐ UX Clarity                           │
│    → Clean UI, demo mode, clear messaging       │
│                                                  │
│  ⭐⭐⭐⭐⭐ Technical Execution                  │
│    → Production-ready, type-safe, deployed      │
│                                                  │
│  [QR Code]  Scan to try ProofBoard!             │
└─────────────────────────────────────────────────┘
```

**Key Points**:
- **Essential World ID use case**: App literally doesn't work without it
- **Strong anti-abuse**: Multiple layers of protection
- **Privacy-first**: Minimal data by design
- **Professional execution**: Clean code, deployed, tested
- **Clear value prop**: One human, one voice

**Speaker Notes**:
> "ProofBoard wins because it hits every judging criterion. World ID isn't a nice-to-have feature—it's essential. Without it, the platform breaks from Sybil attacks. Our anti-abuse implementation is robust: server-side verification, atomic transactions, replay protection. Privacy is built-in from day one: we only store wallet addresses. The UX is clear and professional. And the technical execution is solid: TypeScript, deployed to production, fully tested. [Point to QR code] You can try it right now. Thank you!"

**Design Tips**:
- Use star ratings or progress bars for each criterion
- Include large QR code (bottom right)
- Add your contact info (GitHub, email)
- End with strong call-to-action

---

## 🎨 Design Guidelines

### Color Palette:
- **Primary**: Indigo (#6366f1) - matches app
- **Success**: Emerald (#10b981) - for checkmarks
- **Warning**: Red (#ef4444) - for problems
- **Background**: White or light gray (#f9fafb)
- **Text**: Dark gray (#111827)

### Typography:
- **Titles**: 48-60pt, bold, sans-serif
- **Subtitles**: 32-36pt, semibold
- **Body**: 24-28pt, regular
- **Captions**: 18-20pt, light

### Layout:
- **Margins**: 10% on all sides
- **Alignment**: Left-aligned text, centered titles
- **Spacing**: Generous whitespace between elements
- **Consistency**: Same layout template for all slides

### Images:
- **Screenshots**: High resolution (1080p minimum)
- **Diagrams**: Simple, clean, easy to understand
- **Icons**: Consistent style (use emoji or icon set)
- **QR Code**: Large enough to scan from distance

---

## 📝 Speaker Notes Template

For each slide, practice saying:

1. **Hook** (first 5 seconds): Grab attention
2. **Context** (next 10 seconds): Set up the problem/solution
3. **Details** (next 20 seconds): Explain key points
4. **Transition** (last 5 seconds): Lead to next slide

**Total per slide**: 30-60 seconds

**Total presentation**: 3-4 minutes

---

## 🎤 Presentation Tips

### Before Presenting:
- [ ] Practice 3-5 times (time yourself)
- [ ] Test slides on presentation screen
- [ ] Have backup plan (PDF export)
- [ ] Charge laptop, bring charger
- [ ] Test QR code works

### During Presentation:
- [ ] Speak clearly and confidently
- [ ] Make eye contact with judges
- [ ] Point to visuals as you explain
- [ ] Stay within time limit (3-4 min)
- [ ] End with strong call-to-action

### After Presentation:
- [ ] Answer questions confidently
- [ ] Have QR code ready for judges to scan
- [ ] Offer to do live demo if time permits
- [ ] Thank judges for their time

---

## 📤 Google Slides Setup

### 1. Create Slides:
1. Go to [slides.google.com](https://slides.google.com)
2. Click "Blank" presentation
3. Name it: "ProofBoard - World Build Korea 2026"
4. Follow outline above (6 slides)

### 2. Set Permissions:
1. Click "Share" (top right)
2. Change to "Anyone with the link"
3. Set permission to "Viewer"
4. Copy link
5. Test in incognito window

### 3. Export Backup:
1. File → Download → PDF
2. Save as `proofboard_slides.pdf`
3. Include in submission package

---

## 🎯 Winning Pitch Formula

**Problem** (Slide 2)
→ "This is broken and affects everyone"

**Solution** (Slide 3)
→ "World ID uniquely solves this"

**Proof** (Slide 4)
→ "Here's how we built it right"

**Demo** (Slide 5)
→ "It works and looks professional"

**Win** (Slide 6)
→ "We hit every criterion perfectly"

---

**Your slides are your story. Make it compelling! 🚀**
