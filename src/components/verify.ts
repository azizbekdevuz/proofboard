"use client";

import { MiniKit, VerificationLevel, ISuccessResult } from "@worldcoin/minikit-js";

/**
 * Get World ID proof from MiniKit without server verification
 * Server verification happens in the action route (atomically with DB write)
 */
export async function getWorldIDProof(action: string, signal?: string): Promise<ISuccessResult> {
  if (!MiniKit.isInstalled()) {
    throw new Error("Please open this app in World App to verify");
  }

  const verifyCommand: {
    action: string;
    verification_level: VerificationLevel;
    signal?: string;
  } = {
    action,
    verification_level: VerificationLevel.Orb,
  };

  if (signal && signal.trim().length > 0) {
    verifyCommand.signal = signal;
  }

  console.log('Getting World ID proof:', { 
    action, 
    signal: signal || '(none)', 
    verification_level: 'Orb' 
  });

  let finalPayload;
  try {
    const result = await MiniKit.commandsAsync.verify(verifyCommand);
    finalPayload = result.finalPayload;
  } catch (error) {
    console.error('Verify command error:', error);
    throw new Error("Verification failed. Please try again.");
  }

  if (finalPayload.status === "error") {
    const errorPayload = finalPayload as any;
    const errorCode = errorPayload.error_code;
    const errorMessage = errorPayload.error_message || errorPayload.message;
    
    console.error("World ID verification error:", {
      errorCode,
      errorMessage,
      fullPayload: errorPayload,
    });
    
    // Handle credential_unavailable - try Device verification as fallback
    if (errorCode === "credential_unavailable") {
      console.log('Orb credential unavailable, trying Device verification...');
      try {
        const deviceResult = await MiniKit.commandsAsync.verify({
          action,
          verification_level: VerificationLevel.Device,
          ...(signal && signal.trim().length > 0 ? { signal } : {}),
        });
        
        if (deviceResult.finalPayload.status === "success") {
          console.log('Device verification successful (fallback from Orb)');
          return deviceResult.finalPayload as ISuccessResult;
        } else {
          throw new Error(
            "You need World ID verification to post. Please verify your identity in World App first. " +
            "Go to World App → Settings → World ID to complete verification."
          );
        }
      } catch (deviceError) {
        throw new Error(
          "You need World ID verification to post. Please verify your identity in World App first. " +
          "Go to World App → Settings → World ID to complete verification."
        );
      }
    }
    // Handle other error codes
    else if (errorCode === "max_verifications_reached" || errorCode === "limit_reached" || errorCode === "rate_limit_exceeded") {
      throw new Error("You've reached your limit for this action. Please increase the action limit in World Dev Portal (e.g., 10 per day).");
    }
    else if (errorCode === "verification_rejected" || errorCode === "user_cancelled" || errorCode === "cancelled") {
      throw new Error("Verification was cancelled. Please try again.");
    }
    else if (errorCode === "not_verified" || errorCode === "verification_required") {
      throw new Error("World ID verification required. Please verify your identity first.");
    }
    else if (errorCode === "inclusion_proof_pending") {
      throw new Error("Your verification is still processing. Please try again in about an hour.");
    }
    else if (errorCode === "inclusion_proof_failed") {
      throw new Error("Verification failed due to a network issue. Please try again.");
    }
    else if (errorCode === "invalid_network") {
      throw new Error("Network configuration mismatch. Please check your app settings.");
    }
    else if (errorMessage) {
      throw new Error(errorMessage);
    }
    else if (errorCode) {
      throw new Error(`Verification failed: ${errorCode}. Please try again.`);
    }
    else {
      throw new Error("Verification was rejected. Please try again.");
    }
  }

  return finalPayload as ISuccessResult;
}

/**
 * @deprecated Use getWorldIDProof instead. Server verification now happens in action routes.
 */
export async function verifyAndConsume(action: string, signal?: string): Promise<ISuccessResult> {
  if (!MiniKit.isInstalled()) {
    throw new Error("Please open this app in World App to verify");
  }

  // According to World Mini App docs, verify command accepts:
  // - action: string
  // - signal?: string (optional additional data)
  // - verification_level?: VerificationLevel (default: Orb)
  // Signal MUST match between proof generation and verification
  
  // Build verify command with signal if provided
  const verifyCommand: {
    action: string;
    verification_level: VerificationLevel;
    signal?: string;
  } = {
    action,
    verification_level: VerificationLevel.Orb,
  };

  // Add signal if provided (according to official docs, signal IS supported)
  if (signal && signal.trim().length > 0) {
    verifyCommand.signal = signal;
  }

  console.log('Calling verify with:', { 
    action, 
    signal: signal || '(none)', 
    verification_level: 'Orb' 
  });

  let finalPayload;
  try {
    const result = await MiniKit.commandsAsync.verify(verifyCommand);
    finalPayload = result.finalPayload;
  } catch (error) {
    console.error('Verify command error:', error);
    throw new Error("Verification failed. Please try again.");
  }

  if (finalPayload.status === "error") {
    const errorPayload = finalPayload as any;
    const errorCode = errorPayload.error_code;
    const errorMessage = errorPayload.error_message || errorPayload.message;
    
    // Log full error for debugging
    console.error("World ID verification error:", {
      errorCode,
      errorMessage,
      fullPayload: errorPayload,
    });
    
    // Handle credential_unavailable - user doesn't have Orb verification
    // According to docs: "The user must verify at the Orb or verify their unique device in World App"
    if (errorCode === "credential_unavailable") {
      // Try Device verification as fallback
      console.log('Orb credential unavailable, trying Device verification...');
      try {
        const deviceResult = await MiniKit.commandsAsync.verify({
          action,
          verification_level: VerificationLevel.Device,
        });
        
        if (deviceResult.finalPayload.status === "success") {
          console.log('Device verification successful (fallback from Orb)');
          finalPayload = deviceResult.finalPayload;
        } else {
          // Device also failed
          throw new Error(
            "You need World ID verification to post. Please verify your identity in World App first. " +
            "Go to World App → Settings → World ID to complete verification."
          );
        }
      } catch (deviceError) {
        // Device verification also failed
        throw new Error(
          "You need World ID verification to post. Please verify your identity in World App first. " +
          "Go to World App → Settings → World ID to complete verification."
        );
      }
    }
    // Handle other error codes
    else if (errorCode === "max_verifications_reached" || errorCode === "limit_reached" || errorCode === "rate_limit_exceeded") {
      throw new Error("You've reached your limit for this action. The action limit is configured in the World Dev Portal. For a Q&A system, you may need to increase the limit (e.g., 10 per day instead of 1 per user).");
    }
    else if (errorCode === "verification_rejected" || errorCode === "user_cancelled" || errorCode === "cancelled") {
      throw new Error("Verification was cancelled. Please try again.");
    }
    else if (errorCode === "not_verified" || errorCode === "verification_required") {
      throw new Error("World ID verification required. Please verify your identity first.");
    }
    else if (errorCode === "inclusion_proof_pending") {
      throw new Error("Your verification is still processing. Please try again in about an hour.");
    }
    else if (errorCode === "inclusion_proof_failed") {
      throw new Error("Verification failed due to a network issue. Please try again.");
    }
    else if (errorCode === "invalid_network") {
      throw new Error("Network configuration mismatch. Please check your app settings.");
    }
    // Use the actual error message if available
    else if (errorMessage) {
      throw new Error(errorMessage);
    }
    // Fallback with error code if available
    else if (errorCode) {
      throw new Error(`Verification failed: ${errorCode}. Please try again.`);
    }
    else {
      throw new Error("Verification was rejected. Please try again.");
    }
  }

  // Server-side verification - verifyCloudProof accepts both Device and Orb proofs
  console.log('Sending proof to server for verification:', {
    action,
    signal: signal || '(none)',
    verificationLevel: (finalPayload as any).verification_level || 'unknown',
  });

  const r = await fetch("/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payload: finalPayload as ISuccessResult,
      action,
      signal,
    }),
  });

  const j = await r.json();
  if (r.status !== 200) {
    // Log full error response for debugging
    console.error("Server verification error:", {
      status: r.status,
      response: j,
    });
    
    const errorMessage = j.verifyRes?.error || j.message || j.error || "Verification failed. Please try again.";
    throw new Error(errorMessage);
  }
  
  return finalPayload as ISuccessResult;
}
