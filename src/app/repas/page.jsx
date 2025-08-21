"use client";

/** Empêche le prerender/ISR pour cette page (sinon Vercel plante au build) */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// ⬇️ Ajuste ces chemins si besoin (regarde ton arbre de fichiers)
import { db } from "../firebase/firebase-config"; // <- ../../ si nécessaire
import useAuth from "../hooks/useAuth"; // <- ../../ si nécessaire

import {
addDoc,
collection,
deleteDoc,
doc,
getDocs,
query,
serverTimestamp,
where,
} from "firebase/firestore";

import "./repas.css"; // Tu peux la supprimer si tu n’as pas ce fichier

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SLOTS = ["Déjeuner", "Dîner"];

/* -------------------------------------------------------
Utilitaires Firestore
------------------------------------------------------- */

/** Charge les produits du frigo en testant plusieurs noms de collections.
* Retourne un tableau d'objets: { id, name, __col }
*/
async function loadFridgeProducts(db, uid) {
const candidates = ["fridge", "items", "products"];
const out = [];

for (const colName of candidates) {
try {
const snap = await getDocs(collection(db, "users", uid, colName));
snap.forEach((d) => {
const data = d.data() || {};
// champ "name" ou "title" ou "label" selon tes anciens schémas
const name = data.name || data.title || data.label || "(sans nom)";
out.push({ id: d.id, name, __col: colName });
});
} catch (_) {
// ignore: collection inexistante / règles
}
}
return out;
}

/** Charge les repas enregistrés */
async function loadMeals(db, uid) {
const q = query(collection(db, "users", uid, "meals"));
const snap = await getDocs(q);
return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* -------------------------------------------------------
Modal "Créer un repas"
------------------------------------------------------- */
function AddMealModal({ open, onClose, user, onSaved }) {
const [day, setDay] = useState(DAYS[0]);
const [slot, setSlot] = useState(SLOTS[0]);
const [name, setName] = useState("");
const [products, setProducts] = useState([]); // {id,name,__col}
const [selectedIds, setSelectedIds] = useState(new Set());
const [loading, setLoading] = useState(false);
const [err, setErr] = useState("");

useEffect(() => {
if (!open || !user) return;
let mounted = true;
setErr("");
setLoading(true);
loadFridgeProducts(db, user.uid)
.then((rows) => {
if (mounted) setProducts(rows);
})
.catch((e) => setErr(e.message || "Erreur"))
.finally(() => setLoading(false));
return () => (mounted = false);
}, [open, user]);

const toggleProduct = (id) => {
setSelectedIds((prev) => {
const next = new Set(prev);
next.has(id) ? next.delete(id) : next.add(id);
return next;
});
};

const selected = useMemo(
() => products.filter((p) => selectedIds.has(p.id)),
[products, selectedIds]
);

const save = async () => {
if (!user) return;
setLoading(true);
setErr("");

try {
// 1) Créer le repas
const mealDoc = {
day,
slot,
name: name.trim() || selected.map((p) => p.name).join(" + ") || "(Repas)",
productIds: selected.map((p) => p.id),
createdAt: serverTimestamp(),
};
await addDoc(collection(db, "users", user.uid, "meals"), mealDoc);

// 2) Supprimer les produits utilisés dans leur collection d’origine
for (const p of selected) {
try {
await deleteDoc(doc(db, "users", user.uid, p.__col, p.id));
} catch (_) {}
}

onSaved?.();
onClose?.();
} catch (e) {
setErr(e.message || "Impossible d’enregistrer");
} finally {
setLoading(false);
}
};

if (!open) return null;

return (
<div className="modalBackdrop" onClick={onClose}>
<div className="modalCard" onClick={(e) => e.stopPropagation()}>
<div className="modalHeader">
<h3>Ajouter un repas</h3>
<button className="btnIcon" onClick={onClose} aria-label="Fermer">×</button>
</div>

<div className="modalBody">
<div className="gridTwo">
<label>
Jour
<select value={day} onChange={(e) => setDay(e.target.value)}>
{DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
</select>
</label>
<label>
Créneau
<select value={slot} onChange={(e) => setSlot(e.target.value)}>
{SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<label>
Nom du repas (facultatif)
<input
placeholder="Ex : Salade de poulet"
value={name}
onChange={(e) => setName(e.target.value)}
/>
</label>

<h4>Produits du frigo</h4>
{loading && <p className="muted">Chargement…</p>}
{!loading && products.length === 0 && (
<p className="muted">Aucun produit trouvé. Ajoute d’abord des produits dans l’onglet Frigo.</p>
)}
{!!err && <p className="error">{err}</p>}

<div className="fridgeList">
{products.map((p) => (
<label key={`${p.__col}:${p.id}`} className="checkLine">
<input
type="checkbox"
checked={selectedIds.has(p.id)}
onChange={() => toggleProduct(p.id)}
/>
<span>{p.name}</span>
<small className="muted">({p.__col})</small>
</label>
))}
</div>
</div>

<div className="modalActions">
<button className="btnGhost" onClick={onClose} disabled={loading}>Annuler</button>
<button className="btnPrimary" onClick={save} disabled={loading}>Sauvegarder</button>
</div>
</div>
</div>
);
}

/* -------------------------------------------------------
Page Repas
------------------------------------------------------- */
export default function MealsPage() {
const { user } = useAuth();
const [meals, setMeals] = useState([]); // {id, day, slot, name}
const [open, setOpen] = useState(false);
const [loadingMeals, setLoadingMeals] = useState(false);

const reloadMeals = async () => {
if (!user) return;
setLoadingMeals(true);
try {
const rows = await loadMeals(db, user.uid);
setMeals(rows);
} finally {
setLoadingMeals(false);
}
};

useEffect(() => {
if (!user) return;
reloadMeals();
}, [user]);

const byDaySlot = useMemo(() => {
const m = new Map();
for (const d of DAYS) {
m.set(d, { Déjeuner: [], Dîner: [] });
}
for (const meal of meals) {
if (!m.has(meal.day)) m.set(meal.day, { Déjeuner: [], Dîner: [] });
const key = SLOTS.includes(meal.slot) ? meal.slot : "Déjeuner";
m.get(meal.day)[key].push(meal);
}
return m;
}, [meals]);

return (
<main className="pageWrap">
<header className="pageHeader">
<div className="titleLine">
<span className="emoji" aria-hidden>🍽️</span>
<div>
<h1>Mes repas</h1>
<p className="muted">Planifie tes repas de la semaine</p>
</div>
</div>
<button className="btnPrimary" onClick={() => setOpen(true)}>+ Ajouter un repas</button>
</header>

<section className="weekGrid">
{DAYS.map((d) => (
<div className="dayCard" key={d}>
<h3>{d}</h3>

{SLOTS.map((s) => {
const list = byDaySlot.get(d)?.[s] || [];
return (
<div className="slotBox" key={`${d}-${s}`}>
<div className="slotHead">
<strong>{s}</strong>
<button className="btnLink" onClick={() => setOpen(true)}>+ Ajouter</button>
</div>

{list.length === 0 && <p className="muted">Aucun repas</p>}
{list.map((m) => (
<div className="mealItem" key={m.id}>
<span>{m.name || "(Repas)"}</span>
</div>
))}
</div>
);
})}
</div>
))}
</section>

{loadingMeals && <p className="muted" style={{ padding: "0 16px" }}>Actualisation…</p>}

{/* Modal */}
<AddMealModal
open={open}
onClose={() => setOpen(false)}
user={user}
onSaved={reloadMeals}
/>

{/* Onglets (tabbar) */}
<nav className="tabbar">
<Link href="/fridge" className="tab">
<span className="tab_icon" aria-hidden>🔒</span>
<span>Frigo</span>
</Link>
<Link href="/repas" className="tab is-active">
<span className="tab_icon" aria-hidden>🍽️</span>
<span>Repas</span>
</Link>
<Link href="/settings" className="tab">
<span className="tab_icon" aria-hidden>⚙️</span>
<span>Paramètres</span>
</Link>
</nav>
</main>
);
}
