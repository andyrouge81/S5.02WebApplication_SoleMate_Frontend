"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { registerApi } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    setLoading(true);

    try {
      await registerApi(username, email, password);
      setOk("Registro correcto. Ahora inicia sesión.");
      setTimeout(() => router.push("/login"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en registro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <section className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-5">
        <h1 className="text-2xl font-bold text-center">Crear cuenta</h1>

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
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Registrando..." : "Registrar"}
          </button>
        </form>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {ok && <p className="text-green-600 text-sm">{ok}</p>}

        <p className="text-sm text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-blue-600 underline">
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  );
}
