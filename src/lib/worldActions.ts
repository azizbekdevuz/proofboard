/**
 * World Mini App Action IDs
 * 
 * These MUST match the action IDs configured in World Dev Portal exactly.
 * Go to: developer.worldcoin.org → Your App → Incognito Actions
 * 
 * CRITICAL: These are case-sensitive and must match character-for-character.
 */

// Server-side action IDs (from env vars)
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

/**
 * Expected action IDs (for documentation and verification):
 * - proofboard_post_question
 * - proofboard_post_answer
 * - proofboard_accept_answer
 * 
 * If your World Dev Portal uses different IDs (e.g., with hyphens like
 * "proof-board-post-question"), update your .env.local to match the portal.
 */
