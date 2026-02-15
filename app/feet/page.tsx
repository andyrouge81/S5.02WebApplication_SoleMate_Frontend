"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiHttpError,
  createReviewApi,
  createFootApi,
  deleteFootApi,
  deleteReviewApi,
  getCurrentUserApi,
  getFootByIdApi,
  getFeetApi,
  getMinigameLibraryApi,
  getReviewsByFootApi,
  updateReviewApi,
} from "@/lib/api";
import { ARCH_TYPE_LABELS, getArchTypeLabel } from "@/lib/archType";
import type { ArchType, CurrentUser, Foot, Review } from "@/lib/types";
import Image from "next/image";
import RightSidebar from "@/components/RightSidebar";

const MINIGAME_STATS_TTL_MS = 24 * 60 * 60 * 1000;

type MiniGameStats = {
  likes: number;
  dislikes: number;
  resetAt: number;
};

const buildFreshMiniGameStats = (): MiniGameStats => ({
  likes: 0,
  dislikes: 0,
  resetAt: Date.now() + MINIGAME_STATS_TTL_MS,
});

export default function FeetPage() {
  const [stats, setStats] = useState({
    totalFeet: 0,
    totalReviews: 0,
    myFeet: 0,
    myReviews: 0,
    myAverageRating: 0,
  });
  const [latestReviews, setLatestReviews] = useState<Array<Review & { footId: number }>>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [feet, setFeet] = useState<Foot[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [duplicatePopupMessage, setDuplicatePopupMessage] = useState("");
  const [duplicateFootId, setDuplicateFootId] = useState<number | null>(null);
  const [deletingFootId, setDeletingFootId] = useState<number | null>(null);
  const [pendingDeleteFootId, setPendingDeleteFootId] = useState<number | null>(null);
  const [showMiniGameModal, setShowMiniGameModal] = useState(false);
  const [miniGameImages, setMiniGameImages] = useState<string[]>([]);
  const [miniGameIndex, setMiniGameIndex] = useState(0);
  const [miniGameStats, setMiniGameStats] = useState<MiniGameStats>(buildFreshMiniGameStats);
  const [miniGameLoading, setMiniGameLoading] = useState(false);
  const [miniGameError, setMiniGameError] = useState("");
  const [showFootDetailModal, setShowFootDetailModal] = useState(false);
  const [detailFoot, setDetailFoot] = useState<Foot | null>(null);
  const [detailReviews, setDetailReviews] = useState<Review[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailRating, setDetailRating] = useState(5);
  const [detailComment, setDetailComment] = useState("");
  const [detailFriendlyPopupMessage, setDetailFriendlyPopupMessage] = useState("");
  const [editingDetailReview, setEditingDetailReview] = useState<Review | null>(null);
  const [editDetailRating, setEditDetailRating] = useState(5);
  const [editDetailComment, setEditDetailComment] = useState("");
  const [savingDetailEdit, setSavingDetailEdit] = useState(false);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [archType, setArchType] = useState<ArchType>("PES_RECTUS");

  const loadLatestReviews = useCallback(async (feetSource?: Foot[], username?: string) => {
    setLoadingReviews(true);
    try {
      const feetList = feetSource ?? (await getFeetApi());
      if (!feetList.length) {
        setLatestReviews([]);
        setStats({
          totalFeet: 0,
          totalReviews: 0,
          myFeet: 0,
          myReviews: 0,
          myAverageRating: 0,
        });
        return;
      }

      const allReviews = await Promise.all(
        feetList.map(async (foot) => {
          const reviews = await getReviewsByFootApi(foot.id);
          return reviews.map((review) => ({
            ...review,
            footId: foot.id,
          }));
        })
      );

      const flatReviews = allReviews.flat();

      const ordered = flatReviews
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 14);

      setLatestReviews(ordered);

      const activeUsername = username ?? currentUser?.username ?? "";
      const myFeet = activeUsername
        ? feetList.filter((foot) => foot.ownerUsername === activeUsername).length
        : 0;
      const myReviewsList = activeUsername
        ? flatReviews.filter((review) => review.reviewUsername === activeUsername)
        : [];
      const myAverageRating = myReviewsList.length
        ? myReviewsList.reduce((sum, review) => sum + review.rateAspect, 0) /
          myReviewsList.length
        : 0;

      setStats({
        totalFeet: feetList.length,
        totalReviews: flatReviews.length,
        myFeet,
        myReviews: myReviewsList.length,
        myAverageRating,
      });
    } catch {
      setLatestReviews([]);
      setStats({
        totalFeet: 0,
        totalReviews: 0,
        myFeet: 0,
        myReviews: 0,
        myAverageRating: 0,
      });
    } finally {
      setLoadingReviews(false);
    }
  }, [currentUser?.username]);

  const onImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("El archivo seleccionado no es una imagen");
      e.target.value = "";
      return;
    }

    setError("");
    setUploadingImage(true);
    setSelectedFileName(file.name);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
        reader.readAsDataURL(file);
      });

      setImageUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error subiendo imagen");
      setSelectedFileName("");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, me] = await Promise.all([getFeetApi(), getCurrentUserApi()]);
      setFeet(data);
      setCurrentUser(me);
      await loadLatestReviews(data, me.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando feet");
    } finally {
      setLoading(false);
    }
  }, [loadLatestReviews]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadLatestReviews(undefined, currentUser?.username);
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [loadLatestReviews, currentUser?.username]);

  useEffect(() => {
    if (!currentUser) return;

    const storageKey = `solemate:minigame-stats:${currentUser.id}`;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      const fresh = buildFreshMiniGameStats();
      setMiniGameStats(fresh);
      window.localStorage.setItem(storageKey, JSON.stringify(fresh));
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<MiniGameStats>;
      if (
        typeof parsed.likes !== "number"
        || typeof parsed.dislikes !== "number"
        || typeof parsed.resetAt !== "number"
        || Date.now() >= parsed.resetAt
      ) {
        const fresh = buildFreshMiniGameStats();
        setMiniGameStats(fresh);
        window.localStorage.setItem(storageKey, JSON.stringify(fresh));
        return;
      }

      setMiniGameStats({
        likes: parsed.likes,
        dislikes: parsed.dislikes,
        resetAt: parsed.resetAt,
      });
    } catch {
      const fresh = buildFreshMiniGameStats();
      setMiniGameStats(fresh);
      window.localStorage.setItem(storageKey, JSON.stringify(fresh));
    }
  }, [currentUser]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createFootApi({ title, imageUrl, archType });
      setTitle("");
      setImageUrl("");
      setSelectedFileName("");
      setArchType("PES_PLANUS");
      await loadData();
    } catch (err) {
      if (
        err instanceof ApiHttpError &&
        err.status === 500 &&
        imageUrl.startsWith("data:image/")
      ) {
        setError(
          "El backend no pudo guardar la imagen subida. Revisa imageUrl en backend (usar TEXT o @Lob)."
        );
        return;
      }

      if (err instanceof ApiHttpError && err.status === 409) {
        const duplicateIdMatch = err.message.match(/(\d+)/);
        setDuplicateFootId(duplicateIdMatch ? Number(duplicateIdMatch[1]) : null);
        setDuplicatePopupMessage(
          "Ese pie ya existe en el listado. Entra en esa publicación y añade una review."
        );
        return;
      }

      setError(err instanceof Error ? err.message : "Error creando foot");
    }
  };

  const canDeleteFoot = (foot: Foot) => {
    if (!currentUser) return false;
    if (currentUser.role === "ROLE_ADMIN") return true;
    return currentUser.username === foot.ownerUsername;
  };

  const onDeleteFoot = async () => {
    const footId = pendingDeleteFootId;
    if (!footId) return;
    setError("");
    setDeletingFootId(footId);
    try {
      await deleteFootApi(footId);
      await loadData();
      setPendingDeleteFootId(null);
    } catch (err) {
      if (currentUser?.role === "ROLE_ADMIN") {
        try {
          const reviews = await getReviewsByFootApi(footId);
          await Promise.all(reviews.map((review) => deleteReviewApi(review.id)));
          await deleteFootApi(footId);
          await loadData();
          setPendingDeleteFootId(null);
          return;
        } catch {
          // Si falla el fallback, mostramos el error original.
        }
      }

      setError(
        err instanceof Error
          ? err.message
          : "Error eliminando foot. Puede tener reviews asociadas."
      );
    } finally {
      setDeletingFootId(null);
    }
  };

  const loadMiniGame = useCallback(async () => {
    setMiniGameLoading(true);
    setMiniGameError("");
    try {
      const data = await getMinigameLibraryApi();
      setMiniGameImages(data.images);
      setMiniGameIndex(0);
    } catch (err) {
      setMiniGameError(err instanceof Error ? err.message : "No se pudo cargar el minijuego");
    } finally {
      setMiniGameLoading(false);
    }
  }, []);

  const openMiniGameModal = async () => {
    setShowMiniGameModal(true);
    await loadMiniGame();
  };

  const loadFootDetailData = useCallback(async (footId: number) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      const [footData, reviewData] = await Promise.all([
        getFootByIdApi(String(footId)),
        getReviewsByFootApi(footId),
      ]);
      setDetailFoot(footData);
      setDetailReviews(reviewData);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "No se pudo cargar el detalle");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openFootDetailModal = async (footId: number) => {
    setShowFootDetailModal(true);
    setDetailComment("");
    setDetailRating(5);
    setDetailFriendlyPopupMessage("");
    setEditingDetailReview(null);
    await loadFootDetailData(footId);
  };

  const closeFootDetailModal = () => {
    if (savingDetailEdit) return;
    setShowFootDetailModal(false);
    setDetailFoot(null);
    setDetailReviews([]);
    setDetailError("");
    setDetailComment("");
    setDetailRating(5);
    setDetailFriendlyPopupMessage("");
    setEditingDetailReview(null);
  };

  const onCreateDetailReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!detailFoot) return;
    setDetailError("");
    try {
      await createReviewApi(detailFoot.id, { rateAspect: detailRating, comment: detailComment });
      setDetailComment("");
      setDetailRating(5);
      await Promise.all([loadFootDetailData(detailFoot.id), loadLatestReviews()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error creando review";
      if (message.toLowerCase().includes("already review this foot")) {
        setDetailFriendlyPopupMessage(
          "Ya tienes una review en este pie. Solo puedes publicar una review por pie, pero puedes editar la que ya hiciste."
        );
        return;
      }
      setDetailError(message);
    }
  };

  const openEditDetailReview = (review: Review) => {
    setEditingDetailReview(review);
    setEditDetailRating(review.rateAspect);
    setEditDetailComment(review.comment);
  };

  const closeEditDetailReview = () => {
    if (savingDetailEdit) return;
    setEditingDetailReview(null);
    setEditDetailRating(5);
    setEditDetailComment("");
  };

  const onUpdateDetailReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDetailReview || !detailFoot) return;
    setDetailError("");
    setSavingDetailEdit(true);
    try {
      await updateReviewApi(editingDetailReview.id, {
        rateAspect: editDetailRating,
        comment: editDetailComment,
      });
      await Promise.all([loadFootDetailData(detailFoot.id), loadLatestReviews()]);
      closeEditDetailReview();
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Error actualizando review");
    } finally {
      setSavingDetailEdit(false);
    }
  };


  const onMiniGameSwipe = (action: "like" | "dislike") => {
    const currentImage = miniGameImages[miniGameIndex] ?? null;
    if (!currentImage) return;

    setMiniGameStats((prev) => {
      const expired = Date.now() >= prev.resetAt;
      const base = expired ? buildFreshMiniGameStats() : prev;
      const next = {
        ...base,
        likes: action === "like" ? base.likes + 1 : base.likes,
        dislikes: action === "dislike" ? base.dislikes + 1 : base.dislikes,
      };
      if (currentUser) {
        const storageKey = `solemate:minigame-stats:${currentUser.id}`;
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      }
      return next;
    });

    setMiniGameIndex((prev) => prev + 1);
  };

  const miniGameTotal = miniGameImages.length;
  const miniGameFinished = miniGameTotal > 0 && miniGameIndex >= miniGameTotal;
  const miniGameCurrentImage = miniGameImages[miniGameIndex] ?? null;
  const miniGameProgress = miniGameTotal
    ? `${Math.min(miniGameIndex + 1, miniGameTotal)}/${miniGameTotal}`
    : "0/0";

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed md:h-screen md:overflow-hidden"
      style={{ backgroundImage: "url('/images/ui/backgroud-login2.png')" }}
    >
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-stretch md:h-full md:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="order-2 h-full border-b border-amber-200 bg-[#f8edd3] p-4 md:order-1 md:h-screen md:sticky md:top-0 md:overflow-y-auto md:border-b-0 md:border-r">
          <h3 className="text-lg font-semibold text-amber-950">Ultimas reviews</h3>
          <div className="mt-4 space-y-3">
            {loadingReviews && <p className="text-sm text-amber-900">Actualizando...</p>}
            {!loadingReviews && latestReviews.length === 0 && (
              <p className="text-sm text-amber-900">Todavia no hay reviews.</p>
            )}
            {latestReviews.map((review) => (
              <article key={review.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <p className="font-semibold text-amber-900">
                  Owner {review.reviewUsername} dice:
                </p>
                <p className="mt-1 text-amber-950">{review.comment}</p>
              </article>
            ))}
          </div>
        </aside>

        <main className="order-1 space-y-3 px-6 pb-6 pt-0 md:order-2 md:h-screen md:overflow-y-auto">
          <section className="-mt-22 md:-mt-30">
            <Image
              src="/images/ui/logo-feet.png"
              alt="Logo Feet"
              width={460}
              height={210}
              className="mx-auto h-auto w-[220px] md:w-[340px]"
              priority
            />
          </section>

          <section className="-mt-40 md:-mt-52 rounded-xl border border-amber-200 bg-[#fffaf0]/35 p-6 backdrop-blur-[1px] shadow-[0_18px_22px_rgba(140,90,20,0.28)]">
            <h2 className="text-xl font-semibold mb-3">Listado</h2>
            {loading && <p>Cargando...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && !feet.length && <p>No hay feet todavía.</p>}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {feet.map((f) => (
                <article
                   key={f.id}
                 className="overflow-hidden rounded-xl border border-amber-300 bg-[#fffaf0]/70 backdrop-blur-[1px] shadow-[0_18px_26px_rgba(140,90,20,0.34)]"
                 >
                     <img src={f.imageUrl} alt={f.title} className="w-full h-44 object-cover" />
                     <div className="p-3 space-y-2">
                        <h3 className="font-semibold">{f.title}</h3>
                        <p className="text-sm text-amber-900">Arco: {getArchTypeLabel(f.archType)}</p>
                        <p className="text-sm text-amber-900">Owner: {f.ownerUsername}</p>

                        <button
                          type="button"
                          onClick={() => openFootDetailModal(f.id)}
                          className="inline-block rounded bg-amber-700 px-3 py-2 text-sm text-white hover:bg-amber-800"
                        >
                          Ver detalle
                        </button>
                        {canDeleteFoot(f) && (
                          <button
                            type="button"
                            onClick={() => setPendingDeleteFootId(f.id)}
                            disabled={deletingFootId === f.id}
                            className="ml-2 inline-block rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            {deletingFootId === f.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        )}
                    </div>
                </article>
            ))}

            </div>
          </section>
        </main>
        <div className="order-3 h-full w-full md:sticky md:top-0 md:h-screen md:w-[320px] md:overflow-y-auto">
          <RightSidebar
            currentUser={currentUser}
            stats={stats}
            miniGameStats={
              currentUser?.role === "ROLE_ADMIN"
                ? undefined
                : { like: miniGameStats.likes, dislike: miniGameStats.dislikes }
            }
            showMinigameButton={false}
          >
            <section
              className="rounded-xl border border-amber-300 bg-cover bg-center p-3 shadow-sm"
              style={{ backgroundImage: "url('/images/ui/backgroud-card-feet.png')" }}
            >
              <div className="space-y-3 rounded-lg bg-[#fffaf0]/55 p-3 backdrop-blur-[1px]">
                <div>
                  <h3 className="text-base font-semibold text-amber-950">Crear nuevo foot</h3>
                  <p className="text-xs text-amber-900">
                    Completa los datos y publícalo en el listado.
                  </p>
                </div>

                <form onSubmit={onCreate} className="space-y-2">
                <input
                  className="w-full rounded border border-amber-300 bg-[#fffdf7]/80 p-2 text-sm"
                  placeholder="Titulo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded border border-amber-300 bg-[#fffdf7]/80 p-2 text-sm"
                  placeholder="Image URL o Data URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  required
                />
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded border border-amber-300 bg-[#fffdf7]/80 px-3 py-2 text-xs hover:bg-amber-100">
                    {uploadingImage ? "Subiendo..." : "Upload imagen"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                  {selectedFileName && (
                    <span className="truncate text-xs text-gray-600">{selectedFileName}</span>
                  )}
                </div>
                <select
                  className="w-full rounded border border-amber-300 bg-[#fffdf7]/80 p-2 text-sm"
                  value={archType}
                  onChange={(e) =>
                    setArchType(e.target.value as ArchType)
                  }
                  required
                >
                  {Object.entries(ARCH_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button className="w-full rounded bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800">
                  Crear
                </button>
                </form>
              </div>
            </section>
            {currentUser?.role !== "ROLE_ADMIN" && (
              <button
                type="button"
                onClick={openMiniGameModal}
                className="inline-flex w-full items-center justify-center rounded border border-amber-700 bg-amber-700 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-amber-800"
              >
                MiniFeetGame
              </button>
            )}
          </RightSidebar>
        </div>
      </div>

      {duplicatePopupMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-amber-200 bg-[#fffaf0] p-5 shadow-xl">
            <h2 className="text-xl font-semibold text-amber-950">Pie duplicado</h2>
            <p className="mt-2 text-sm text-amber-900">{duplicatePopupMessage}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDuplicatePopupMessage("");
                  setDuplicateFootId(null);
                }}
                className="rounded border border-amber-300 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100"
              >
                Cerrar
              </button>
              {duplicateFootId && (
                <button
                  type="button"
                  onClick={async () => {
                    await openFootDetailModal(duplicateFootId);
                    setDuplicatePopupMessage("");
                    setDuplicateFootId(null);
                  }}
                  className="rounded bg-amber-700 px-3 py-2 text-sm text-white hover:bg-amber-800"
                >
                  Ir al pie existente
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showFootDetailModal && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/55 p-3 md:p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-amber-200 bg-[#fffaf0] shadow-2xl md:max-h-[92vh]">
            <div className="flex items-center border-b border-amber-200 bg-[#fff8ea] px-4 py-3">
              <button
                type="button"
                onClick={closeFootDetailModal}
                className="rounded border border-amber-300 bg-[#fffaf0]/80 px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-100"
              >
                ← Volver a Feet
              </button>
            </div>

            <div className="max-h-[calc(92vh-60px)] overflow-y-auto p-4 md:p-5">
              <h2 className="text-2xl font-bold text-amber-950">Detalle del pie</h2>
              <p className="mt-1 text-sm text-amber-900">Consulta y publica reviews sin salir de Feet.</p>

              {detailLoading && <p className="mt-4 text-amber-900">Cargando detalle...</p>}
              {detailError && <p className="mt-4 text-red-600">{detailError}</p>}

              {!detailLoading && detailFoot && (
                <div className="mt-4 space-y-5">
                <section className="overflow-hidden rounded-xl border-4 border-amber-200 bg-[#fffaf0] shadow-[0_18px_20px_rgba(180,80,30,0.30)]">
                  <img
                    src={detailFoot.imageUrl}
                    alt={detailFoot.title}
                    className="mx-auto max-h-[42vh] w-full object-contain bg-white"
                  />
                  <div className="p-4 space-y-1">
                    <h3 className="text-xl font-bold">{detailFoot.title}</h3>
                    <p className="text-amber-900">Arco: {getArchTypeLabel(detailFoot.archType)}</p>
                    <p className="text-amber-900">Owner: {detailFoot.ownerUsername}</p>
                  </div>
                </section>

                <section className="rounded-xl border border-amber-200 bg-[#fffaf0]/50 p-4 shadow-[0_18px_20px_rgba(180,80,30,0.30)]">
                  <h3 className="mb-3 text-lg font-semibold text-amber-950">Pon un comentario</h3>
                  <form onSubmit={onCreateDetailReview} className="space-y-3">
                    <input
                      className="w-full rounded border border-amber-300 bg-[#fffdf7]/80 p-2"
                      type="number"
                      min={1}
                      max={5}
                      value={detailRating}
                      onChange={(e) => setDetailRating(Number(e.target.value))}
                    />
                    <textarea
                      className="w-full rounded border border-amber-300 bg-[#fffdf7]/80 p-2"
                      placeholder="Tu comentario"
                      value={detailComment}
                      onChange={(e) => setDetailComment(e.target.value)}
                      required
                    />
                    <button className="rounded bg-amber-700 px-4 py-2 text-white hover:bg-amber-800">
                      Publicar review
                    </button>
                  </form>
                </section>

                <section className="space-y-3 rounded-xl border border-amber-200 bg-[#fffaf0]/50 p-4 shadow-[0_18px_20px_rgba(180,80,30,0.30)]">
                  <h3 className="text-lg font-semibold text-amber-950">Reviews</h3>
                  {!detailReviews.length && <p className="text-amber-900">No hay reviews todavía.</p>}
                  {detailReviews.map((review) => (
                    <article key={review.id} className="rounded-lg border border-amber-300 bg-[#fffdf7]/80 p-3">
                      <p className="font-semibold text-amber-900">⭐ {review.rateAspect}/5</p>
                      <p>{review.comment}</p>
                      <p className="text-sm text-gray-500">por {review.reviewUsername}</p>
                      {currentUser?.username === review.reviewUsername && (
                        <button
                          type="button"
                          onClick={() => openEditDetailReview(review)}
                          className="mt-2 rounded bg-amber-700 px-3 py-2 text-xs text-white hover:bg-amber-800"
                        >
                          Editar
                        </button>
                      )}
                    </article>
                  ))}
                </section>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {detailFriendlyPopupMessage && (
        <div className="fixed inset-0 z-[72] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-amber-200 bg-[#fffaf0] p-5 shadow-xl">
            <h2 className="text-xl font-semibold text-amber-950">Review ya publicada</h2>
            <p className="mt-2 text-sm text-amber-900">{detailFriendlyPopupMessage}</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailFriendlyPopupMessage("")}
                className="rounded bg-amber-700 px-3 py-2 text-sm text-white hover:bg-amber-800"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {editingDetailReview && (
        <div className="fixed inset-0 z-[72] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-amber-200 bg-[#fffaf0] p-5 shadow-xl">
            <h2 className="text-xl font-semibold text-amber-950">Editar review</h2>
            <p className="mt-1 text-sm text-amber-900">Review #{editingDetailReview.id}</p>
            <form onSubmit={onUpdateDetailReview} className="mt-4 space-y-3">
              <input
                className="w-full rounded border border-amber-300 bg-[#fffdf7]/80 p-2"
                type="number"
                min={1}
                max={5}
                value={editDetailRating}
                onChange={(e) => setEditDetailRating(Number(e.target.value))}
                required
              />
              <textarea
                className="w-full rounded border border-amber-300 bg-[#fffdf7]/80 p-2"
                value={editDetailComment}
                onChange={(e) => setEditDetailComment(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditDetailReview}
                  disabled={savingDetailEdit}
                  className="rounded border border-amber-300 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDetailEdit}
                  className="rounded bg-amber-700 px-3 py-2 text-sm text-white hover:bg-amber-800 disabled:opacity-60"
                >
                  {savingDetailEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDeleteFootId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-amber-200 bg-[#fffaf0] p-5 shadow-xl">
            <h2 className="text-xl font-semibold text-amber-950">Eliminar pie</h2>
            <p className="mt-2 text-sm text-amber-900">
              Vas a eliminar este pie del listado. Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteFootId(null)}
                disabled={deletingFootId === pendingDeleteFootId}
                className="rounded border border-amber-300 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onDeleteFoot}
                disabled={deletingFootId === pendingDeleteFootId}
                className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {deletingFootId === pendingDeleteFootId ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMiniGameModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4">
          <div className="relative w-full max-w-3xl rounded-2xl border border-amber-200 bg-[#fffaf0] p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowMiniGameModal(false)}
              className="absolute right-4 top-4 rounded border border-amber-300 px-2 py-1 text-xs text-amber-900 hover:bg-amber-100"
            >
              Cerrar
            </button>

            <h2 className="text-2xl font-bold text-amber-950">MiniFeetGame</h2>
            <p className="mt-1 text-sm text-amber-900">
              Juega sin salir de la pantalla de Feet.
            </p>
            <p className="mt-1 text-sm text-amber-900">
              Progreso: <span className="font-semibold">{miniGameProgress}</span>
            </p>

            <div className="mt-4">
              <section className="rounded-xl border border-amber-200 bg-[#fffaf0]/60 p-4">
                {miniGameLoading && <p className="text-amber-900">Cargando minijuego...</p>}
                {miniGameError && <p className="text-red-600">{miniGameError}</p>}

                {!miniGameLoading && !miniGameError && miniGameTotal === 0 && (
                  <p className="text-amber-900">No hay imágenes para jugar.</p>
                )}

                {!miniGameLoading && !miniGameError && miniGameCurrentImage && !miniGameFinished && (
                  <>
                    <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
                      <img
                        src={miniGameCurrentImage}
                        alt="Carta del minijuego"
                        className="h-[320px] w-full object-contain"
                      />
                    </div>
                    <div className="mt-5 flex items-end justify-center gap-5">
                      <button
                        type="button"
                        onClick={() => onMiniGameSwipe("dislike")}
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
                        onClick={() => onMiniGameSwipe("like")}
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
                  </>
                )}

                {!miniGameLoading && !miniGameError && miniGameFinished && (
                  <div className="rounded-xl border border-amber-200 bg-[#fffaf0]/70 p-4 text-center">
                    <p className="text-lg font-semibold text-amber-950">Fin del juego</p>
                    <p className="mt-2 text-sm text-amber-900">
                      LIKE: <span className="font-semibold">{miniGameStats.likes}</span> · DISLIKE:{" "}
                      <span className="font-semibold">{miniGameStats.dislikes}</span>
                    </p>
                    <button
                      type="button"
                      onClick={loadMiniGame}
                      className="mt-3 rounded bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800"
                    >
                      Jugar de nuevo
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
