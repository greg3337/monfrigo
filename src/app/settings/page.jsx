"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, db } from "../firebase-config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, sendPasswordResetEmail, signOut } from "firebase/auth";
import "./settings.css";

export default function SettingsPage() {
// ----- state -----
const [user, setUser] = useState(null);
const [name, setName] = useState("");
const [msg, setMsg] = useState("");
const pathname = usePathname();

// ----- auth + chargement profil -----
useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
setUser(u || null);
setMsg("");
if (!u) return;

try {
const userRef = doc(db, "users", u.uid);
const snap = await getDoc(userRef);
const currentName =
(snap.exists() && snap.data()?.name) ||
(typeof u.displayName === "string" ? u.displayName : "");
setName(currentName || "");
} catch (e) {
console.warn("Chargement profil erreur:", e);
}
});
return () => unsub();
}, []);

// ----- actions -----
const handleSave = async (e) => {
e.preventDefault();
if (!user) return;
try {
await setDoc(
doc(db, "users", user.uid),
{ name: name.trim() },
{ merge: true }
);
setMsg("Profil enregistré ✅");
setTimeout(() => setMsg(""), 2500);
} catch (e) {
console.warn("Enregistrement profil erreur:", e);
setMsg("Erreur d’enregistrement.");
}
};

const handlePassword = async () => {
if (!user?.email) return;
try {
await sendPasswordResetEmail(auth, user.email);
setMsg("Email de réinitialisation envoyé 📧");
setTimeout(() => setMsg(""), 2500);
} catch (e) {
console.warn("Reset password erreur:", e);
setMsg("Impossible d’envoyer l’email.");
}
};

const handleLogout = async () => {
try {
await signOut(auth);
// Next redirigera via ta logique globale d’auth
} catch (e) {
console.warn("Logout erreur:", e);
}
};

return (
<>
{/* Contenu principal */}
<div className="settings-wrap">
<h1 className="pageTitle">Paramètres</h1>
<p className="pageSub">Personnalisez votre expérience</p>

<form className="card" onSubmit={handleSave}>
<div className="row">
<label>Profil</label>
<input
type="email"
value={user?.email || ""}
disabled
className="input"
/>
</div>

<div className="row">
<input
type="text"
value={name}
onChange={(e) => setName(e.target.value)}
placeholder="Ex. Grégoire"
className="input"
/>
<button type="button" className="btn ghost" onClick={handlePassword}>
Modifier 
</button>
</div>

<div className="actions">
<button type="submit" className="btn primary">
Enregistrer
</button>
</div>

{msg ? <div className="hint">{msg}</div> : null}
</form>

<div className="card support-card">
<div className="support-title">Support</div>
<div className="links">
<a href="/settings/faq">Aide et FAQ</a>
<a href="/settings/privacy">Confidentialité</a>
<a href="mailto:contact@monfrigo.app">Nous contacter</a>
</div>
</div>

<div className="card">
<button type="button" className="btn danger full" onClick={handleLogout}>
Se déconnecter
</button>
</div>
</div>

{/* --- TABBAR en bas --- */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link
href="/fridge"
className={`tab ${pathname?.startsWith("/fridge") ? "is-active" : ""}`}
>
<span className="tab__icon">🧊</span>
<span className="tab__label">Frigo</span>
</Link>

<Link
href="/settings"
className={`tab ${pathname?.startsWith("/settings") ? "is-active" : ""}`}
>
<span className="tab__icon">⚙️</span>
<span className="tab__label">Paramètres</span>
</Link>
</nav>
</>
);
}
