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

/* ------------------ QUESTIONS (LOCKED ORDER) ------------------ */

const QUESTIONS = [
  {
    id: 0,
    text: "Pizza or Burger?",
    options: ["🍕 Pizza", "🍔 Burger"],
  },
  {
    id: 1,
    text: "Beach or Mountains?",
    options: ["🏖 Beach", "⛰ Mountains"],
  },
  {
    id: 2,
    text: "Movies or Games?",
    options: ["🎬 Movies", "🎮 Games"],
  },
];

/* ------------------ ROOM SHAPE (LOCKED) ------------------

{
  step: number,
  players: { [playerId]: true },
  answers: { [playerId]: string },
  skip: boolean,
  createdAt: number
}

---------------------------------------------------------- */

export default function GameRoom() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playerId, setPlayerId] = useState<string>("");

  /* ------------------ INIT PLAYER & ROOM ------------------ */

  useEffect(() => {
    if (!roomId) return;

    let storedId = localStorage.getItem("playerId");
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem("playerId", storedId);
    }
    setPlayerId(storedId);

    const roomRef = doc(db, "rooms", roomId);

    const initRoom = async () => {
      const snap = await getDoc(roomRef);

      if (!snap.exists()) {
        await setDoc(roomRef, {
          step: 0,
          players: { [storedId!]: true },
          answers: {},
          skip: false,
          createdAt: Date.now(),
        });
      } else {
        const data = snap.data();
        if (!data.players?.[storedId!]) {
          await updateDoc(roomRef, {
            [`players.${storedId}`]: true,
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

  /* ------------------ LOADING ------------------ */

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

  const roomRef = doc(db, "rooms", roomId);
  const currentQuestion = QUESTIONS[room.step];
  const playersCount = Object.keys(room.players || {}).length;
  const answersCount = Object.keys(room.answers || {}).length;
  const hasAnswered = !!room.answers?.[playerId];

  /* ------------------ ACTIONS ------------------ */

  const selectAnswer = async (option: string) => {
    if (hasAnswered) return;

    await updateDoc(roomRef, {
      [`answers.${playerId}`]: option,
    });
  };

  const goNext = async () => {
    await updateDoc(roomRef, {
      step: room.step + 1,
      answers: {},
      skip: false,
    });
  };

  /* ------------------ RENDER QUESTION ------------------ */

  if (currentQuestion) {
    return (
      <main className="screen">
        <div className="card column">
          <h2>{currentQuestion.text}</h2>

          {currentQuestion.options.map((opt) => (
            <button
              key={opt}
              className={`option-btn ${
                room.answers?.[playerId] === opt ? "selected" : ""
              }`}
              onClick={() => selectAnswer(opt)}
            >
              {opt}
            </button>
          ))}

          {answersCount < playersCount && (
            <div className="waiting">
              Waiting for other player…
            </div>
          )}

          {answersCount === playersCount && (
            <button className="primary-btn" onClick={goNext}>
              Next ▶️
            </button>
          )}
        </div>
      </main>
    );
  }

  /* ------------------ END PLACEHOLDER ------------------ */

  return (
    <main className="screen">
      <div className="card">
        <h1>More fun coming next 💖</h1>
        <p>This is just the beginning…</p>
      </div>
    </main>
  );
}
