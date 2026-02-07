"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginApi } from "@/lib/api";
import { saveToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowError(false);

    try {
      const res = await loginApi(username, password);

      if (!res?.token) {
        throw new Error("Respuesta de login inválida (sin token)");
      }

      saveToken(res.token);

      // Redirección principal
      router.push("/feet");

      // Fallback por si el router no navega por estado extraño
      setTimeout(() => {
        window.location.href = "/feet";
      }, 150);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo iniciar sesión";
      setError(message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <section className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-5">
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
            className="w-full bg-black text-white rounded px-4 py-2 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {showError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-semibold">No pudimos iniciar sesión</p>
            <p>{error}</p>
            <p className="mt-1 text-xs">Revisa usuario/contraseña o regístrate.</p>
          </div>
        )}

        <p className="text-sm text-center">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-blue-600 underline">
            Regístrate
          </Link>
        </p>
      </section>
    </main>
  );
}
