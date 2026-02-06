"use client";

import { useEffect, useState } from "react";
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

/* ================= GAME ================= */

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
                  setTimeout(() => setShowHeart(true), 5000);
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

          {/* STICK COUPLE */}
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

          {/* HEART CELEBRATION */}
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
        .center {
          text-align: center;
        }

        /* STICK FIGURES */
        .couple-stage {
          position: relative;
          width: 100%;
          height: 180px;
        }

        .stick-figure {
          position: absolute;
          width: 80px;
          height: 140px;
          top: 20px;
        }

        .head {
          width: 36px;
          height: 36px;
          border: 4px solid #000;
          border-radius: 50%;
          margin: 0 auto;
        }

        .body {
          width: 4px;
          height: 40px;
          background: #000;
          margin: 0 auto;
        }

        .arm {
          position: absolute;
          width: 30px;
          height: 4px;
          background: #000;
          top: 55px;
        }

        .arm.left {
          left: 0;
          transform: rotate(25deg);
        }

        .arm.right {
          right: 0;
          transform: rotate(-25deg);
        }

        .leg {
          position: absolute;
          width: 30px;
          height: 4px;
          background: #000;
          bottom: 0;
        }

        .leg.left {
          left: 12px;
          transform: rotate(25deg);
        }

        .leg.right {
          right: 12px;
          transform: rotate(-25deg);
        }

        .girl .skirt {
          width: 40px;
          height: 20px;
          border: 4px solid #000;
          border-top: none;
          margin: 0 auto;
        }

        .boy {
          left: -100px;
          animation: boyWalk 3s forwards;
        }

        .girl {
          right: -100px;
          animation: girlWalk 3s forwards;
        }

        .kiss-heart {
          position: absolute;
          left: 50%;
          top: 45px;
          transform: translateX(-50%);
          font-size: 28px;
          opacity: 0;
          animation: kiss 1s ease 3s forwards;
        }

        /* HEART */
        .heart-container {
          position: relative;
          width: 140px;
          height: 120px;
          margin: 10px auto;
        }

        .heart {
          position: absolute;
          width: 70px;
          height: 110px;
          background: #ff4f8b;
          border-radius: 50px 50px 0 0;
        }

        .heart.left {
          left: 0;
          transform: rotate(-45deg);
          animation: openLeft 0.8s forwards;
        }

        .heart.right {
          right: 0;
          transform: rotate(45deg);
          animation: openRight 0.8s forwards;
        }

        .graffiti {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          font-weight: 800;
          opacity: 0;
          animation: pop 0.6s ease 0.8s forwards;
        }

        .final {
          margin-top: 12px;
          opacity: 0;
          animation: fadeIn 1s ease 1.2s forwards;
        }

        @keyframes boyWalk {
          to {
            left: calc(50% - 90px);
          }
        }

        @keyframes girlWalk {
          to {
            right: calc(50% - 90px);
          }
        }

        @keyframes kiss {
          to {
            opacity: 1;
            transform: translateX(-50%) scale(1.2);
          }
        }

        @keyframes openLeft {
          to {
            transform: translateX(-60px) rotate(-45deg);
          }
        }

        @keyframes openRight {
          to {
            transform: translateX(60px) rotate(45deg);
          }
        }

        @keyframes pop {
          to {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
