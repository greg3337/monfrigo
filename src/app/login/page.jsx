"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// Firebase
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { app } from "../firebase/firebase-config"; // adapte le chemin si besoin

export default function LoginPage() {
const auth = getAuth(app);

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [rememberEmail, setRememberEmail] = useState(true); // coche par défaut
const [showPwd, setShowPwd] = useState(false);
const [err, setErr] = useState("");

// Pré-remplir l'email si on l'a déjà sauvegardé
useEffect(() => {
const saved = localStorage.getItem("mf_email");
if (saved) setEmail(saved);
}, []);

const onSubmit = async (e) => {
e.preventDefault();
setErr("");

try {
// 1) Persistance de session (reste connecté)
await setPersistence(auth, browserLocalPersistence);

// 2) Connexion
await signInWithEmailAndPassword(auth, email, password);

// 3) Souvenir de l’email (jamais du mot de passe)
if (rememberEmail) localStorage.setItem("mf_email", email);
else localStorage.removeItem("mf_email");

// redirige où tu veux (ex: /fridge)
window.location.href = "/fridge";
} catch (e) {
setErr("Identifiants invalides.");
}
};

return (
<main className="loginWrap">
<form className="loginCard" onSubmit={onSubmit}>
<h1 className="loginTitle">Ravi de vous revoir 👋</h1>

<label className="loginLabel">Email</label>
<input
type="email"
name="email"
placeholder="nom@exemple.com"
className="loginInput"
value={email}
onChange={(e) => setEmail(e.target.value)}
autoComplete="email"
required
/>

<label className="loginLabel">Mot de passe</label>
<div className="pwdRow">
<input
type={showPwd ? "text" : "password"}
name="password"
placeholder="••••••••"
className="loginInput"
value={password}
onChange={(e) => setPassword(e.target.value)}
autoComplete="current-password"
required
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

{/* Se souvenir de moi (email) */}
<label className="rememberRow">
<input
type="checkbox"
checked={rememberEmail}
onChange={(e) => setRememberEmail(e.target.checked)}
/>
<span>Se souvenir de mon email</span>
</label>

{err && <p className="loginError">{err}</p>}

<button type="submit" className="loginBtn">Se connecter</button>

<p className="loginAlt">
Pas encore de compte ? <Link href="/signup">Créer un compte</Link>
</p>
</form>
</main>
);
}
