"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Chemin correct vers ta config Firebase
import { auth, db } from "../firebase/firebase-config";

import {
signOut,
sendPasswordResetEmail,
onAuthStateChanged,
updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import "./settings.css";

export default function SettingsPage() {
const pathname = usePathname();

const [user, setUser] = useState(null);
const [name, setName] = useState("");
const [saving, setSaving] = useState(false);
const [msg, setMsg] = useState("");

useEffect(() => {
const unsub = onAuthStateChanged(auth, (u) => {
setUser(u || null);
setName(u?.displayName || "");
});
return () => unsub();
}, []);

async function handleSave(e) {
e.preventDefault();
if (!user) return;
setSaving(true);
setMsg("");

try {
await updateProfile(user, { displayName: name });
await setDoc(doc(db, "users", user.uid), { name }, { merge: true });
setMsg("✅ Profil enregistré.");
} catch (err) {
console.warn(err);
setMsg("❌ Impossible d’enregistrer.");
} finally {
setSaving(false);
setTimeout(() => setMsg(""), 2500);
}
}

async function handleResetPassword() {
if (!user?.email) return;
try {
await sendPasswordResetEmail(auth, user.email);
setMsg("📧 Email de réinitialisation envoyé.");
} catch (err) {
console.warn(err);
setMsg("❌ Impossible d’envoyer l’email.");
} finally {
setTimeout(() => setMsg(""), 2500);
}
}

async function handleLogout() {
try {
await signOut(auth);
window.location.href = "/login";
} catch (err) {
console.warn(err);
}
}

return (
<div className="settings-page">
<h1>Paramètres</h1>
<p className="subtitle">Personnalisez votre expérience</p>

<form className="card" onSubmit={handleSave}>
<div className="row">
<label>Profil</label>
<input type="email" value={user?.email || ""} disabled />
</div>

<div className="row">
<input
type="text"
placeholder="Ex. Grégoire"
value={name}
onChange={(e) => setName(e.target.value)}
/>
<button type="button" className="outline" onClick={handleResetPassword}>
Modifier le mot de passe
</button>
</div>

<div className="actions">
<button className="primary" type="submit" disabled={saving}>
{saving ? "Enregistrement..." : "Enregistrer"}
</button>
</div>

{msg ? <div className="flash">{msg}</div> : null}
</form>

<div className="card support-card">
<h3>Support</h3>
<div className="links">
<Link href="/settings/faq">Aide et FAQ</Link>
<Link href="/settings/privacy">Confidentialité</Link>
<a href="mailto:contact@monfrigo.app">Nous contacter</a>
</div>
</div>

<div className="card logout-card">
<button type="button" className="danger" onClick={handleLogout}>
Se déconnecter
</button>
</div>

{/* --- Onglets en bas --- */}
<nav className="tabbar" role="navigation" aria-label="navigation principale">
<Link
href="/fridge"
className={`tab ${pathname.includes("/fridge") ? "is-active" : ""}`}
>
<span className="tab__icon" />
<span className="tab__label">Frigo</span>
</Link>
<Link
href="/settings"
className={`tab ${pathname.includes("/settings") ? "is-active" : ""}`}
>
<span className="tab__icon" />
<span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}
