"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";

/**
 * Room document shape (LOCKED)
 *
 * {
 *   step: number,
 *   players: {
 *     [playerId]: true
 *   },
 *   answers: {},
 *   skip: boolean,
 *   createdAt: number
 * }
 */

export default function GameRoom() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    // Persistent player ID (refresh-safe)
    let playerId = localStorage.getItem("playerId");
    if (!playerId) {
      playerId = crypto.randomUUID();
      localStorage.setItem("playerId", playerId);
    }

    const roomRef = doc(db, "rooms", roomId);

    const initRoom = async () => {
      const snap = await getDoc(roomRef);

      if (!snap.exists()) {
        await setDoc(roomRef, {
          step: 0,
          players: { [playerId!]: true },
          answers: {},
          skip: false,
          createdAt: Date.now(),
        });
      } else {
        const data = snap.data();
        if (!data.players?.[playerId!]) {
          await updateDoc(roomRef, {
            [`players.${playerId}`]: true,
          });
        }
      }
    };

    initRoom();

    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (!snapshot.exists()) return;
      setRoom(snapshot.data());
      setLoading(false);
    });

    return () => unsubscribe();
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

  const playerCount = room.players
    ? Object.keys(room.players).length
    : 0;

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
          Players connected: <strong>{playerCount}</strong>
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
