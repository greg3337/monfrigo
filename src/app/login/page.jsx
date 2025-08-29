"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import "./login.css";

export default function LoginPage() {
const router = useRouter();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPwd, setShowPwd] = useState(false);
const [loading, setLoading] = useState(false);
const [err, setErr] = useState("");

async function handleLogin(e) {
e.preventDefault();
setErr("");
setLoading(true);
try {
const auth = getAuth();
await signInWithEmailAndPassword(auth, email, password);
router.push("/fridge");
} catch {
setErr("Adresse e-mail ou mot de passe incorrect.");
} finally {
setLoading(false);
}
}

return (
<main className="loginWrap">
<section className="card">
<h1 className="title">Connexion</h1>
<p className="subtitle">Ravi de vous revoir 👋</p>

{err && <div className="alert">{err}</div>}

<form onSubmit={handleLogin} className="form">
<label className="label">Email</label>
<input
className="input"
type="email"
placeholder="nom@exemple.com"
value={email}
onChange={(e) => setEmail(e.target.value)}
required
autoComplete="email"
/>

<label className="label">Mot de passe</label>
<div className="pwdRow">
<input
className="input"
type={showPwd ? "text" : "password"}
placeholder="••••••••"
value={password}
onChange={(e) => setPassword(e.target.value)}
required
autoComplete="current-password"
/>
<button
type="button"
className="pwdToggle"
onClick={() => setShowPwd((s) => !s)}
aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
>
{showPwd ? "Masquer" : "Afficher"}
</button>
</div>

<button className="btn" type="submit" disabled={loading}>
{loading ? "Connexion..." : "Se connecter"}
</button>
</form>

<p className="hint">
Pas encore de compte ?{" "}
<Link className="link" href="/signup">
Créer un compte
</Link>
</p>
</section>
</main>
);
}
