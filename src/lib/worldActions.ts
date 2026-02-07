/**
 * World Mini App Action IDs
 * 
 * These MUST match the action IDs configured in World Dev Portal exactly.
 * Go to: developer.worldcoin.org → Your App → Incognito Actions
 * 
 * CRITICAL: These are case-sensitive and must match character-for-character.
 */

// ============================================================================
// EXISTING ACTIONS (Keep for backward compatibility during migration)
// ============================================================================

export const getActionPostQuestion = () => {
  const action = process.env.NEXT_PUBLIC_ACTION_POST_QUESTION;
  if (!action) {
    throw new Error('NEXT_PUBLIC_ACTION_POST_QUESTION not configured in environment variables');
  }
  return action;
};

export const getActionPostAnswer = () => {
  const action = process.env.NEXT_PUBLIC_ACTION_POST_ANSWER;
  if (!action) {
    throw new Error('NEXT_PUBLIC_ACTION_POST_ANSWER not configured in environment variables');
  }
  return action;
};

export const getActionAcceptAnswer = () => {
  const action = process.env.NEXT_PUBLIC_ACTION_ACCEPT_ANSWER;
  if (!action) {
    throw new Error('NEXT_PUBLIC_ACTION_ACCEPT_ANSWER not configured in environment variables');
  }
  return action;
};

// ============================================================================
// NEW ACTIONS (Add these to World Dev Portal)
// ============================================================================

/**
 * Like/Unlike a note (question or answer)
 * Signal: noteId (allows toggle - verify only on first like)
 * Rate limit: Recommended 50 per day (generous for engagement)
 */
export const getActionLikeNote = () => {
  const action = process.env.NEXT_PUBLIC_ACTION_LIKE_NOTE;
  if (!action) {
    throw new Error('NEXT_PUBLIC_ACTION_LIKE_NOTE not configured in environment variables');
  }
  return action;
};

/**
 * Record a view on a note
 * Signal: noteId:YYYY-MM-DD (one view per human per note per day)
 * Rate limit: Recommended 100 per day (users browse many notes)
 */
export const getActionViewNote = () => {
  const action = process.env.NEXT_PUBLIC_ACTION_VIEW_NOTE;
  if (!action) {
    throw new Error('NEXT_PUBLIC_ACTION_VIEW_NOTE not configured in environment variables');
  }
  return action;
};

// ============================================================================
// UNIFIED ACTIONS (Future: unify post_question and post_answer)
// ============================================================================

/**
 * Create a note (question or answer)
 * Signal: categoryId:YYYY-MM-DD (for questions) or parentId:YYYY-MM-DD (for answers)
 * Rate limit: Recommended 20 per day
 * 
 * NOTE: Currently using separate actions (post_question, post_answer).
 * Can be unified to single action in future if desired.
 */
export const getActionCreateNote = () => {
  // For now, this is an alias. In future, can replace both post_question and post_answer
  const action = process.env.NEXT_PUBLIC_ACTION_CREATE_NOTE || process.env.NEXT_PUBLIC_ACTION_POST_QUESTION;
  if (!action) {
    throw new Error('NEXT_PUBLIC_ACTION_CREATE_NOTE not configured in environment variables');
  }
  return action;
};

// ============================================================================
// EXPECTED ACTION IDS (for documentation and verification)
// ============================================================================

/**
 * Expected action IDs in World Dev Portal:
 * 
 * EXISTING:
 * - proofboard_post_question
 * - proofboard_post_answer
 * - proofboard_accept_answer
 * 
 * NEW (Add to portal):
 * - proofboard_like_note
 * - proofboard_view_note
 * 
 * FUTURE (Optional unification):
 * - proofboard_create_note (can replace post_question + post_answer)
 * 
 * If your World Dev Portal uses different IDs (e.g., with hyphens like
 * "proof-board-post-question"), update your .env.local to match the portal.
 */
