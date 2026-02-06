"use client";

import { useEffect, useRef, useState } from "react";
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

const TOTAL_STEPS = QUESTIONS.length + 3 + 1;

/* ===================== GAME ===================== */

export default function GameRoom() {
  const { roomId } = useParams() as { roomId: string };

  const [room, setRoom] = useState<any>(null);
  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading] = useState(true);

  const [tapCount, setTapCount] = useState(0);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });

  // Final sequence states
  const [scratchDone, setScratchDone] = useState(false);
  const [saidYes, setSaidYes] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

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
        <div className="card"><h2>Joining…</h2></div>
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

  /* ===================== UI ===================== */

  return (
    <main className="screen">
      <button className="skip-btn" onClick={next}>Skip ⏭</button>

      {/* QUESTIONS */}
      {room.step < QUESTIONS.length && (
        <div className="card column">
          <h2>{QUESTIONS[room.step].q}</h2>
          {QUESTIONS[room.step].o.map((opt) => (
            <button
              key={opt}
              className={`option-btn ${answers[playerId] === opt ? "selected" : ""}`}
              onClick={() =>
                !answered &&
                updateDoc(roomRef, { [`answers.${playerId}`]: opt })
              }
            >
              {opt}
            </button>
          ))}
          {!allAnswered && <p className="waiting">Waiting…</p>}
          {allAnswered && <button className="primary-btn" onClick={next}>Next ▶️</button>}
        </div>
      )}

      {/* FINAL VALENTINE */}
      {room.step === TOTAL_STEPS - 1 && (
        <div className="card column center">
          {!scratchDone && (
            <>
              <h2>Scratch to reveal 💕</h2>
              <button className="primary-btn" onClick={() => setScratchDone(true)}>
                ✨ Scratch Me ✨
              </button>
            </>
          )}

          {scratchDone && !saidYes && (
            <>
              <h1 className="floating">Will you be my Valentine? 💖</h1>
              <p style={{ opacity: 0.7 }}>Go on… try saying no 😏</p>

              <button
                className="primary-btn floating"
                onClick={() => {
                  navigator.vibrate?.([120, 60, 120]);
                  setSaidYes(true);
                  setTimeout(() => setCelebrate(true), 600);
                }}
              >
                YES 💕
              </button>

              <button
                onMouseEnter={() =>
                  setNoPos({
                    x: Math.random() * 140 - 70,
                    y: Math.random() * 140 - 70,
                  })
                }
                style={{ transform: `translate(${noPos.x}px, ${noPos.y}px)` }}
              >
                NO 🙃
              </button>
            </>
          )}

          {/* 💘 CELEBRATION */}
          {celebrate && (
            <div className="celebration">
              <div className="heart-container">
                <div className="heart left" />
                <div className="heart right" />
                <div className="graffiti">I KNEW IT 💖</div>
              </div>

              <div className="heart-burst">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i}>💘</span>
                ))}
              </div>

              <p className="final-text">
                Thank you for being my favourite person,
                <br />
                my happiest place, and my forever Valentine.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===== CELEBRATION STYLES ===== */}
      <style jsx>{`
        .celebration {
          position: relative;
          text-align: center;
          animation: fadeIn 0.6s ease;
        }

        .heart-container {
          position: relative;
          width: 140px;
          height: 120px;
          margin: 20px auto;
        }

        .heart {
          position: absolute;
          width: 70px;
          height: 110px;
          background: #ff4f8b;
          border-radius: 50px 50px 0 0;
          top: 0;
        }

        .heart.left {
          left: 0;
          transform: rotate(-45deg);
          animation: openLeft 0.8s ease forwards;
        }

        .heart.right {
          right: 0;
          transform: rotate(45deg);
          animation: openRight 0.8s ease forwards;
        }

        .graffiti {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          font-weight: 800;
          color: #ff2d7a;
          animation: pop 0.6s ease 0.8s forwards;
          opacity: 0;
        }

        .heart-burst span {
          position: absolute;
          animation: burst 1.2s ease forwards;
        }

        .final-text {
          margin-top: 20px;
          animation: fadeIn 1s ease 1.2s forwards;
          opacity: 0;
        }

        @keyframes openLeft {
          to { transform: translateX(-60px) rotate(-45deg); }
        }
        @keyframes openRight {
          to { transform: translateX(60px) rotate(45deg); }
        }
        @keyframes pop {
          to { opacity: 1; transform: scale(1.2); }
        }
        @keyframes burst {
          from { transform: scale(0); }
          to { transform: translateY(-120px) scale(1); }
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
