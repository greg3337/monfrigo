"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase-config";
import "./settings.css";

export default function SettingsPage() {
const [user, setUser] = useState(null);
const [displayName, setDisplayName] = useState("");
const [saving, setSaving] = useState(false);
const [info, setInfo] = useState("");

// Charge l'utilisateur + son profil (Firestore si dispo)
useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
setUser(u || null);
setInfo("");

if (!u) return;

// nom depuis Auth par défaut
let name = typeof u.displayName === "string" ? u.displayName : "";

// si tu stockes aussi le profil dans Firestore: users/{uid}
try {
const ref = doc(db, "users", u.uid);
const snap = await getDoc(ref);
if (snap.exists() && typeof snap.data()?.name === "string") {
name = snap.data().name;
}
} catch (e) {
console.warn("Lecture profil Firestore:", e);
}

setDisplayName(name || "");
});

return () => unsub();
}, []);

// Enregistre le nom d’affichage (Auth + Firestore)
const saveProfile = async (e) => {
e.preventDefault();
if (!user) return;

setSaving(true);
setInfo("");

try {
// 1) Auth
await updateProfile(user, { displayName: displayName || "" });

// 2) Firestore (merge)
await setDoc(
doc(db, "users", user.uid),
{ name: displayName || "" },
{ merge: true }
);

setInfo("Profil mis à jour ✅");
} catch (e) {
console.error(e);
setInfo("Erreur lors de l’enregistrement du profil.");
} finally {
setSaving(false);
}
};

// Lien reset mot de passe (envoie un email)
const resetPassword = async () => {
if (!user?.email) return;
try {
await sendPasswordResetEmail(auth, user.email);
setInfo("Email de réinitialisation envoyé 📧");
} catch (e) {
console.error(e);
setInfo("Impossible d’envoyer l’email de réinitialisation.");
}
};

if (!user) {
return (
<div className="wrap">
<h1>Paramètres</h1>
<p>Veuillez vous connecter pour gérer votre profil.</p>
<Link href="/login" className="primary">Se connecter</Link>
</div>
);
}

return (
<div className="wrap">
<h1>Paramètres</h1>
<p>Personnalisez votre expérience</p>

{/* Carte Profil */}
<section className="card">
<div className="cardHeader">
<h2>Profil</h2>
</div>

<form onSubmit={saveProfile} className="form">
<label className="label">Adresse e-mail</label>
<input className="input" type="email" value={user.email || ""} disabled />

<label className="label">Nom d’affichage</label>
<input
className="input"
type="text"
placeholder="Ex. Grégoire"
value={displayName}
onChange={(e) => setDisplayName(e.target.value)}
/>

<div className="row">
<button type="submit" className="primary" disabled={saving}>
{saving ? "Enregistrement..." : "Enregistrer"}
</button>

<button type="button" className="secondary" onClick={resetPassword}>
Modifier le mot de passe
</button>
</div>

{info && <p className="hint" style={{ marginTop: 8 }}>{info}</p>}
</form>
</section>

{/* Support */}
<section className="card">
<div className="cardHeader">
<h2>Support</h2>
</div>
<ul className="list">
<li><Link href="/faq">Aide et FAQ</Link></li>
<li><Link href="/privacy">Confidentialité</Link></li>
<li><a href="mailto:contact@monfrigo.app">Nous contacter</a></li>
</ul>
</section>

{/* Danger zone – si tu as déjà ces actions ailleurs, garde-les là */}
<section className="card">
<div className="cardHeader">
<h2>Compte</h2>
</div>
<div className="row">
<Link href="/logout" className="secondary">Se déconnecter</Link>
{/* si tu as déjà ton bouton supprimer compte, garde-le ici */}
</div>
</section>
</div>
);
}
