"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Firebase
import { auth, db } from "../firebase/firebase-config";
import {
onAuthStateChanged,
updateProfile,
sendPasswordResetEmail,
signOut as fbSignOut,
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

// --- Auth + nom depuis Firestore ---
useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
setUser(u || null);
setMsg("");
if (!u) return;

setEmail(u.email || "");

try {
const snap = await getDoc(doc(db, "users", u.uid));
const nameFromDoc = snap.exists() ? snap.data()?.name : "";
setName((nameFromDoc && String(nameFromDoc)) || u.displayName || "");
} catch {
setName(u.displayName || "");
}
});
return () => unsub();
}, []);

// --- Enregistrer le nom ---
async function handleSave(e) {
e.preventDefault();
if (!user) return;

setSaving(true);
setMsg("");

try {
// MAJ displayName (Auth) si changé
if ((user.displayName || "") !== name) {
await updateProfile(user, { displayName: name || "" });
}
// MAJ Firestore
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

// --- Email de réinitialisation du mot de passe ---
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

// --- Déconnexion ---
async function handleLogout() {
try {
await fbSignOut(auth);
router.replace("/login");
} catch (e) {
console.warn("Logout:", e);
alert("Erreur lors de la déconnexion");
}
}

// --- Suppression de tous les produits de l’utilisateur ---
async function deleteAllProducts(uid) {
const productsRef = collection(db, "users", uid, "products");
const snap = await getDocs(productsRef);
const jobs = [];
snap.forEach((d) => jobs.push(deleteDoc(doc(db, "users", uid, "products", d.id))));
await Promise.all(jobs);
}

// --- Suppression de compte ---
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
setMsg("⚠️ Pour des raisons de sécurité, reconnectez-vous puis relancez la suppression du compte.");
} else {
setMsg("❌ Erreur lors de la suppression. Réessaie plus tard.");
}
} finally {
setTimeout(() => setMsg(""), 4000);
}
}

// ======== RGPD : Export CSV / JSON ========

// Récupère toutes les données à exporter
async function collectExportData(uid) {
// profil
let profile = { email: "", name: "" };
try {
const u = auth.currentUser;
const snap = await getDoc(doc(db, "users", uid));
profile.email = u?.email || "";
profile.name =
(snap.exists() && (snap.data()?.name || "")) ||
u?.displayName ||
"";
} catch (_) {}

// produits
let products = [];
try {
const q = await getDocs(collection(db, "users", uid, "products"));
products = q.docs.map((d) => ({ id: d.id, ...d.data() }));
} catch (_) {}

return { profile, products };
}

// CSV FR (séparateur ; + BOM) pour Excel
function toCsv(rows) {
if (!rows || !rows.length) return "\ufeff"; // BOM seul si pas de données
// union de toutes les clés rencontrées
const keySet = new Set();
rows.forEach((r) => Object.keys(r).forEach((k) => keySet.add(k)));
const headers = Array.from(keySet);

const escape = (v) => {
if (v === null || v === undefined) return "";
const s = String(v).replace(/"/g, '""');
return `"${s}"`;
};

const head = headers.map(escape).join(";");
const body = rows
.map((r) => headers.map((h) => escape(r[h])).join(";"))
.join("\n");

return "\ufeff" + head + "\n" + body; // BOM + contenu
}

// Téléchargement d’un fichier texte
function download(filename, text, mime = "text/plain;charset=utf-8") {
const blob = new Blob([text], { type: mime });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = filename;
document.body.appendChild(a);
a.click();
a.remove();
URL.revokeObjectURL(url);
}

async function handleExportCSV() {
if (!user) return;
const { products } = await collectExportData(user.uid);
// on exporte principalement les produits en CSV
const csv = toCsv(products);
download("monfrigo_export.csv", csv, "text/csv;charset=utf-8");
}

async function handleExportJSON() {
if (!user) return;
const data = await collectExportData(user.uid);
download("monfrigo_export.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8");
}

// --- État non connecté ---
if (!user) {
return (
<div className="settings-page">
<h1>Paramètres</h1>
<p>Connectez-vous pour gérer votre profil.</p>

{/* Tabbar */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname?.startsWith("/fridge") ? "is-active" : ""}`}>
<span className="tab__icon">🧊</span>
<span className="tab__label">Frigo</span>
</Link>
<Link href="/settings" className={`tab ${pathname?.startsWith("/settings") ? "is-active" : ""}`}>
<span className="tab__icon">⚙️</span>
<span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}

// --- UI connecté ---
return (
<>
<div className="settings-page">
<h1>Paramètres</h1>
<p className="subtitle">Personnalisez votre expérience</p>

{/* Profil */}
<form className="card" onSubmit={handleSave}>
<div className="row">
<label>Profil</label>
<input type="email" value={email} disabled />
</div>

<div className="row">
<input
type="text"
placeholder="Ex. Grégoire"
value={name}
onChange={(e) => setName(e.target.value)}
/>
<button type="button" className="outline" onClick={handleResetPassword}>
Changer mon mot de passe
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
className="support-btn"
onClick={() => {
navigator.clipboard.writeText("smonfrigo@gmail.com");
alert("✅ Adresse copiée dans le presse-papier !");
}}
>
Copier l’adresse mail
</button>
</div>
</div>

{/* Export RGPD */}
<div className="card export-card">
<p className="muted">
Vous pouvez exporter une copie de vos données (profil et produits) pour les conserver.
</p>
<div className="export-buttons">
<button type="button" className="outline" onClick={handleExportCSV}>
Exporter en CSV
</button>
<button type="button" className="outline" onClick={handleExportJSON}>
Exporter en JSON
</button>
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

{/* Tabbar en bas */}
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
