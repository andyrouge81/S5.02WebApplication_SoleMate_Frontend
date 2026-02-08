"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();

  const onLogout = () => {
    clearToken();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/feet" className="text-lg font-semibold">
          SoleMate
        </Link>

        <button
          type="button"
          onClick={onLogout}
          className="rounded border px-3 py-2 text-sm hover:bg-gray-100"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
