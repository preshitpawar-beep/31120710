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

/* ================= QUESTIONS (15 TOTAL) ================= */

const QUESTIONS = [
  { text: "Pizza or Burger?", options: ["🍕 Pizza", "🍔 Burger"], reaction: "Yum 😋 solid choice!" },
  { text: "Beach or Mountains?", options: ["🏖 Beach", "⛰ Mountains"], reaction: "That says a lot about you 😌" },
  { text: "Movies or Games?", options: ["🎬 Movies", "🎮 Games"], reaction: "Entertainment vibes 🎉" },
  { text: "Cats or Dogs?", options: ["🐱 Cats", "🐶 Dogs"], reaction: "Classic debate 😄" },
  { text: "Coffee or Tea?", options: ["☕ Coffee", "🍵 Tea"], reaction: "Energy choice unlocked ⚡" },
  { text: "Morning or Night?", options: ["🌞 Morning", "🌙 Night"], reaction: "Your rhythm is showing 🎶" },
  { text: "Sweet or Savory?", options: ["🍭 Sweet", "🧂 Savory"], reaction: "Snack personality revealed 👀" },
  { text: "Texting or Calling?", options: ["💬 Texting", "📞 Calling"], reaction: "Communication style unlocked 🔓" },
  { text: "Sunrise or Sunset?", options: ["🌅 Sunrise", "🌇 Sunset"], reaction: "Beautiful choice 🌈" },
  { text: "Plan or Spontaneous?", options: ["📋 Plan", "✨ Spontaneous"], reaction: "Life approach confirmed 😄" },
  { text: "Books or Podcasts?", options: ["📚 Books", "🎧 Podcasts"], reaction: "Learning vibes 📖" },
  { text: "Home date or Out date?", options: ["🏠 Home", "🌃 Out"], reaction: "Date night energy 💕" },
  { text: "Ice cream or Cake?", options: ["🍦 Ice Cream", "🍰 Cake"], reaction: "Dessert decisions 😍" },
  { text: "Rain or Sunshine?", options: ["🌧 Rain", "☀ Sunshine"], reaction: "Mood detected 🌦" },
  { text: "Surprises or Routine?", options: ["🎁 Surprises", "🔁 Routine"], reaction: "That’s very you 💫" },
];

/* ================= ROOM SHAPE (LOCKED) =================
{
  step: number,
  players: { [playerId]: true },
  answers: { [playerId]: string },
  skip: boolean,
  createdAt: number
}
======================================================== */

export default function GameRoom() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playerId, setPlayerId] = useState<string>("");

  /* ---------- INIT PLAYER & ROOM ---------- */

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
      } else if (!snap.data().players?.[storedId!]) {
        await updateDoc(roomRef, {
          [`players.${storedId}`]: true,
        });
      }
    };

    initRoom();

    const unsub = onSnapshot(roomRef, (snap) => {
      if (!snap.exists()) return;
      setRoom(snap.data());
      setLoading(false);
    });

    return () => unsub();
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

  const roomRef = doc(db, "rooms", roomId);
  const question = QUESTIONS[room.step];
  const playersCount = Object.keys(room.players || {}).length;
  const answersCount = Object.keys(room.answers || {}).length;
  const hasAnswered = !!room.answers?.[playerId];

  /* ---------- ACTIONS ---------- */

  const selectAnswer = async (opt: string) => {
    if (hasAnswered) return;
    await updateDoc(roomRef, {
      [`answers.${playerId}`]: opt,
    });
  };

  const goNext = async () => {
    await updateDoc(roomRef, {
      step: room.step + 1,
      answers: {},
      skip: false,
    });
  };

  /* ---------- QUESTION SCREEN ---------- */

  if (question) {
    return (
      <main className="screen">
        <div className="card column">
          <h2>{question.text}</h2>

          {question.options.map((opt) => (
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
            <div className="waiting">Waiting for other player…</div>
          )}

          {answersCount === playersCount && (
            <>
              <p className="floating">{question.reaction}</p>
              <button className="primary-btn" onClick={goNext}>
                Next ▶️
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  /* ---------- PLACEHOLDER FOR MINI-GAMES ---------- */

  return (
    <main className="screen">
      <div className="card">
        <h1>Mini-games coming up 🎮</h1>
        <p>Get ready for something fun 💖</p>
      </div>
    </main>
  );
}
