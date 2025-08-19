"use client";

import React, { useEffect, useMemo, useState } from "react";
import { db, auth } from "../firebase/firebase-config";
import {
addDoc,
collection,
deleteDoc,
doc,
getDocs,
orderBy,
query,
serverTimestamp,
} from "firebase/firestore";

const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const SLOTS = ["Petit-déjeuner","Déjeuner","Dîner","Goûter"];

export default function CreateMealModal({ day, slot, onClose }) {
const [mealName, setMealName] = useState("");
const [products, setProducts] = useState([]); // produits du frigo
const [pickedIds, setPickedIds] = useState([]); // multi-sélection
const [search, setSearch] = useState("");
const [saving, setSaving] = useState(false);

const user = auth.currentUser;

// Charger les produits du frigo (users/{uid}/products)
useEffect(() => {
if (!user) return;
(async () => {
try {
const q = query(
collection(db, "users", user.uid, "products"),
orderBy("name")
);
const snap = await getDocs(q);
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
} catch (e) {
console.error("Erreur chargement produits:", e);
}
})();
}, [user]);

// Filtre de recherche
const visible = useMemo(() => {
const q = search.trim().toLowerCase();
if (!q) return products;
return products.filter(
(p) =>
p.name?.toLowerCase().includes(q) ||
p.category?.toLowerCase().includes(q) ||
p.place?.toLowerCase().includes(q)
);
}, [products, search]);

// Toggle sélection
const togglePick = (id) => {
setPickedIds((prev) =>
prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
);
};

// Enregistrer
const handleSave = async (e) => {
e?.preventDefault?.();
if (!user) return;

const chosen = products.filter((p) => pickedIds.includes(p.id));
if (!mealName.trim() && chosen.length === 0) {
alert("Entre un nom de repas ou sélectionne au moins un produit :)");
return;
}

setSaving(true);
try {
// 1) Créer le repas (collection top-level "meals")
const payload = {
userId: user.uid,
day: day || DAYS[0],
slot: slot || SLOTS[1],
name: mealName.trim() || chosen.map((c) => c.name).join(" + "),
products: chosen.map((c) => ({
id: c.id,
name: c.name || "",
expirationDate: c.expirationDate || "",
category: c.category || "autre",
place: c.place || "frigo",
})),
createdAt: serverTimestamp(),
};

const ref = await addDoc(collection(db, "meals"), payload);

// 2) Supprimer du frigo les produits utilisés
for (const c of chosen) {
await deleteDoc(doc(db, "users", user.uid, "products", c.id));
}

// 3) Fermer
onClose?.();
} catch (e) {
console.error("Erreur enregistrement repas:", e);
alert("Impossible d'enregistrer le repas. Réessaie.");
} finally {
setSaving(false);
}
};

return (
<div className="modalOverlay" onClick={onClose} role="dialog" aria-modal="true">
<div className="modal" onClick={(e) => e.stopPropagation()}>
<h3 style={{ marginTop: 0 }}>Ajouter un repas</h3>
<p style={{ marginTop: -6, opacity: 0.8 }}>{slot} · {day}</p>

<form onSubmit={handleSave} style={{ display: "grid", gap: 10, marginTop: 10 }}>
<label>
Nom du repas
<input
type="text"
value={mealName}
onChange={(e) => setMealName(e.target.value)}
placeholder="ex : Pâtes bolo"
/>
</label>

<div style={{ display: "flex", gap: 8 }}>
<label style={{ flex: 1 }}>
Jour
<select value={day} disabled>
{DAYS.map((d) => (
<option key={d} value={d}>{d}</option>
))}
</select>
</label>

<label style={{ flex: 1 }}>
Créneau
<select value={slot} disabled>
{SLOTS.map((s) => (
<option key={s} value={s}>{s}</option>
))}
</select>
</label>
</div>

<label>
Produits du frigo (optionnel)
<input
type="text"
placeholder="Rechercher…"
value={search}
onChange={(e) => setSearch(e.target.value)}
style={{ marginTop: 4 }}
/>
</label>

<div className="productListWrap">
<ul className="product-list">
{visible.length === 0 && <li className="emptyRow">Aucun produit</li>}
{visible.map((p) => {
const isSel = pickedIds.includes(p.id);
return (
<li
key={p.id}
className={isSel ? "is-selected" : ""}
onClick={() => togglePick(p.id)}
>
<input type="checkbox" readOnly checked={isSel} />
<span className="name">{p.name || "(sans nom)"}</span>
{p.expirationDate && (
<span className="date">{String(p.expirationDate).slice(0, 10)}</span>
)}
</li>
);
})}
</ul>
</div>

<div className="modalActions">
<button type="button" className="btnGhost" onClick={onClose}>
Annuler
</button>
<button type="submit" className="btnPrimary" disabled={saving}>
{saving ? "Enregistrement…" : "Enregistrer le repas"}
</button>
</div>
</form>
</div>
</div>
);
}
