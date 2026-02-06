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
  const [saidYes, setSaidYes] = useState(false);

  // Scratch states
  const [scratchReady, setScratchReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  /* ---------- SCRATCH SETUP ---------- */

  useEffect(() => {
    if (!scratchReady || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.fillStyle = "#ffd6e7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "destination-out";

    const scratch = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();
    };

    let active = false;

    const start = () => (active = true);
    const end = () => (active = false);
    const move = (e: any) => {
      if (!active) return;
      const p = e.touches ? e.touches[0] : e;
      scratch(p.clientX - rect.left, p.clientY - rect.top);
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchend", end);
    canvas.addEventListener("touchmove", move);

    return () => {
      canvas.replaceWith(canvas.cloneNode(true));
    };
  }, [scratchReady]);

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
          {!allAnswered && <p className="waiting">Waiting for other player…</p>}
          {allAnswered && <button className="primary-btn" onClick={next}>Next ▶️</button>}
        </div>
      )}

      {/* MINI GAMES (unchanged logic) */}
      {room.step === QUESTIONS.length && (
        <div className="card column">
          <h2>Pick the same side 💕</h2>
          {["⬅ LEFT", "RIGHT ➡"].map((o) => (
            <button key={o} className="option-btn"
              onClick={() => !answered && updateDoc(roomRef, { [`answers.${playerId}`]: o })}>
              {o}
            </button>
          ))}
          {allAnswered && <button className="primary-btn" onClick={next}>Continue ▶️</button>}
        </div>
      )}

      {room.step === QUESTIONS.length + 1 && (
        <div className="card column">
          <h2>Tap like crazy 💥</h2>
          <button className="primary-btn" onClick={() => {
            setTapCount(tapCount + 1);
            updateDoc(roomRef, { [`answers.${playerId}`]: tapCount + 1 });
          }}>
            TAP
          </button>
          {allAnswered && <button className="primary-btn" onClick={next}>Continue ▶️</button>}
        </div>
      )}

      {room.step === QUESTIONS.length + 2 && (
        <div className="card column">
          <h2>How much do you like surprises?</h2>
          <input type="range" min="0" max="100"
            onChange={(e) =>
              updateDoc(roomRef, { [`answers.${playerId}`]: e.target.value })
            }
          />
          {allAnswered && <button className="primary-btn" onClick={next}>Continue ▶️</button>}
        </div>
      )}

      {/* FINAL SCRATCH + VALENTINE */}
      {room.step === TOTAL_STEPS - 1 && (
        <div className="card column">
          {!scratchReady && (
            <>
              <h2>Scratch to reveal 💕</h2>
              <div style={{ position: "relative", height: 160 }}>
                <canvas ref={canvasRef} style={{ width: "100%", height: "100%", borderRadius: 20 }} />
                <button
                  className="primary-btn"
                  style={{ position: "absolute", inset: 0 }}
                  onClick={() => setScratchReady(true)}
                >
                  ✨ Scratch Me ✨
                </button>
              </div>
            </>
          )}

          {scratchReady && !saidYes && (
            <>
              <h1 className="floating">Will you be my Valentine? 💖</h1>
              <p style={{ opacity: 0.7 }}>Go on… try saying no 😏</p>

              <button
                className="primary-btn floating"
                onClick={() => {
                  navigator.vibrate?.([120, 60, 120]);
                  setSaidYes(true);
                }}
              >
                YES 💕
              </button>

              <button
                style={{ transform: `translate(${noPos.x}px, ${noPos.y}px)` }}
                onMouseEnter={() =>
                  setNoPos({
                    x: Math.random() * 140 - 70,
                    y: Math.random() * 140 - 70,
                  })
                }
              >
                NO 🙃
              </button>
            </>
          )}

          {saidYes && (
            <>
              <h1 className="floating">💖 I KNEW IT 💖</h1>
              <p className="floating">
                Thank you for being my favourite person,
                <br /> my happiest place, and my forever Valentine.
              </p>
            </>
          )}
        </div>
      )}
    </main>
  );
}
