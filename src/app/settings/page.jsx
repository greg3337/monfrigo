"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "../firebase/firebase-config";
import {
onAuthStateChanged,
updateProfile,
sendPasswordResetEmail,
signOut,
deleteUser,
} from "firebase/auth";
import {
doc,
getDoc,
setDoc,
collection,
getDocs,
deleteDoc,
} from "firebase/firestore";
import "./settings.css";

export default function SettingsPage() {
const pathname = usePathname();
const router = useRouter();

const [user, setUser] = useState(null);
const [email, setEmail] = useState("");
const [name, setName] = useState("");
const [saving, setSaving] = useState(false);
const [msg, setMsg] = useState("");

// Charger l’utilisateur
useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
setUser(u || null);
setMsg("");
if (!u) return;
setEmail(u.email || "");
try {
const snap = await getDoc(doc(db, "users", u.uid));
const nameFromDoc = snap.exists() ? snap.data()?.name : "";
setName(
(nameFromDoc && String(nameFromDoc)) || u.displayName || ""
);
} catch {
setName(u.displayName || "");
}
});
return () => unsub();
}, []);

// Enregistrer le nom
async function handleSave(e) {
e.preventDefault();
if (!user) return;
setSaving(true);
setMsg("");
try {
if ((user.displayName || "") !== name) {
await updateProfile(user, { displayName: name || "" });
}
await setDoc(
doc(db, "users", user.uid),
{ name: name || "" },
{ merge: true }
);
setMsg("✅ Profil enregistré.");
} catch (err) {
console.warn("Enregistrement profil:", err);
setMsg("❌ Impossible d’enregistrer.");
} finally {
setSaving(false);
setTimeout(() => setMsg(""), 3000);
}
}

// Réinitialisation mot de passe
async function handleResetPassword() {
if (!email) return;
try {
await sendPasswordResetEmail(auth, email);
setMsg("📧 Email de réinitialisation envoyé.");
} catch (err) {
console.warn("Reset password:", err);
setMsg("❌ Envoi impossible. Réessaie plus tard.");
} finally {
setTimeout(() => setMsg(""), 3000);
}
}

// Déconnexion
async function handleLogout() {
try {
await signOut(auth);
router.replace("/login");
} catch (e) {
console.warn("Logout:", e);
}
}

// Supprimer produits
async function deleteAllProducts(uid) {
const productsRef = collection(db, "users", uid, "products");
const snap = await getDocs(productsRef);
const jobs = [];
snap.forEach((d) =>
jobs.push(deleteDoc(doc(db, "users", uid, "products", d.id)))
);
await Promise.all(jobs);
}

// Supprimer compte
async function handleDeleteAccount() {
const current = auth.currentUser;
if (!current) return;

const ok1 = confirm(
"Supprimer votre compte ? Cette action est définitive (toutes vos données seront effacées)."
);
if (!ok1) return;
const ok2 = confirm("Dernière confirmation : supprimer définitivement ?");
if (!ok2) return;

setMsg("⏳ Suppression en cours…");
try {
await deleteAllProducts(current.uid);
await deleteDoc(doc(db, "users", current.uid));
await deleteUser(current);
setMsg("✅ Compte supprimé. Au revoir !");
router.replace("/login");
} catch (e) {
console.warn("Delete account:", e);
if (e?.code === "auth/requires-recent-login") {
setMsg(
"⚠️ Pour des raisons de sécurité, reconnectez-vous puis relancez la suppression."
);
} else {
setMsg("❌ Erreur lors de la suppression. Réessaie plus tard.");
}
} finally {
setTimeout(() => setMsg(""), 4000);
}
}

if (!user) {
return (
<div className="settings-page">
<h1>Paramètres</h1>
<p>Connectez-vous pour gérer votre profil.</p>
<nav className="tabbar" role="navigation">
<Link
href="/fridge"
className={`tab ${
pathname?.startsWith("/fridge") ? "is-active" : ""
}`}
>
<span className="tab__icon">🧊</span>
<span className="tab__label">Frigo</span>
</Link>
<Link
href="/settings"
className={`tab ${
pathname?.startsWith("/settings") ? "is-active" : ""
}`}
>
<span className="tab__icon">⚙️</span>
<span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}

return (
<>
<div className="settings-page">
<h1>Paramètres</h1>
<p className="subtitle">Personnalisez votre expérience</p>

{/* Profil */}
<form className="card" onSubmit={handleSave}>
<div className="row">
<label>Email</label>
<input type="email" value={email} disabled />
</div>

<div className="row">
<input
type="text"
placeholder="Ex. Grégoire"
value={name}
onChange={(e) => setName(e.target.value)}
/>
<button
type="button"
className="outline"
onClick={handleResetPassword}
>
Réinitialiser mot de passe
</button>
</div>

<div className="actions">
<button className="primary" type="submit" disabled={saving}>
{saving ? "Enregistrement..." : "Enregistrer"}
</button>
</div>

{msg ? <div className="flash">{msg}</div> : null}
</form>

{/* Support */}
<div className="card support-card">
<h3>Support</h3>
<div className="support-links">
<Link href="/settings/faq">Aide et FAQ</Link>
<Link href="/settings/privacy">Confidentialité</Link>

<button
type="button"
className="link"
onClick={() => {
navigator.clipboard.writeText("smonfrigo@gmail.com");
alert("✅ Adresse copiée dans le presse-papier !");
}}
>
Copier l’adresse mail
</button>
</div>
</div>

{/* Installer l’application */}
<div className="card install-card">
<h3>📲 Installer l’application</h3>
<p>
Ajoutez <strong>MonFrigo.dev</strong> directement sur votre écran d’accueil :
</p>

{/* Guide iPhone */}
<div className="install-guide">
<h4>📱 Sur iPhone (Safari)</h4>
<ol>
<li>Ouvrez <strong>MonFrigo.dev</strong> dans Safari.</li>
<li>Appuyez sur le bouton <strong>Partager</strong> (carré + flèche).</li>
<li>Sélectionnez <strong>Ajouter à l’écran d’accueil</strong>.</li>
</ol>
</div>

{/* Guide Android */}
<div className="install-guide">
<h4>📱 Sur Android (Chrome)</h4>
<ol>
<li>Ouvrez <strong>MonFrigo.dev</strong> dans Chrome.</li>
<li>Appuyez sur les <strong>3 points</strong> en haut à droite.</li>
<li>Sélectionnez <strong>Ajouter à l’écran d’accueil</strong>.</li>
</ol>
</div>
</div>

{/* Déconnexion + suppression */}
<div className="card logout-card">
<button type="button" className="danger" onClick={handleLogout}>
Se déconnecter
</button>
<button
type="button"
className="danger"
style={{ marginTop: 10 }}
onClick={handleDeleteAccount}
>
Supprimer mon compte
</button>
</div>
</div>

<nav className="tabbar" role="navigation">
<Link
href="/fridge"
className={`tab ${
pathname?.startsWith("/fridge") ? "is-active" : ""
}`}
>
<span className="tab__icon">🧊</span>
<span className="tab__label">Frigo</span>
</Link>
<Link
href="/settings"
className={`tab ${
pathname?.startsWith("/settings") ? "is-active" : ""
}`}
>
<span className="tab__icon">⚙️</span>
<span className="tab__label">Paramètres</span>
</Link>
</nav>
</>
);
}
