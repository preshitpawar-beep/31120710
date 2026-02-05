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

/* ===================== QUESTIONS ===================== */

const QUESTIONS = [
  { q: "Pizza or Burger?", o: ["🍕 Pizza", "🍔 Burger"] },
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

const TOTAL_STEPS = QUESTIONS.length + 3 + 1; // questions + 3 mini-games + final

/* ===================== GAME ===================== */

export default function GameRoom() {
  const { roomId } = useParams() as { roomId: string };

  const [room, setRoom] = useState<any>(null);
  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [tapCount, setTapCount] = useState(0);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [saidYes, setSaidYes] = useState(false);

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
          skip: false,
          createdAt: Date.now(),
        });
      } else if (!snap.data().players?.[pid]) {
        await updateDoc(roomRef, { [`players.${pid}`]: true });
      }
    };

    init();

    return onSnapshot(roomRef, (s) => {
      setRoom(s.data());
      setLoading(false);
    });
  }, [roomId]);

  if (loading || !room) {
    return (
      <main className="screen">
        <div className="card">
          <h2>Joining room…</h2>
        </div>
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
      skip: false,
    });
  };

  const skip = async () => {
    await next();
  };

  /* ===================== UI ===================== */

  return (
    <main className="screen">
      <button className="skip-btn" onClick={skip}>
        Skip ⏭
      </button>

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

          {!allAnswered && (
            <p className="waiting">Waiting for other player…</p>
          )}

          {allAnswered && (
            <button className="primary-btn" onClick={next}>
              Next ▶️
            </button>
          )}
        </div>
      )}

      {/* MINI GAME 1 */}
      {room.step === QUESTIONS.length && (
        <div className="card column">
          <h2>Pick the same side 💕</h2>
          {["⬅ LEFT", "RIGHT ➡"].map((o) => (
            <button
              key={o}
              className="option-btn"
              onClick={() =>
                !answered &&
                updateDoc(roomRef, { [`answers.${playerId}`]: o })
              }
            >
              {o}
            </button>
          ))}
          {allAnswered && (
            <button className="primary-btn" onClick={next}>
              Continue ▶️
            </button>
          )}
        </div>
      )}

      {/* MINI GAME 2 */}
      {room.step === QUESTIONS.length + 1 && (
        <div className="card column">
          <h2>Tap as much as you want 💥</h2>
          <button
            className="primary-btn"
            onClick={() => {
              setTapCount(tapCount + 1);
              updateDoc(roomRef, {
                [`answers.${playerId}`]: tapCount + 1,
              });
            }}
          >
            TAP
          </button>
          {allAnswered && (
            <button className="primary-btn" onClick={next}>
              Continue ▶️
            </button>
          )}
        </div>
      )}

      {/* MINI GAME 3 */}
      {room.step === QUESTIONS.length + 2 && (
        <div className="card column">
          <h2>How much do you like surprises?</h2>
          <input
            type="range"
            min="0"
            max="100"
            onChange={(e) =>
              updateDoc(roomRef, {
                [`answers.${playerId}`]: e.target.value,
              })
            }
          />
          {allAnswered && (
            <button className="primary-btn" onClick={next}>
              Continue ▶️
            </button>
          )}
        </div>
      )}

      {/* FINAL */}
      {room.step === TOTAL_STEPS - 1 && (
        <div className="card column">
          {!saidYes ? (
            <>
              <h2>One last question…</h2>
              <h1>Will you be my Valentine? 💖</h1>

              <button
                className="primary-btn floating"
                onClick={() => setSaidYes(true)}
              >
                YES 💕
              </button>

              <button
                style={{
                  transform: `translate(${noPos.x}px, ${noPos.y}px)`,
                  background: "#eee",
                }}
                onMouseEnter={() =>
                  setNoPos({
                    x: Math.random() * 120 - 60,
                    y: Math.random() * 120 - 60,
                  })
                }
              >
                NO 🙃
              </button>
            </>
          ) : (
            <>
              <h1 className="floating">💖 I knew you’d say yes 💖</h1>
              <p className="floating">
                Thank you for being my favourite person,
                <br />
                my happiest place, and my forever Valentine.
              </p>
            </>
          )}
        </div>
      )}
    </main>
  );
}
