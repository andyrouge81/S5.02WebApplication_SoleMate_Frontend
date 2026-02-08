"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createReviewApi, getCurrentUserApi, getFootByIdApi, getReviewsByFootApi } from "@/lib/api";
import type { CurrentUser, Foot, Review } from "@/lib/types";
import RightSidebar from "@/components/RightSidebar";

export default function FootDetailPage() {
  const params = useParams<{ id: string }>();
  const footId = params?.id;

  const [foot, setFoot] = useState<Foot | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const loadData = async () => {
    if (!footId) return;
    setLoading(true);
    setError("");
    try {
      const [footData, reviewData, me] = await Promise.all([
        getFootByIdApi(footId),
        getReviewsByFootApi(footId),
        getCurrentUserApi(),
      ]);
      setFoot(footData);
      setReviews(reviewData);
      setCurrentUser(me);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando detalle");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footId]);

  const onCreateReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!footId) return;

    setError("");
    try {
      // IMPORTANTE: el backend espera rateAspect, no rating
      await createReviewApi(footId, { rateAspect: rating, comment });
      setComment("");
      setRating(5);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando review");
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/images/ui/backgroud-login2.png')" }}
      >
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-stretch lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="hidden lg:block" />
          <main className="order-1 p-6 lg:order-2">Cargando...</main>
          <div className="order-3 h-full w-full lg:w-[320px]">
            <RightSidebar currentUser={currentUser} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/images/ui/backgroud-login2.png')" }}
    >
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-stretch lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="hidden lg:block" />
        <main className="order-1 w-full max-w-4xl mx-auto p-6 space-y-6 lg:order-2">
          <div>
            <Link
              href="/feet"
              className="inline-block rounded border border-amber-300 bg-[#fffaf0]/70 px-3 py-2 text-amber-900 hover:bg-amber-100"
            >
              ← Volver a Feet
            </Link>
          </div>

          {error && <p className="text-red-600">{error}</p>}

          {!foot ? (
            <p>Foot no encontrado</p>
          ) : (
            <section className="overflow-hidden rounded-xl border-4 border-amber-200 bg-[#fffaf0] shadow-[0_18px_20px_rgba(180,80,30,0.40)]">
              <img
                src={foot.imageUrl}
                alt={foot.nickname}
                className="mx-auto w-full max-h-[70vh] object-contain bg-white"
              />
              <div className="p-4 space-y-1">
                <h1 className="text-2xl font-bold">{foot.nickname}</h1>
                <p className="text-amber-900">Arco: {foot.archType}</p>
                <p className="text-amber-900">Owner: {foot.ownerUsername}</p>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-amber-200 bg-[#fffaf0]/35 p-4 shadow-sm backdrop-blur-[1px]">
            <h2 className="mb-3 text-xl font-semibold text-amber-950">Pon un comentario</h2>
            <form onSubmit={onCreateReview} className="space-y-3">
              <input
                className="w-full rounded border border-amber-300 bg-[#fffdf7]/80 p-2"
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              />
              <textarea
                className="w-full rounded border border-amber-300 bg-[#fffdf7]/80 p-2"
                placeholder="Tu comentario"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
              <button className="rounded bg-amber-700 px-4 py-2 text-white hover:bg-amber-800">
                Publicar review
              </button>
            </form>
          </section>

          <section className="space-y-3 rounded-xl border border-amber-200 bg-[#fffaf0]/35 p-4 backdrop-blur-[1px] shadow-sm">
            <h2 className="text-xl font-semibold text-amber-950">Reviews</h2>
            {!reviews.length && <p>No hay reviews todavía.</p>}
            {reviews.map((r) => (
              <article key={r.id} className="rounded-lg border border-amber-300 bg-[#fffdf7]/80 p-3">
                <p className="font-semibold text-amber-900">⭐ {r.rateAspect}/5</p>
                <p>{r.comment}</p>
                <p className="text-sm text-gray-500">por {r.reviewUsername}</p>
              </article>
            ))}
          </section>
        </main>
        <div className="order-3 h-full w-full lg:w-[320px]">
          <RightSidebar currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}
