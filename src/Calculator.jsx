import { useState } from "react";

const SECRET = "1234"; // change this to your own code

export default function Calculator({ onUnlock }) {
  const [display, setDisplay] = useState("");

  const press = (v) => setDisplay((d) => d + v);

  const equals = () => {
    if (display === SECRET) {
      setDisplay("");
      onUnlock();
      return;
    }
    try {
      if (!/^[0-9+\-*/.() ]+$/.test(display)) return;
      setDisplay(String(Function(`return (${display})`)()));
    } catch {
      setDisplay("Error");
    }
  };

  const buttons = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+"];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-72 bg-zinc-900 rounded-2xl p-4">
        <div className="h-16 text-right text-white text-3xl p-2 overflow-hidden">
          {display || "0"}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((b) => (
            <button
              key={b}
              onClick={() => (b === "=" ? equals() : press(b))}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-xl py-4 rounded-xl"
            >
              {b}
            </button>
          ))}
          <button
            onClick={() => setDisplay("")}
            className="col-span-4 bg-orange-500 text-white py-3 rounded-xl"
          >
            C
          </button>
        </div>
      </div>
    </div>
  );
}