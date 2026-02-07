"use client";

import { FormEvent, useEffect, useState } from "react";
import { createFootApi, getFeetApi } from "@/lib/api";
import type { Foot } from "@/lib/types";
import Link from "next/link";

export default function FeetPage() {
  const [feet, setFeet] = useState<Foot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [nickname, setNickname] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [archType, setArchType] = useState<"PES_PLANUS" | "PES_RECTUS" | "PES_CAVUS">("PES_RECTUS");

  const loadFeet = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getFeetApi();
      setFeet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando feet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeet();
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createFootApi({ nickname, imageUrl, archType });
      setNickname("");
      setImageUrl("");
      setArchType("PES_PLANUS");
      await loadFeet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando foot");
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Feet</h1>

      <section className="border rounded-xl p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Crear foot</h2>
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-3">
          <input className="border p-2 rounded" placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
          <input className="border p-2 rounded" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
          <select className="border p-2 rounded" value={archType} onChange={(e) => setArchType(e.target.value as "PES_PLANUS" | "PES_RECTUS" | "PES_CAVUS")} required>
            <option value="PES_PLANUS">PES_PLANUS</option>
            <option value="PES_RECTUS">PES_RECTUS</option>
            <option value="PES_CAVUS">PES_CAVUS</option>
          </select>
          <button className="md:col-span-3 bg-black text-white px-4 py-2 rounded">Crear</button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Listado</h2>
        {loading && <p>Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !feet.length && <p>No hay feet todavía.</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feet.map((f) => (
             <article key={f.id} className="border rounded-xl overflow-hidden shadow-sm">
                 <img src={f.imageUrl} alt={f.nickname} className="w-full h-44 object-cover" />
                 <div className="p-3 space-y-2">
                    <h3 className="font-semibold">{f.nickname}</h3>
                    <p className="text-sm text-gray-600">Arco: {f.archType}</p>
                    <p className="text-sm text-gray-600">Owner: {f.ownerUsername}</p>

                    <Link
                        href={`/feet/${f.id}`}
                        className="inline-block bg-black text-white text-sm px-3 py-2 rounded hover:opacity-90"
                    >
                        Ver detalle
                    </Link>
                </div>
            </article>
        ))}

        </div>
      </section>
    </main>
  );
}
