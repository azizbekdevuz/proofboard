'use client';

import { useState, useRef } from 'react';
import { getWorldIDProof } from '@/components/verify';
import { getActionLikeNote } from '@/lib/worldActions';

interface LikeButtonProps {
  noteId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onLikeChange?: (liked: boolean, count: number) => void;
}

export function LikeButton({ 
  noteId, 
  initialLiked = false, 
  initialCount = 0,
  onLikeChange 
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmitting = useRef(false);

  const handleLike = async () => {
    // Prevent double submission
    if (isSubmitting.current || isLoading) {
      console.log('Like already in progress, skipping...');
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const requestId = `like-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[${requestId}] Like button clicked: noteId=${noteId}, currentlyLiked=${liked}`);

      // If already liked, we can unlike without proof
      if (liked) {
        console.log(`[${requestId}] Unliking (no proof needed)...`);
        
        const response = await fetch(`/api/notes/${noteId}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-rid': requestId,
          },
          body: JSON.stringify({}), // Empty body for unlike
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to unlike');
        }

        console.log(`[${requestId}] Unlike successful:`, data);
        setLiked(false);
        setLikeCount(data.likeCount);
        onLikeChange?.(false, data.likeCount);
      } else {
        // Need to get proof for first-time like
        console.log(`[${requestId}] Liking (proof required)...`);
        
        let actionId: string;
        try {
          actionId = getActionLikeNote();
        } catch (err: any) {
          throw new Error(err.message || 'Action ID not configured');
        }

        const signal = noteId; // Signal is just the noteId
        console.log(`[${requestId}] Getting World ID proof:`, { actionId, signal });

        // Get World ID proof
        const proof = await getWorldIDProof(actionId, signal);
        console.log(`[${requestId}] Proof received, nullifier:`, proof.nullifier_hash);

        // Send to backend
        const response = await fetch(`/api/notes/${noteId}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-rid': requestId,
          },
          body: JSON.stringify({ proof, signal }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 409) {
            throw new Error('You have already liked this note');
          }
          throw new Error(data.message || 'Failed to like');
        }

        console.log(`[${requestId}] Like successful:`, data);
        setLiked(true);
        setLikeCount(data.likeCount);
        onLikeChange?.(true, data.likeCount);
      }
    } catch (err: any) {
      console.error('Like error:', err);
      setError(err.message || 'Failed to toggle like');
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95 ${
          liked
            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
            : 'bg-white/60 text-gray-600 hover:bg-white border border-gray-200'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-sm'}`}
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        {isLoading ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg 
            className={`w-4 h-4 ${liked ? 'fill-current' : 'fill-none'}`} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
        <span className="text-xs font-semibold">{likeCount}</span>
      </button>
      {error && (
        <span className="text-xs text-red-600 font-medium">{error}</span>
      )}
    </div>
  );
}
