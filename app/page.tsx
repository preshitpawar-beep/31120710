"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const createRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8);
    router.push(`/game/${roomId}`);
  };

  return (
    <main className="screen">
      <div className="card column">
        <h1>Couple Game 💖</h1>

        <p>
          A fun, live game for two people.
          <br />
          Open the same link and play together.
        </p>

        <button className="primary-btn" onClick={createRoom}>
          Start a Game ✨
        </button>

        <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
          Tip: Share the link with your partner
        </p>
      </div>
    </main>
  );
}
