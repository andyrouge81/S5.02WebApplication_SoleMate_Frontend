"use client";

import Link from "next/link";
import Image from "next/image";
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
      await registerApi(username.trim(), email.trim(), password);
      setOk("Registro correcto. Ahora inicia sesión.");
      setTimeout(() => router.push("/login"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en registro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative min-h-screen flex items-start justify-center bg-cover bg-center px-4 pt-44 pb-36 md:pt-52 md:pb-44"
      style={{ backgroundImage: "url('/images/ui/backgroud-login2.png')" }}
    >
      <section
        className="w-full max-w-md rounded-xl border border-amber-200 bg-cover bg-center p-6 shadow-sm"
        style={{ backgroundImage: "url('/images/ui/backgroud-card-feet.png')" }}
      >
        <div className="space-y-5 rounded-lg bg-[#fffaf0]/35 p-4 backdrop-blur-[1px]">
          <h1 className="text-2xl font-bold text-center">Crear cuenta</h1>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={50}
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
              minLength={6}
              maxLength={10}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-amber-700 px-4 py-2 text-white hover:bg-amber-800 disabled:opacity-60"
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
        </div>
      </section>

      <div className="pointer-events-none absolute -bottom-44 left-1/2 -translate-x-1/2">
        <Image
          src="/images/ui/logo-feet.png"
          alt="Logo Feet"
          width={460}
          height={210}
          className="h-auto w-[190px] md:w-[460px]"
          priority
        />
      </div>
    </main>
  );
}
