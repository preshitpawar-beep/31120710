"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";

/**
 * Room document shape (important – do not change later)
 *
 * {
 *   step: number,
 *   players: number,
 *   answers: {},
 *   skip: boolean,
 *   createdAt: timestamp
 * }
 */

export default function GameRoom() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, "rooms", roomId);

    // Create room if it doesn't exist
    setDoc(
      roomRef,
      {
        step: 0,
        players: 0,
        answers: {},
        skip: false,
        createdAt: Date.now(),
      },
      { merge: true }
    );

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.data();
      setRoom(data);
      setLoading(false);
    });

    // Increment player count ONCE per session
    updateDoc(roomRef, {
      players: (room?.players || 0) + 1,
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  if (loading || !room) {
    return (
      <main className="screen">
        <div className="card">
          <h2>Joining room…</h2>
          <p>Please wait 💕</p>
        </div>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="card column">
        <h1>Room Ready 💖</h1>

        <p>
          Room ID:
          <br />
          <strong>{roomId}</strong>
        </p>

        <p>
          Players connected: <strong>{room.players}</strong>
        </p>

        <p style={{ opacity: 0.7 }}>
          Share this link with your partner.
          <br />
          The game will stay perfectly synced.
        </p>
      </div>
    </main>
  );
}
