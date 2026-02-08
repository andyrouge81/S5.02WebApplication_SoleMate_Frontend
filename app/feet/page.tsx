"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiHttpError,
  createFootApi,
  deleteFootApi,
  deleteReviewApi,
  getCurrentUserApi,
  getFeetApi,
  getReviewsByFootApi,
} from "@/lib/api";
import type { CurrentUser, Foot, Review } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import RightSidebar from "@/components/RightSidebar";

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
  const [deletingFootId, setDeletingFootId] = useState<number | null>(null);

  const [nickname, setNickname] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [archType, setArchType] = useState<"PES_PLANUS" | "PES_RECTUS" | "PES_CAVUS">("PES_RECTUS");

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

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createFootApi({ nickname, imageUrl, archType });
      setNickname("");
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
      setError(err instanceof Error ? err.message : "Error creando foot");
    }
  };

  const canDeleteFoot = (foot: Foot) => {
    if (!currentUser) return false;
    if (currentUser.role === "ROLE_ADMIN") return true;
    return currentUser.username === foot.ownerUsername;
  };

  const onDeleteFoot = async (footId: number) => {
    if (!window.confirm("¿Seguro que quieres eliminar este foot?")) return;

    setError("");
    setDeletingFootId(footId);
    try {
      await deleteFootApi(footId);
      await loadData();
    } catch (err) {
      if (currentUser?.role === "ROLE_ADMIN") {
        try {
          const reviews = await getReviewsByFootApi(footId);
          await Promise.all(reviews.map((review) => deleteReviewApi(review.id)));
          await deleteFootApi(footId);
          await loadData();
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

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/images/ui/backgroud-login2.png')" }}
    >
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-stretch lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="order-2 h-full border-b border-amber-200 bg-[#f8edd3] p-4 lg:order-1 lg:border-b-0 lg:border-r">
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

        <main className="order-1 space-y-3 px-6 pb-6 pt-0 lg:order-2">
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

          <section className="-mt-40 md:-mt-52 rounded-xl border border-amber-200 bg-[#fffaf0]/35 p-6 backdrop-blur-[1px] shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Listado</h2>
            {loading && <p>Cargando...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && !feet.length && <p>No hay feet todavía.</p>}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {feet.map((f) => (
                <article
                   key={f.id}
                   className="overflow-hidden rounded-xl border border-amber-300 bg-[#fffaf0]/70 backdrop-blur-[1px] shadow-[0_14px_22px_rgba(140,90,20,0.30)]"
                 >
                     <img src={f.imageUrl} alt={f.nickname} className="w-full h-44 object-cover" />
                     <div className="p-3 space-y-2">
                        <h3 className="font-semibold">{f.nickname}</h3>
                        <p className="text-sm text-amber-900">Arco: {f.archType}</p>
                        <p className="text-sm text-amber-900">Owner: {f.ownerUsername}</p>

                        <Link
                            href={`/feet/${f.id}`}
                            className="inline-block rounded bg-amber-700 px-3 py-2 text-sm text-white hover:bg-amber-800"
                        >
                            Ver detalle
                        </Link>
                        {canDeleteFoot(f) && (
                          <button
                            type="button"
                            onClick={() => onDeleteFoot(f.id)}
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
        <div className="order-3 h-full w-full lg:w-[320px]">
          <RightSidebar currentUser={currentUser} stats={stats}>
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
                  placeholder="Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
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
                    setArchType(
                      e.target.value as "PES_PLANUS" | "PES_RECTUS" | "PES_CAVUS"
                    )
                  }
                  required
                >
                  <option value="PES_PLANUS">PES_PLANUS</option>
                  <option value="PES_RECTUS">PES_RECTUS</option>
                  <option value="PES_CAVUS">PES_CAVUS</option>
                </select>
                <button className="w-full rounded bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800">
                  Crear
                </button>
                </form>
              </div>
            </section>
          </RightSidebar>
        </div>
      </div>
    </div>
  );
}
