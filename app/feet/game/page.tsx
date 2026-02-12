"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUserApi, getMinigameLibraryApi } from "@/lib/api";

export default function FeetGamePage() {
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLibrary = useCallback(async (folder?: string) => {
    const data = await getMinigameLibraryApi(folder);
    setImages(data.images);
    setIndex(0);
    setLikes(0);
    setDislikes(0);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await getCurrentUserApi();
      await loadLibrary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando minijuego");
    } finally {
      setLoading(false);
    }
  }, [loadLibrary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentImage = images[index] ?? null;
  const total = images.length;
  const finished = total > 0 && index >= total;

  const progressLabel = useMemo(() => {
    if (!total) return "0/0";
    const viewed = Math.min(index + 1, total);
    return `${viewed}/${total}`;
  }, [index, total]);

  const onSwipe = (action: "like" | "dislike") => {
    if (!currentImage) return;

    if (action === "like") setLikes((prev) => prev + 1);
    if (action === "dislike") setDislikes((prev) => prev + 1);
    setIndex((prev) => prev + 1);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed md:h-screen md:overflow-hidden"
      style={{ backgroundImage: "url('/images/ui/backgroud-login2.png')" }}
    >
      <div className="mx-auto w-full max-w-5xl p-6 md:h-full md:overflow-y-auto">
        <main className="mx-auto w-full max-w-4xl space-y-6">
          <div>
            <Link
              href="/feet"
              className="inline-block rounded border border-amber-300 bg-[#fffaf0]/70 px-3 py-2 text-amber-900 hover:bg-amber-100"
            >
              ← Volver a Feet
            </Link>
          </div>

          <section className="rounded-xl border border-amber-200 bg-[#fffaf0]/55 p-5 shadow-sm backdrop-blur-[1px]">
            <h1 className="text-2xl font-bold text-amber-950">Feet Swipe</h1>
            <p className="mt-1 text-sm text-amber-900">
              Juega con la selección de imágenes del minijuego.
            </p>
            <p className="mt-2 text-sm text-amber-900">
              Progreso: <span className="font-semibold">{progressLabel}</span>
            </p>
          </section>

          {loading && <p>Cargando minijuego...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && !total && (
            <section className="rounded-xl border border-amber-200 bg-[#fffaf0]/55 p-5 shadow-sm">
              <p className="text-amber-900">No hay imágenes en la carpeta seleccionada.</p>
            </section>
          )}

          {!loading && !error && total > 0 && !finished && currentImage && (
            <section className="rounded-xl border border-amber-200 bg-[#fffaf0]/55 p-5 shadow-sm">
              <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
                <img
                  src={currentImage}
                  alt="Carta del minijuego"
                  className="h-[380px] w-full object-contain"
                />
              </div>

              <div className="mt-5 flex items-end justify-center gap-5">
                <button
                  type="button"
                  onClick={() => onSwipe("dislike")}
                  className="flex h-28 w-28 flex-col items-center justify-center gap-1 overflow-hidden rounded-full border-2 border-amber-400 bg-[#fffaf0]/80 shadow-sm transition hover:scale-[1.03] hover:bg-amber-100"
                >
                  <Image
                    src="/images/ui/dislike_button_v2.png"
                    alt="Descartar"
                    width={108}
                    height={108}
                    className="h-[4.75rem] w-[4.75rem] object-contain"
                  />
                  <span className="text-[10px] font-bold tracking-wide text-amber-900">DISLIKE</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSwipe("like")}
                  className="flex h-28 w-28 flex-col items-center justify-center gap-1 overflow-hidden rounded-full border-2 border-amber-400 bg-[#fffaf0]/80 shadow-sm transition hover:scale-[1.03] hover:bg-amber-100"
                >
                  <Image
                    src="/images/ui/like_buton.png"
                    alt="Me gusta"
                    width={108}
                    height={108}
                    className="h-[4.75rem] w-[4.75rem] object-contain"
                  />
                  <span className="text-[10px] font-bold tracking-wide text-amber-900">LIKE</span>
                </button>
              </div>
            </section>
          )}

          {!loading && !error && finished && (
            <section className="rounded-xl border border-amber-200 bg-[#fffaf0]/55 p-5 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-amber-950">Fin del juego</h2>
              <p className="mt-2 text-sm text-amber-900">
                Likes: <span className="font-semibold">{likes}</span> · DISLIKE:{" "}
                <span className="font-semibold">{dislikes}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setIndex(0);
                  setLikes(0);
                  setDislikes(0);
                }}
                className="mt-4 rounded bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800"
              >
                Jugar de nuevo
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
