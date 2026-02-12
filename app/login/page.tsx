"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginApi } from "@/lib/api";
import { saveToken } from "@/lib/auth";

function toFriendlyLoginError(message: string) {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("invalid credentials")
    || normalized.includes("bad credentials")
    || normalized.includes("credenciales")
  ) {
    return "Usuario o contraseña incorrectos. Comprueba tus datos o regístrate si aún no tienes cuenta.";
  }
  return message;
}

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setShowError(false);

    try {
      const res = await loginApi(username.trim(), password);

      if (!res?.token) {
        throw new Error("Respuesta de login inválida (sin token)");
      }

      // 1) Guardado en localStorage
      saveToken(res.token);

      // Navegación robusta
      router.replace("/feet");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo iniciar sesión";
      setError(toFriendlyLoginError(message));
      setShowError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden flex items-start justify-center bg-cover bg-center bg-no-repeat px-4 pt-44 pb-44 md:pt-52 md:pb-52"
      style={{ backgroundImage: "url('/images/ui/backgroud-login2.png')" }}
    >
      <section
        className="w-full max-w-md rounded-xl border border-amber-200 bg-cover bg-center p-6 shadow-sm"
        style={{ backgroundImage: "url('/images/ui/backgroud-card-feet.png')" }}
      >
        <div className="space-y-5 rounded-lg bg-[#fffaf0]/35 p-4 backdrop-blur-[1px]">
          <h1 className="text-2xl font-bold text-center">Iniciar sesión</h1>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-amber-700 px-4 py-2 text-white hover:bg-amber-800 disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {showError && (
            <div className="rounded-lg border border-red-200 bg-red-50/70 p-3 text-sm text-red-700 backdrop-blur-[1px]">
              <p className="font-semibold">No pudimos iniciar sesión</p>
              <p>{error}</p>
            </div>
          )}

          <p className="text-sm text-center">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-blue-600 underline">
              Regístrate
            </Link>
          </p>
        </div>
      </section>

      <div className="pointer-events-none absolute bottom-10 md:-bottom-[230px] left-1/2 -translate-x-1/2">
        <Image
          src="/images/ui/logo-feet.png"
          alt="Logo Feet"
          width={460}
          height={210}
          className="h-auto w-[190px] md:w-[460px]"
          priority
        />
      </div>

      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-[#fffaf0]/55 px-3 py-1 text-center text-[11px] text-amber-900 backdrop-blur-[1px]">
        © 2026 SoleMate · Proyecto académico de ItAcademy · Solo para fines educativos.
      </p>
    </main>
  );
}
