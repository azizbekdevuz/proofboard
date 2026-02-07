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
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
          liked
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
        <span className="text-sm font-medium">{likeCount}</span>
      </button>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}
