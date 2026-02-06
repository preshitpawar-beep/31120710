"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
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
/* ================= GAME ================= */

export default function GameRoom() {
  const { roomId } = useParams() as { roomId: string };

  const [room, setRoom] = useState<any>(null);
  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading] = useState(true);

  const [scratchDone, setScratchDone] = useState(false);
  const [saidYes, setSaidYes] = useState(false);
  const [showCouple, setShowCouple] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });

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

  /* ---------- SCRATCH LOGIC (FIXED) ---------- */
  useEffect(() => {
    if (!canvasRef.current || scratchDone) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 300;
    const height = 160;

    canvas.width = width;
    canvas.height = height;

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ffb6c1";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "destination-out";

    let isDrawing = false;
    let scratched = 0;
    const revealThreshold = width * height * 0.35;

    const getPos = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      const x =
        (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y =
        (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return { x, y };
    };

    const scratch = (e: any) => {
      if (!isDrawing) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      scratched += Math.PI * 18 * 18;
      if (scratched > revealThreshold) setScratchDone(true);
    };

    const start = (e: any) => {
      isDrawing = true;
      scratch(e);
    };
    const end = () => (isDrawing = false);

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", scratch);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);

    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", scratch, { passive: false });
    canvas.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", scratch);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", scratch);
      canvas.removeEventListener("touchend", end);
    };
  }, [scratchDone]);

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

  /* ================= UI ================= */

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

      {/* SCRATCH + VALENTINE */}
      {room.step >= QUESTIONS.length && (
        <div className="card column center">
          {!scratchDone && (
            <>
              <p>Scratch to reveal 💕</p>
              <canvas
                ref={canvasRef}
                style={{
                  width: "300px",
                  height: "160px",
                  borderRadius: "16px",
                  touchAction: "none",
                }}
              />
            </>
          )}

          {scratchDone && !saidYes && (
            <>
              <h1>Will you be my Valentine? 💖</h1>
              <p style={{ opacity: 0.6 }}>Try saying no 😏</p>

              <button
                className="primary-btn"
                onClick={() => {
                  navigator.vibrate?.([120, 60, 120]);
                  setSaidYes(true);
                  setShowCouple(true);
                  setTimeout(() => setShowHeart(true), 5000);
                }}
              >
                YES 💕
              </button>

              <button
                onMouseEnter={() =>
                  setNoPos({
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100,
                  })
                }
                onTouchStart={() =>
                  setNoPos({
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100,
                  })
                }
                style={{ transform: `translate(${noPos.x}px, ${noPos.y}px)` }}
              >
                NO 🙃
              </button>
            </>
          )}

          {/* STICK FIGURES */}
          {showCouple && !showHeart && (
            <svg width="300" height="160" className="stick">
              <g className="boy">
                <circle cx="40" cy="30" r="10" />
                <line x1="40" y1="40" x2="40" y2="80" />
                <line x1="40" y1="50" x2="20" y2="65" />
                <line x1="40" y1="50" x2="60" y2="65" />
                <line x1="40" y1="80" x2="25" y2="110" />
                <line x1="40" y1="80" x2="55" y2="110" />
              </g>

              <g className="girl">
                <circle cx="260" cy="30" r="10" />
                <line x1="260" y1="40" x2="260" y2="80" />
                <line x1="260" y1="50" x2="240" y2="65" />
                <line x1="260" y1="50" x2="280" y2="65" />
                <line x1="260" y1="80" x2="245" y2="110" />
                <line x1="260" y1="80" x2="275" y2="110" />
              </g>

              <text x="150" y="50" className="kiss">❤️</text>
            </svg>
          )}

          {/* HEART */}
          {showHeart && (
            <div className="heart">
              <h2>I KNEW IT 💖</h2>
              <p>You are my forever Valentine.</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        svg {
          stroke: #000;
          stroke-width: 3;
          fill: none;
        }
        .boy {
          animation: walkLeft 3s forwards;
        }
        .girl {
          animation: walkRight 3s forwards;
        }
        .kiss {
          opacity: 0;
          animation: kiss 1s ease 3s forwards;
          fill: red;
          font-size: 20px;
        }
        @keyframes walkLeft {
          to { transform: translateX(80px); }
        }
        @keyframes walkRight {
          to { transform: translateX(-80px); }
        }
        @keyframes kiss {
          to { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
