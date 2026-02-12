"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  createReviewApi,
  deleteReviewApi,
  getCurrentUserApi,
  getFootByIdApi,
  getReviewsByFootApi,
  updateReviewApi,
} from "@/lib/api";
import { getArchTypeLabel } from "@/lib/archType";
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
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
  const [pendingDeleteReviewId, setPendingDeleteReviewId] = useState<number | null>(null);
  const [friendlyPopupMessage, setFriendlyPopupMessage] = useState("");

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
      const message = err instanceof Error ? err.message : "Error creando review";
      if (message.toLowerCase().includes("already review this foot")) {
        setFriendlyPopupMessage("Ya tienes una review en este foot. Solo puedes publicar una review por pie, pero puedes editar la que ya hiciste.");
        return;
      }
      setError(message);
    }
  };

  const openEditReview = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rateAspect);
    setEditComment(review.comment);
  };

  const closeEditReview = () => {
    if (savingEdit) return;
    setEditingReview(null);
    setEditRating(5);
    setEditComment("");
  };

  const onUpdateReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;

    setError("");
    setSavingEdit(true);
    try {
      await updateReviewApi(editingReview.id, {
        rateAspect: editRating,
        comment: editComment,
      });
      await loadData();
      closeEditReview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando review");
    } finally {
      setSavingEdit(false);
    }
  };

  const onDeleteReview = async () => {
    const reviewId = pendingDeleteReviewId;
    if (!reviewId) return;
    if (currentUser?.role !== "ROLE_ADMIN") return;

    setError("");
    setDeletingReviewId(reviewId);
    try {
      await deleteReviewApi(reviewId);
      await loadData();
      setPendingDeleteReviewId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando review");
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed md:h-screen md:overflow-hidden"
        style={{ backgroundImage: "url('/images/ui/backgroud-login2.png')" }}
      >
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-stretch md:h-full md:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="hidden md:block" />
          <main className="order-1 p-6 md:order-2 md:h-screen md:overflow-y-auto">Cargando...</main>
          <div className="order-3 h-full w-full md:sticky md:top-0 md:h-screen md:w-[320px] md:overflow-y-auto">
            <RightSidebar currentUser={currentUser} showMinigameButton={false} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed md:h-screen md:overflow-hidden"
      style={{ backgroundImage: "url('/images/ui/backgroud-login2.png')" }}
    >
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-stretch md:h-full md:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="hidden md:block" />
        <main className="order-1 w-full max-w-4xl mx-auto p-6 space-y-6 md:order-2 md:h-screen md:overflow-y-auto">
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
                alt={foot.title}
                className="mx-auto w-full max-h-[70vh] object-contain bg-white"
              />
              <div className="p-4 space-y-1">
                <h1 className="text-2xl font-bold">{foot.title}</h1>
                <p className="text-amber-900">Arco: {getArchTypeLabel(foot.archType)}</p>
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
                {currentUser?.username === r.reviewUsername && (
                  <button
                    type="button"
                    onClick={() => openEditReview(r)}
                    className="mt-2 rounded bg-amber-700 px-3 py-2 text-xs text-white hover:bg-amber-800"
                  >
                    Editar
                  </button>
                )}
                {currentUser?.role === "ROLE_ADMIN" && (
                  <button
                    type="button"
                    onClick={() => setPendingDeleteReviewId(r.id)}
                    disabled={deletingReviewId === r.id}
                    className="ml-2 mt-2 rounded border border-red-300 px-3 py-2 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingReviewId === r.id ? "Eliminando..." : "Eliminar review"}
                  </button>
                )}
              </article>
            ))}
          </section>
        </main>
        <div className="order-3 h-full w-full md:sticky md:top-0 md:h-screen md:w-[320px] md:overflow-y-auto">
          <RightSidebar currentUser={currentUser} showMinigameButton={false} />
        </div>
      </div>

      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-amber-200 bg-[#fffaf0] p-5 shadow-xl">
            <h2 className="text-xl font-semibold text-amber-950">Editar review</h2>
            <p className="mt-1 text-sm text-amber-900">Review #{editingReview.id}</p>

            <form onSubmit={onUpdateReview} className="mt-4 space-y-3">
              <input
                className="w-full rounded border border-amber-300 bg-[#fffdf7]/80 p-2"
                type="number"
                min={1}
                max={5}
                value={editRating}
                onChange={(e) => setEditRating(Number(e.target.value))}
                required
              />
              <textarea
                className="w-full rounded border border-amber-300 bg-[#fffdf7]/80 p-2"
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditReview}
                  disabled={savingEdit}
                  className="rounded border border-amber-300 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded bg-amber-700 px-3 py-2 text-sm text-white hover:bg-amber-800 disabled:opacity-60"
                >
                  {savingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDeleteReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-amber-200 bg-[#fffaf0] p-5 shadow-xl">
            <h2 className="text-xl font-semibold text-amber-950">Eliminar review</h2>
            <p className="mt-1 text-sm text-amber-900">
              Vas a eliminar una review del feed. Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteReviewId(null)}
                disabled={deletingReviewId === pendingDeleteReviewId}
                className="rounded border border-amber-300 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onDeleteReview}
                disabled={deletingReviewId === pendingDeleteReviewId}
                className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {deletingReviewId === pendingDeleteReviewId ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {friendlyPopupMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-amber-200 bg-[#fffaf0] p-5 shadow-xl">
            <h2 className="text-xl font-semibold text-amber-950">Ya tienes una reseña</h2>
            <p className="mt-2 text-sm text-amber-900">{friendlyPopupMessage}</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setFriendlyPopupMessage("")}
                className="rounded bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
