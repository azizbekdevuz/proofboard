import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET /api/notes/:id
 * Get a single note by ID with all related data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: noteId } = await params;

  const note = await db.note.findUnique({
    where: { id: noteId },
    include: {
      user: { select: { username: true, wallet: true } },
      category: { select: { id: true, name: true } },
      parent: {
        select: {
          id: true,
          text: true,
          user: { select: { username: true, wallet: true } },
        },
      },
      children: {
        where: { deletedAt: null },
        include: {
          user: { select: { username: true, wallet: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          children: true,
          likes: true,
          views: true,
        },
      },
    },
  });

  if (!note || note.deletedAt) {
    return NextResponse.json({
      error: "not_found",
      message: "Note not found or has been deleted",
    }, { status: 404 });
  }

  // Transform to include both new and old API shapes
  const response = {
    // New fields
    id: note.id,
    type: note.type,
    parentId: note.parentId,
    categoryId: note.categoryId,
    userId: note.userId,
    text: note.text,
    likeCount: note.likeCount,
    viewCount: note.viewCount,
    acceptedAnswerId: note.acceptedAnswerId,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    deletedAt: note.deletedAt,
    user: note.user,
    category: note.category,
    parent: note.parent,
    children: note.children,
    _count: note._count,
    
    // Old API compatibility
    ...(note.type === 'QUESTION' && {
      acceptedId: note.acceptedAnswerId,
      answers: note.children.map(child => ({
        id: child.id,
        questionId: note.id,
        userId: child.userId,
        text: child.text,
        createdAt: child.createdAt,
        user: child.user,
      })),
    }),
    ...(note.type === 'ANSWER' && {
      questionId: note.parentId,
    }),
  };

  return NextResponse.json(response);
}

/**
 * PATCH /api/notes/:id
 * Edit a note (question or answer)
 * 
 * Authorization: Only the owner can edit their own note
 * No World ID verification needed (wallet auth sufficient)
 * 
 * Restrictions:
 * - Can only edit text field
 * - Cannot change type, parentId, categoryId
 * - Text must be <= 300 chars
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: noteId } = await params;
  const requestId = req.headers.get('x-rid') || 'unknown';
  
  console.log(`[${requestId}] PATCH /api/notes/${noteId}`);

  // 1. Auth check
  const session = await auth();
  const wallet = session?.user?.walletAddress;

  if (!wallet) {
    return NextResponse.json({ 
      error: "unauthorized",
      message: "Authentication required. Please sign in with World App.",
    }, { status: 401 });
  }

  // 2. Get request body
  const body = await req.json();
  const { text } = body;

  if (!text) {
    return NextResponse.json({
      error: "bad_request",
      message: "Missing text field",
    }, { status: 400 });
  }

  if (typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({
      error: "bad_request",
      message: "Text must be a non-empty string",
    }, { status: 400 });
  }

  if (text.length > 300) {
    return NextResponse.json({
      error: "too_long",
      message: "Text must be 300 characters or less",
      length: text.length,
    }, { status: 400 });
  }

  // 3. Get note and check ownership
  const note = await db.note.findUnique({
    where: { id: noteId },
    include: {
      user: { select: { wallet: true } },
    },
  });

  if (!note || note.deletedAt) {
    return NextResponse.json({
      error: "not_found",
      message: "Note not found or has been deleted",
    }, { status: 404 });
  }

  if (note.user.wallet !== wallet) {
    return NextResponse.json({
      error: "forbidden",
      message: "You can only edit your own notes",
    }, { status: 403 });
  }

  // 4. Update note
  try {
    const updated = await db.note.update({
      where: { id: noteId },
      data: { text: text.trim() },
      include: {
        user: { select: { username: true, wallet: true } },
        category: { select: { id: true, name: true } },
      },
    });

    console.log(`[${requestId}] Note updated: ${noteId}`);
    
    // Transform to match old API shape for backward compatibility
    const response = {
      id: updated.id,
      categoryId: updated.categoryId,
      userId: updated.userId,
      text: updated.text,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      user: updated.user,
      category: updated.category,
      ...(updated.type === 'QUESTION' && {
        acceptedId: updated.acceptedAnswerId,
      }),
      ...(updated.type === 'ANSWER' && {
        questionId: updated.parentId,
      }),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`[${requestId}] Update failed:`, error);
    return NextResponse.json({
      error: "server_error",
      message: "Failed to update note",
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * DELETE /api/notes/:id
 * Soft delete a note (question or answer)
 * 
 * Authorization: Only the owner can delete their own note
 * No World ID verification needed (wallet auth sufficient)
 * 
 * Behavior:
 * - Sets deletedAt timestamp (soft delete)
 * - If deleting a QUESTION with accepted answer, clears acceptedAnswerId
 * - If deleting an ANSWER that is accepted, clears parent's acceptedAnswerId
 * - Soft-deleted notes are hidden from queries but data is preserved
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: noteId } = await params;
  const requestId = req.headers.get('x-rid') || 'unknown';
  
  console.log(`[${requestId}] DELETE /api/notes/${noteId}`);

  // 1. Auth check
  const session = await auth();
  const wallet = session?.user?.walletAddress;

  if (!wallet) {
    return NextResponse.json({ 
      error: "unauthorized",
      message: "Authentication required. Please sign in with World App.",
    }, { status: 401 });
  }

  // 2. Get note and check ownership
  const note = await db.note.findUnique({
    where: { id: noteId },
    include: {
      user: { select: { wallet: true } },
    },
  });

  if (!note) {
    return NextResponse.json({
      error: "not_found",
      message: "Note not found",
    }, { status: 404 });
  }

  if (note.deletedAt) {
    return NextResponse.json({
      error: "already_deleted",
      message: "Note has already been deleted",
    }, { status: 410 }); // 410 Gone
  }

  if (note.user.wallet !== wallet) {
    return NextResponse.json({
      error: "forbidden",
      message: "You can only delete your own notes",
    }, { status: 403 });
  }

  // 3. Soft delete with cascading logic
  try {
    await db.$transaction(async (tx) => {
      const now = new Date();

      if (note.type === 'QUESTION') {
        // If question has accepted answer, clear it
        if (note.acceptedAnswerId) {
          await tx.note.update({
            where: { id: noteId },
            data: { 
              deletedAt: now,
              acceptedAnswerId: null, // Clear accepted answer
            },
          });
        } else {
          await tx.note.update({
            where: { id: noteId },
            data: { deletedAt: now },
          });
        }
      } else if (note.type === 'ANSWER') {
        // If this answer is accepted by parent question, clear parent's acceptedAnswerId
        if (note.parentId) {
          const parentQuestion = await tx.note.findUnique({
            where: { id: note.parentId },
            select: { acceptedAnswerId: true },
          });

          if (parentQuestion?.acceptedAnswerId === noteId) {
            await tx.note.update({
              where: { id: note.parentId },
              data: { acceptedAnswerId: null },
            });
          }
        }

        // Soft delete the answer
        await tx.note.update({
          where: { id: noteId },
          data: { deletedAt: now },
        });
      }
    });

    console.log(`[${requestId}] Note soft deleted: ${noteId}`);
    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
      deletedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`[${requestId}] Delete failed:`, error);
    return NextResponse.json({
      error: "server_error",
      message: "Failed to delete note",
      details: error.message,
    }, { status: 500 });
  }
}
