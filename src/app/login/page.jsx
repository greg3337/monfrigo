"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase/firebase-config";
import {signInWithEmailAndPassword,setPersistence,browserLocalPersistence,} from "firebase/auth";

import "./login.css";

export default function LoginPage() {
const router = useRouter();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPw, setShowPw] = useState(false);
const [rememberEmail, setRememberEmail] = useState(true);
const [err, setErr] = useState("");

// Prefill email si mémorisé
useEffect(() => {
const saved = localStorage.getItem("mf_login_email");
if (saved) {
setEmail(saved);
setRememberEmail(true);
}
}, []);

const onSubmit = async (e) => {
e.preventDefault();
setErr("");

try {
// Persistance de session de l’auth (reste connecté) + mémoire e-mail
await setPersistence(auth, browserLocalPersistence);

if (rememberEmail) {
localStorage.setItem("mf_login_email", email);
} else {
localStorage.removeItem("mf_login_email");
}

await signInWithEmailAndPassword(auth, email, password);
router.push("/fridge");
} catch (error) {
setErr("Identifiants invalides ou compte introuvable.");
console.error(error);
}
};

return (
<div className="loginWrap">
<div className="loginCard">
<h1 className="loginTitle">Ravi de vous revoir 👋</h1>

<form onSubmit={onSubmit} className="loginForm">
<label className="fieldLabel">Email</label>
<input
type="email"
inputMode="email"
autoComplete="username"
placeholder="nom@exemple.com"
className="textInput"
value={email}
onChange={(e) => setEmail(e.target.value)}
required
/>

<label className="fieldLabel">Mot de passe</label>
<div className="pwRow">
<input
type={showPw ? "text" : "password"}
autoComplete="current-password"
placeholder="••••••••"
className="textInput"
value={password}
onChange={(e) => setPassword(e.target.value)}
required
/>
<button
type="button"
className="pwToggle"
onClick={() => setShowPw((s) => !s)}
aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
>
{showPw ? "Masquer" : "Afficher"}
</button>
</div>

<label className="rememberRow">
<input
type="checkbox"
checked={rememberEmail}
onChange={(e) => setRememberEmail(e.target.checked)}
/>
<span>Se souvenir de mon email</span>
</label>

{err && <p className="error">{err}</p>}

<button type="submit" className="primaryBtn">Se connecter</button>

<p className="bottomNote">
Pas encore de compte ?{" "}
<a className="link" href="/signup">Créer un compte</a>
</p>
</form>
</div>
</div>
);
}
