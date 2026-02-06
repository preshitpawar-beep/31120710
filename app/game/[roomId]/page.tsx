"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
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

  const [revealText, setRevealText] = useState("");
  const [revealed, setRevealed] = useState(false);

  const [saidYes, setSaidYes] = useState(false);
  const [showCouple, setShowCouple] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const kissSoundRef = useRef<HTMLAudioElement | null>(null);

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
    await updateDoc(roomRef, { step: room.step + 1, answers: {} });
  };

  return (
    <main className="screen">
      <audio ref={bgMusicRef} loop src="https://assets.mixkit.co/music/preview/mixkit-romantic-bridge-1212.mp3" />
      <audio ref={kissSoundRef} src="https://assets.mixkit.co/sfx/preview/mixkit-quick-kiss-498.mp3" />

      {/* QUESTIONS */}
      {room.step < QUESTIONS.length && (
        <div className="card column">
          <h2>{QUESTIONS[room.step].q}</h2>
          {QUESTIONS[room.step].o.map((opt) => (
            <button
              key={opt}
              className={`option-btn ${answers[playerId] === opt ? "selected" : ""}`}
              onClick={() =>
                !answered && updateDoc(roomRef, { [`answers.${playerId}`]: opt })
              }
            >
              {opt}
            </button>
          ))}
          {!allAnswered && <p>Waiting for other player…</p>}
          {allAnswered && <button className="primary-btn" onClick={next}>Next ▶️</button>}
        </div>
      )}

      {/* TYPE TO REVEAL */}
      {room.step >= QUESTIONS.length && (
        <div className="card column center">
          {!revealed && (
            <>
              <h2>Type <span className="pink">LOVE</span> to reveal 💕</h2>
              <input
                className="love-input"
                value={revealText}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  setRevealText(v);
                  if (v === "LOVE") setRevealed(true);
                }}
                placeholder="Type here…"
              />
            </>
          )}

          {/* VALENTINE */}
          {revealed && !saidYes && (
            <>
              <h1>Will you be my Valentine? 💖</h1>
              <p className="hint">Try saying no 😏</p>

              <button
                className="primary-btn"
                onClick={() => {
                  navigator.vibrate?.([120, 60, 120]);
                  setSaidYes(true);
                  setShowCouple(true);
                  bgMusicRef.current?.play();
                  setTimeout(() => {
                    kissSoundRef.current?.play();
                    setShowHeart(true);
                  }, 5000);
                }}
              >
                YES 💕
              </button>

              <button
                onMouseEnter={() => setNoPos({ x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 })}
                onTouchStart={() => setNoPos({ x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 })}
                style={{ transform: `translate(${noPos.x}px, ${noPos.y}px)` }}
              >
                NO 🙃
              </button>
            </>
          )}

          {/* STICK COUPLE */}
          {showCouple && !showHeart && (
            <svg width="300" height="160" className="stick">
              <g className="boy">
                <circle cx="40" cy="30" r="10" />
                <line x1="40" y1="40" x2="40" y2="80" />
                <line x1="40" y1="50" x2="20" y2="65" />
                <line x1="40" y1="50" x2="60" y2="65" />
                <line className="leg" x1="40" y1="80" x2="25" y2="110" />
                <line className="leg" x1="40" y1="80" x2="55" y2="110" />
              </g>

              <g className="girl">
                <circle cx="260" cy="30" r="10" />
                <line x1="260" y1="40" x2="260" y2="80" />
                <line x1="260" y1="50" x2="240" y2="65" />
                <line x1="260" y1="50" x2="280" y2="65" />
                <line className="leg" x1="260" y1="80" x2="245" y2="110" />
                <line className="leg" x1="260" y1="80" x2="275" y2="110" />
              </g>

              <text x="150" y="45" className="kiss">❤️</text>
            </svg>
          )}

          {/* HEART SPLIT */}
          {showHeart && (
            <div className="heart-container">
              <div className="heart left" />
              <div className="heart right" />
              <div className="final-message">
                <h2>I knew it 💖</h2>
                <p>
                  From the smallest laughs to the quietest moments,
                  you somehow make everything feel warmer, lighter,
                  and more beautiful just by being you.
                  <br /><br />
                  Thank you for choosing me, for staying,
                  and for being my favourite person in every version of life.
                  <br /><br />
                  Happy Valentine’s Day, my love 💕
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .pink { color: #ff4f8b; }
        .hint { opacity: 0.6; }
        .love-input {
          padding: 12px;
          font-size: 1.2rem;
          border-radius: 12px;
          border: 2px solid #ff4f8b;
          text-align: center;
        }

        svg { stroke: #000; stroke-width: 3; fill: none; }

        .boy { animation: walkLeft 3s forwards; }
        .girl { animation: walkRight 3s forwards; }

        .leg { animation: swing 0.6s infinite alternate; }

        .kiss {
          opacity: 0;
          animation: kiss 1s ease 3s forwards;
          fill: red;
          font-size: 22px;
        }

        .heart-container {
          position: relative;
          width: 160px;
          height: 140px;
          margin: 20px auto;
        }

        .heart {
          position: absolute;
          width: 80px;
          height: 120px;
          background: #ff4f8b;
          border-radius: 50px 50px 0 0;
        }

        .heart.left {
          left: 0;
          transform: rotate(-45deg);
          animation: openLeft 1s forwards;
        }

        .heart.right {
          right: 0;
          transform: rotate(45deg);
          animation: openRight 1s forwards;
        }

        .final-message {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          opacity: 0;
          animation: fadeIn 1.5s forwards 1s;
        }

        @keyframes walkLeft { to { transform: translateX(80px); } }
        @keyframes walkRight { to { transform: translateX(-80px); } }
        @keyframes swing { from { transform: rotate(10deg); } to { transform: rotate(-10deg); } }
        @keyframes kiss { to { opacity: 1; } }
        @keyframes openLeft { to { transform: translateX(-60px) rotate(-45deg); } }
        @keyframes openRight { to { transform: translateX(60px) rotate(45deg); } }
        @keyframes fadeIn { to { opacity: 1; } }
      `}</style>
    </main>
  );
}
