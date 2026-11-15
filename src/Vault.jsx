import { useEffect, useState } from "react";
import { get, set } from "idb-keyval";

export default function Vault({ onLock }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    get("vault").then((saved) => setItems(saved || []));
  }, []);

  const save = async (list) => {
    setItems(list);
    await set("vault", list);
  };

  const addFiles = async (e) => {
    const files = Array.from(e.target.files).map((f) => ({
      id: crypto.randomUUID(),
      type: f.type,
      blob: f,
    }));
    await save([...items, ...files]);
  };

  const remove = (id) => save(items.filter((i) => i.id !== id));

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Private Vault</h1>
        <button onClick={onLock} className="bg-red-600 px-4 py-2 rounded-lg">
          Lock
        </button>
      </div>

      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={addFiles}
        className="mb-4"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => {
          const url = URL.createObjectURL(item.blob);
          return (
            <div key={item.id} className="relative">
              {item.type.startsWith("video") ? (
                <video src={url} controls className="rounded-lg w-full" />
              ) : (
                <img src={url} className="rounded-lg w-full" />
              )}
              <button
                onClick={() => remove(item.id)}
                className="absolute top-1 right-1 bg-black/70 px-2 rounded"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}