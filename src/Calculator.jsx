import { useEffect, useState } from "react";

const STORAGE_KEY = "calc_secret_hash";
const MIN_LENGTH = 4;

// Hash the code so the real number is never stored in plain text
async function hashCode(code) {
  const data = new TextEncoder().encode(code);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const pretty = (s) => s.replace(/\//g, "÷").replace(/\*/g, "×").replace(/-/g, "−");

const rows = [
  [
    { label: "AC", kind: "fn" },
    { label: "±", kind: "fn" },
    { label: "%", kind: "fn" },
    { label: "÷", kind: "op", value: "/" },
  ],
  [
    { label: "7" }, { label: "8" }, { label: "9" },
    { label: "×", kind: "op", value: "*" },
  ],
  [
    { label: "4" }, { label: "5" }, { label: "6" },
    { label: "−", kind: "op", value: "-" },
  ],
  [
    { label: "1" }, { label: "2" }, { label: "3" },
    { label: "+", kind: "op", value: "+" },
  ],
  [
    { label: "0", wide: true },
    { label: "." },
    { label: "=", kind: "op" },
  ],
];

const styles = {
  num: "bg-[#333333] active:bg-[#737373] text-white",
  fn: "bg-[#a5a5a5] active:bg-[#d9d9d9] text-black",
  op: "bg-[#ff9f0a] active:bg-[#fcc78a] text-white",
};

export default function Calculator({ onUnlock }) {
  // mode: loading -> setup -> confirm -> normal
  const [mode, setMode] = useState("loading");
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState("");
  const [firstCode, setFirstCode] = useState("");
  const [message, setMessage] = useState("");
  const [fresh, setFresh] = useState(false); // true right after "=" shows a result

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setMode("normal");
    } else {
      setMode("setup");
      setMessage(`Set your secret code (min ${MIN_LENGTH} digits), then press =`);
    }
  }, []);

  const press = (v) => {
    if (fresh && /[0-9.]/.test(v)) {
      setExpr(v);
    } else {
      setExpr((d) => d + v);
    }
    setFresh(false);
  };

  const backspace = () => setExpr((d) => d.slice(0, -1));

  const clear = () => {
    setExpr("");
    setHistory("");
    setFresh(false);
  };

  const toggleSign = () => {
    if (/^-?\d*\.?\d+$/.test(expr)) {
      setExpr(expr.startsWith("-") ? expr.slice(1) : "-" + expr);
    }
  };

  const percent = () => {
    if (/^-?\d*\.?\d+$/.test(expr)) setExpr(String(Number(expr) / 100));
  };

  const equals = async () => {
    if (!expr) return;

    // ---- first-time setup ----
    if (mode === "setup") {
      if (!/^\d+$/.test(expr) || expr.length < MIN_LENGTH) {
        setMessage(`Code must be at least ${MIN_LENGTH} digits`);
        setExpr("");
        return;
      }
      setFirstCode(expr);
      setExpr("");
      setMode("confirm");
      setMessage("Enter the same code again, then press =");
      return;
    }

    if (mode === "confirm") {
      if (expr === firstCode) {
        localStorage.setItem(STORAGE_KEY, await hashCode(expr));
        setExpr("");
        setFirstCode("");
        setMode("normal");
        setMessage("");
      } else {
        setExpr("");
        setFirstCode("");
        setMode("setup");
        setMessage("Codes did not match. Set your secret code again");
      }
      return;
    }

    // ---- normal mode: check secret first ----
    if (/^\d+$/.test(expr) && expr.length >= MIN_LENGTH) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if ((await hashCode(expr)) === saved) {
        setExpr("");
        onUnlock();
        return;
      }
    }

    // ---- otherwise act as a normal calculator ----
    try {
      if (!/^[0-9+\-*/.() ]+$/.test(expr)) return;
      const result = Function(`return (${expr})`)();
      if (!Number.isFinite(result)) throw new Error("bad");
      setHistory(pretty(expr));
      setExpr(String(Math.round(result * 1e10) / 1e10));
      setFresh(true);
    } catch {
      setExpr("Error");
      setFresh(true);
    }
  };

  const handle = (b) => {
    if (b.label === "AC") return clear();
    if (b.label === "±") return toggleSign();
    if (b.label === "%") return percent();
    if (b.label === "=") return equals();
    if (expr === "Error") setExpr("");
    press(b.value ?? b.label);
  };

  if (mode === "loading") return <div className="min-h-screen bg-black" />;

  const shown = expr ? pretty(expr) : "0";
  const size =
    shown.length > 12 ? "text-4xl" : shown.length > 8 ? "text-5xl" : "text-7xl";

  return (
    <div className="min-h-screen bg-black flex items-end sm:items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm">
        {/* display */}
        <div className="px-3 pb-3 text-right text-white">
          <div className="h-6 text-sm text-zinc-500 truncate">
            {message || history}
          </div>
          <div className="flex items-center justify-between gap-3 mt-2">
            <button
              onClick={backspace}
              aria-label="Delete last digit"
              className="text-zinc-400 active:text-white p-2"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" />
                <path d="M17 9l-5 6M12 9l5 6" />
              </svg>
            </button>
            <div className={`${size} font-light tabular-nums truncate`}>
              {shown}
            </div>
          </div>
        </div>

        {/* keypad */}
        <div className="grid grid-cols-4 gap-3">
          {rows.flat().map((b) => {
            const kind = b.kind || "num";
            const label = b.label === "AC" && expr ? "C" : b.label;
            return (
              <button
                key={b.label}
                onClick={() => handle(b)}
                className={`${styles[kind]} ${
                  b.wide
                    ? "col-span-2 justify-start pl-8 py-5"
                    : "aspect-square justify-center"
                } rounded-full flex items-center text-3xl transition-colors`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}