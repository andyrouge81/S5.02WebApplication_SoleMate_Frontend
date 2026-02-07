"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createReviewApi, getFootByIdApi, getReviewsByFootApi } from "@/lib/api";
import type { Foot, Review } from "@/lib/types";

export default function FootDetailPage() {
  const params = useParams<{ id: string }>();
  const footId = params?.id;

  const [foot, setFoot] = useState<Foot | null>(null);
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
      const [footData, reviewData] = await Promise.all([
        getFootByIdApi(footId),
        getReviewsByFootApi(footId),
      ]);
      setFoot(footData);
      setReviews(reviewData);
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

  if (loading) return <main className="p-6">Cargando...</main>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      {/* BOTÓN VOLVER */}
      <div>
        <Link
          href="/feet"
          className="inline-block border px-3 py-2 rounded hover:bg-gray-100"
        >
          ← Volver a Feet
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {!foot ? (
        <p>Foot no encontrado</p>
      ) : (
        <section className="border rounded-xl overflow-hidden shadow-sm">
          <img
            src={foot.imageUrl}
            alt={foot.nickname}
            className="w-full h-72 object-cover"
          />
          <div className="p-4 space-y-1">
            <h1 className="text-2xl font-bold">{foot.nickname}</h1>
            <p className="text-gray-600">Arco: {foot.archType}</p>
            <p className="text-gray-600">Owner: {foot.ownerUsername}</p>
          </div>
        </section>
      )}

      <section className="border rounded-xl p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Crear review</h2>
        <form onSubmit={onCreateReview} className="space-y-3">
          <input
            className="w-full border p-2 rounded"
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          />
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Tu comentario"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
          <button className="bg-black text-white px-4 py-2 rounded">
            Publicar review
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Reviews</h2>
        {!reviews.length && <p>No hay reviews todavía.</p>}
        {reviews.map((r) => (
          <article key={r.id} className="border rounded-lg p-3">
            <p className="font-semibold">⭐ {r.rateAspect}/5</p>
            <p>{r.comment}</p>
            <p className="text-sm text-gray-500">por {r.reviewUsername}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
