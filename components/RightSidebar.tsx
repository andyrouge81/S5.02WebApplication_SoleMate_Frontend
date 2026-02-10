"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import type { CurrentUser } from "@/lib/types";
import type { ReactNode } from "react";

type SidebarStats = {
  totalFeet: number;
  totalReviews: number;
  myFeet: number;
  myReviews: number;
  myAverageRating: number;
};

type RightSidebarProps = {
  currentUser: CurrentUser | null;
  stats?: SidebarStats;
  children?: ReactNode;
};

export default function RightSidebar({ currentUser, stats, children }: RightSidebarProps) {
  const router = useRouter();

  const onLogout = () => {
    clearToken();
    router.replace("/login");
    router.refresh();
  };

  return (
    <aside className="h-full border-l border-amber-200 bg-[#f5e7c9] px-5 py-6">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-amber-950">
            SoleMate <span className="text-sm font-semibold text-amber-700">(Beta)</span>
          </h2>

          <button
            type="button"
            onClick={onLogout}
            className="rounded border border-amber-500 bg-amber-100 px-2.5 py-1 text-xs text-amber-900 hover:bg-amber-200"
          >
            Cerrar sesión
          </button>
        </div>

        {currentUser && (
          <div
            className={`rounded-lg border px-3 py-3 text-sm ${
              currentUser.role === "ROLE_ADMIN"
                ? "border-amber-400 bg-amber-100 text-amber-950"
                : "border-blue-300 bg-blue-50 text-blue-900"
            }`}
          >
            {currentUser.role === "ROLE_ADMIN" ? (
              <p>
                Has iniciado sesión como <span className="font-semibold">Administrador</span>.
              </p>
            ) : (
              <p>
                Has iniciado sesión como <span className="font-semibold">Usuario</span>:{" "}
                <span className="font-semibold">{currentUser.username}</span>.
              </p>
            )}
          </div>
        )}

        {currentUser?.role === "ROLE_ADMIN" && (
          <Link
            href="/admin/users"
            className="inline-flex w-full items-center justify-center rounded border border-amber-700 bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            Panel Admin
          </Link>
        )}

        {stats && (
          <section className="rounded-lg border border-amber-300 bg-[#fff8e8] p-3 text-sm text-amber-950">
            <h3 className="mb-2 text-sm font-semibold">Estadisticas</h3>
            <div className="space-y-1">
              {currentUser?.role === "ROLE_ADMIN" && (
                <>
                  <p>Total pies: <span className="font-semibold">{stats.totalFeet}</span></p>
                  <p>Total reviews: <span className="font-semibold">{stats.totalReviews}</span></p>
                </>
              )}
              <p>Tus pies: <span className="font-semibold">{stats.myFeet}</span></p>
              <p>Tus reviews: <span className="font-semibold">{stats.myReviews}</span></p>
              <p>Tu media: <span className="font-semibold">{stats.myAverageRating.toFixed(1)}</span></p>
            </div>
          </section>
        )}

        {children}
      </div>
    </aside>
  );
}
