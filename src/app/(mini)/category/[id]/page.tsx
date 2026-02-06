"use client";

import { use } from "react";
import { useState } from "react";
import { verifyAndConsume } from "./actions";

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [text, setText] = useState("");

  async function onPostQuestion() {
    // 1) Verify first
    await verifyAndConsume(process.env.NEXT_PUBLIC_ACTION_POST_QUESTION!, id);

    // 2) Create question after verify succeeded
    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: "0x...",       // from wallet auth session
        username: "aziz",      // from wallet auth session
        categoryId: id,
        text,
      }),
    });
  }

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={300} />
      <button onClick={onPostQuestion}>Post Question</button>
    </div>
  );
}
