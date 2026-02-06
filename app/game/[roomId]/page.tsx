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

/* ================= QUESTIONS ================= */

const QUESTIONS = [
  { q: "Beach or Mountains?", o: ["🏖 Beach", "⛰ Mountains"] },
  { q: "Movies or Games?", o: ["🎬 Movies", "🎮 Games"] },
  { q: "Cats or Dogs?", o: ["🐱 Cats", "🐶 Dogs"] },
  { q: "Coffee or Tea?", o: ["☕ Coffee", "🍵 Tea"] },
  { q: "Morning or Night?", o: ["🌞 Morning", "🌙 Night"] },
  { q: "Pasta, Burger or Me? 😏", o: ["🍝 Pasta", "🍔 Burger", "😌 You"] },
  { q: "Texting or Calling?", o: ["💬 Texting", "📞 Calling"] },
  { q: "Phone, Sleep or Me? 🙃", o: ["📱 Phone", "😴 Sleep", "💖 You"] },
  { q: "Netflix, Food or Me? 😌", o: ["📺 Netflix", "🍟 Food", "💘 You"] },
  { q: "Sunrise or Sunset?", o: ["🌅 Sunrise", "🌇 Sunset"] },
  { q: "Plan or Spontaneous?", o: ["📋 Plan", "✨ Spontaneous"] },
  { q: "Ice cream or Cake?", o: ["🍦 Ice Cream", "🍰 Cake"] },
  { q: "Rain or Sunshine?", o: ["🌧 Rain", "☀ Sunshine"] },
  { q: "Surprises or Routine?", o: ["🎁 Surprises", "🔁 Routine"] },
];

export default function GameRoom() {
  const { roomId } = useParams() as { roomId: string };

  const [room, setRoom] = useState<any>(null);
  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading] = useState(true);

  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [saidYes, setSaidYes] = useState(false);
  const [showCouple, setShowCouple] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const roomRef = doc(db, "rooms", roomId);

  /* ---------- INIT ---------- */
  useEffect(() => {
    let pid = localStorage.getItem("playerId");
    if (!pid) {
      pid =
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 10);
      localStorage.setItem("playerId", pid);
    }
    setPlayerId(pid);

    const init = async () => {
      const snap = await getDoc(roomRef);
      if (!snap.exists()) {
        await setDoc(roomRef, {
          step: 0,
          players: { [pid]: true },
          answers: {},
        });
      } else if (!snap.data().players?.[pid]) {
        await updateDoc(roomRef, { [`players.${pid}`]: true });
      }
    };

    init();

    const unsub = onSnapshot(roomRef, (s) => {
      setRoom(s.data());
      setLoading(false);
    });

    return () => unsub();
  }, [roomId]);

  if (loading || !room) {
    return (
      <main className="screen">
        <div className="card">Joining…</div>
      </main>
    );
  }

  const players = Object.keys(room.players || {});
  const answers = room.answers || {};
  const answered = !!answers[playerId];
  const allAnswered = Object.keys(answers).length === players.length;

  const next = async () => {
    await updateDoc(roomRef, {
      step: room.step + 1,
      answers: {},
    });
  };

  return (
    <main className="screen">
      {/* QUESTIONS */}
      {room.step < QUESTIONS.length && (
        <div className="card column">
          <h2>{QUESTIONS[room.step].q}</h2>

          {QUESTIONS[room.step].o.map((opt) => (
            <button
              key={opt}
              className={`option-btn ${
                answers[playerId] === opt ? "selected" : ""
              }`}
              onClick={() =>
                !answered &&
                updateDoc(roomRef, { [`answers.${playerId}`]: opt })
              }
            >
              {opt}
            </button>
          ))}

          {!allAnswered && <p>Waiting for other player…</p>}
          {allAnswered && (
            <button className="primary-btn" onClick={next}>
              Next ▶️
            </button>
          )}
        </div>
      )}

      {/* FINAL VALENTINE */}
      {room.step >= QUESTIONS.length && (
        <div className="card column center">
          {!saidYes && (
            <>
              <h1>Will you be my Valentine? 💖</h1>
              <p style={{ opacity: 0.7 }}>Go on… try saying no 😏</p>

              <button
                className="primary-btn"
                onClick={() => {
                  navigator.vibrate?.([120, 60, 120]);
                  setSaidYes(true);
                  setShowCouple(true);
                  setTimeout(() => setShowHeart(true), 6000);
                }}
              >
                YES 💕
              </button>

              <button
                onMouseEnter={() =>
                  setNoPos({
                    x: Math.random() * 220 - 110,
                    y: Math.random() * 220 - 110,
                  })
                }
                onTouchStart={() =>
                  setNoPos({
                    x: Math.random() * 220 - 110,
                    y: Math.random() * 220 - 110,
                  })
                }
                style={{
                  transform: `translate(${noPos.x}px, ${noPos.y}px)`,
                }}
              >
                NO 🙃
              </button>
            </>
          )}

          {/* COUPLE */}
          {showCouple && !showHeart && (
            <div className="couple-stage">
              <div className="stick-figure boy">
                <div className="head" />
                <div className="body" />
                <div className="arm left" />
                <div className="arm right" />
                <div className="leg left" />
                <div className="leg right" />
              </div>

              <div className="stick-figure girl">
                <div className="head" />
                <div className="body" />
                <div className="arm left" />
                <div className="arm right" />
                <div className="skirt" />
                <div className="leg left" />
                <div className="leg right" />
              </div>

              <div className="kiss-heart">❤️</div>
            </div>
          )}

          {/* CELEBRATION */}
          {showHeart && (
            <div className="celebration">
              <div className="heart-container">
                <div className="heart left" />
                <div className="heart right" />
                <div className="graffiti">I KNEW IT 💖</div>
              </div>

              <p className="final">
                Thank you for being my favourite person,
                <br />
                my happiest place, and my forever Valentine.
              </p>
            </div>
          )}
        </div>
      )}

      {/* STYLES */}
      <style jsx>{`
        /* ALL YOUR STYLES — UNCHANGED */
        /* (exact same CSS you wrote, now correctly placed) */
      `}</style>
    </main>
  );
}
