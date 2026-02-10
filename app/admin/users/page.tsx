"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RightSidebar from "@/components/RightSidebar";
import {
  deleteAdminUserApi,
  deleteReviewApi,
  getAdminUsersApi,
  getCurrentUserApi,
  getFeetApi,
  getReviewsByFootApi,
  updateAdminUserApi,
} from "@/lib/api";
import type { AdminUser, CurrentUser, Review } from "@/lib/types";

export default function AdminUsersPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [latestReviews, setLatestReviews] = useState<Array<Review & { footId: number }>>([]);

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"ROLE_USER" | "ROLE_ADMIN">("ROLE_USER");

  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadUsers = useCallback(
    async (pageArg = page, searchArg = search) => {
      const data = await getAdminUsersApi({ page: pageArg, size, search: searchArg });
      setUsers(data.content);
      setTotalPages(Math.max(1, data.totalPages || 1));
      return data;
    },
    [page, search, size]
  );

  const loadLatestReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const feet = await getFeetApi();
      if (!feet.length) {
        setLatestReviews([]);
        return;
      }

      const reviewsByFoot = await Promise.all(
        feet.map(async (foot) => {
          const reviews = await getReviewsByFootApi(foot.id);
          return reviews.map((review) => ({ ...review, footId: foot.id }));
        })
      );

      const ordered = reviewsByFoot
        .flat()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 12);

      setLatestReviews(ordered);
    } catch {
      setLatestReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError("");
      try {
        const me = await getCurrentUserApi();
        setCurrentUser(me);

        if (me.role !== "ROLE_ADMIN") {
          router.replace("/feet");
          return;
        }

        await Promise.all([loadUsers(page, search), loadLatestReviews()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando panel admin");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [loadLatestReviews, loadUsers, page, router, search]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const next = searchInput.trim();
    setPage(0);
    setSearch(next);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const closeEditModal = () => {
    if (savingUserId) return;
    setEditingUser(null);
    setEditEmail("");
    setEditRole("ROLE_USER");
  };

  const onSaveUser = async () => {
    if (!editingUser) return;

    setError("");
    setSavingUserId(editingUser.id);

    try {
      const updated = await updateAdminUserApi(editingUser.id, {
        email: editEmail.trim(),
        role: editRole,
      });

      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el usuario");
    } finally {
      setSavingUserId(null);
    }
  };

  const onDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`¿Eliminar al usuario ${user.username}?`)) return;

    setError("");
    setDeletingUserId(user.id);
    try {
      await deleteAdminUserApi(user.id);

      const data = await loadUsers(page, search);
      if (!data.content.length && page > 0) {
        setPage((p) => p - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el usuario");
    } finally {
      setDeletingUserId(null);
    }
  };

  const onDeleteReview = async (reviewId: number) => {
    if (!window.confirm("¿Eliminar esta review?")) return;

    setError("");
    setDeletingReviewId(reviewId);
    try {
      await deleteReviewApi(reviewId);
      await loadLatestReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la review");
    } finally {
      setDeletingReviewId(null);
    }
  };

  const pageLabel = useMemo(() => `Página ${page + 1} de ${totalPages}`, [page, totalPages]);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/images/ui/backgroud-login2.png')" }}
      >
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-stretch lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="hidden lg:block" />
          <main className="order-1 p-6 lg:order-2">Cargando panel admin...</main>
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
        <aside className="order-2 h-full border-b border-amber-200 bg-[#f8edd3] p-4 lg:order-1 lg:border-b-0 lg:border-r">
          <h3 className="text-lg font-semibold text-amber-950">Ultimas reviews</h3>
          <div className="mt-4 space-y-3">
            {loadingReviews && <p className="text-sm text-amber-900">Actualizando...</p>}
            {!loadingReviews && latestReviews.length === 0 && (
              <p className="text-sm text-amber-900">Todavia no hay reviews.</p>
            )}
            {latestReviews.map((review) => (
              <article key={review.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <p className="font-semibold text-amber-900">{review.reviewUsername} dice:</p>
                <p className="mt-1 text-amber-950">{review.comment}</p>
                <button
                  type="button"
                  onClick={() => onDeleteReview(review.id)}
                  disabled={deletingReviewId === review.id}
                  className="mt-2 rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  {deletingReviewId === review.id ? "Eliminando..." : "Eliminar review"}
                </button>
              </article>
            ))}
          </div>
        </aside>

        <main className="order-1 px-6 pb-6 pt-8 lg:order-2">
          <div className="mb-3">
            <Link
              href="/feet"
              className="inline-flex items-center justify-center rounded border border-amber-300 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100"
            >
              ← Volver a Feet
            </Link>
          </div>
          <section className="rounded-xl border border-amber-200 bg-[#fffaf0]/50 p-5 shadow-sm backdrop-blur-[1px]">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-amber-950">Panel de Usuarios</h1>
                <p className="text-sm text-amber-900">Editar rol/email y eliminar usuarios.</p>
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
                <form onSubmit={onSearch} className="flex w-full gap-2 md:w-auto">
                  <input
                    className="w-full rounded border border-amber-300 bg-[#fffdf7]/90 px-3 py-2 text-sm md:w-64"
                    placeholder="Buscar por username o email"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <button className="rounded bg-amber-700 px-3 py-2 text-sm text-white hover:bg-amber-800">
                    Buscar
                  </button>
                </form>
                <Link
                  href="/feet"
                  className="inline-flex items-center justify-center rounded border border-amber-300 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100"
                >
                  Volver a Feet
                </Link>
              </div>
            </div>

            {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

            <div className="space-y-3">
              {users.map((user) => {
                const isSelf = currentUser?.id === user.id;
                const deleting = deletingUserId === user.id;

                return (
                  <article
                    key={user.id}
                    className="rounded-lg border border-amber-300 bg-[#fffdf7]/85 p-3"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-amber-950">
                        <span className="font-semibold">{user.username}</span> · {user.email}
                      </p>
                      <p className="text-xs text-amber-900">ID {user.id}</p>
                    </div>

                    <div className="grid gap-2 md:grid-cols-[1fr_180px_auto_auto] md:items-center">
                      <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        Rol: <span className="font-semibold">{user.role}</span>
                      </p>
                      <p className="text-xs text-amber-900 md:text-right">
                        Creado: {new Date(user.createdAt).toLocaleString()}
                      </p>
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        disabled={deleting}
                        className="rounded bg-amber-700 px-3 py-2 text-sm text-white hover:bg-amber-800 disabled:opacity-60"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUser(user)}
                        disabled={deleting || isSelf}
                        className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deleting ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                    {isSelf && (
                      <p className="mt-2 text-xs text-amber-900">
                        Tu propio usuario no se puede eliminar desde este panel.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>

            {!users.length && <p className="mt-4 text-sm text-amber-900">No hay usuarios para mostrar.</p>}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-amber-900">{pageLabel}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded border border-amber-300 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                  disabled={page + 1 >= totalPages}
                  className="rounded border border-amber-300 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>
        </main>

        <div className="order-3 h-full w-full lg:w-[320px]">
          <RightSidebar currentUser={currentUser} />
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-amber-200 bg-[#fffaf0] p-5 shadow-xl">
            <h2 className="text-xl font-semibold text-amber-950">Editar usuario</h2>
            <p className="mt-1 text-sm text-amber-900">
              <span className="font-semibold">{editingUser.username}</span> · ID {editingUser.id}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-amber-950">Email</label>
                <input
                  className="w-full rounded border border-amber-300 bg-white px-3 py-2 text-sm"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-amber-950">Rol</label>
                <select
                  className="w-full rounded border border-amber-300 bg-white px-3 py-2 text-sm"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as "ROLE_USER" | "ROLE_ADMIN")}
                >
                  <option value="ROLE_USER">ROLE_USER</option>
                  <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingUserId === editingUser.id}
                className="rounded border border-amber-300 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSaveUser}
                disabled={savingUserId === editingUser.id}
                className="rounded bg-amber-700 px-3 py-2 text-sm text-white hover:bg-amber-800 disabled:opacity-60"
              >
                {savingUserId === editingUser.id ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
