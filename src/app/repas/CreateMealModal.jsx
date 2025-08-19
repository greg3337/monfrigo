"use client";

import { useEffect, useState } from "react";
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
import { db } from "../firebase/firebase-config";

export default function CreateMealModal({ user, day, slot, onClose, onSaved }) {
const [name, setName] = useState("");
const [products, setProducts] = useState([]);
const [selectedIds, setSelectedIds] = useState([]); // plusieurs produits possibles
const [saving, setSaving] = useState(false);

// Charger les produits du frigo: users/{uid}/fridge
useEffect(() => {
if (!user) return;
(async () => {
const q = query(collection(db, "users", user.uid, "fridge"), orderBy("name"));
const snap = await getDocs(q);
const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(data);
})();
}, [user]);

const toggleSelect = (id) => {
setSelectedIds((prev) =>
prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
);
};

const handleSave = async () => {
if (!user) return;
if (!name.trim() && selectedIds.length === 0) {
alert("Donne un nom au repas ou sélectionne au moins un produit du frigo 🙂");
return;
}
setSaving(true);

// Récupère les objets produits sélectionnés
const chosen = products.filter((p) => selectedIds.includes(p.id));
const payload = {
userId: user.uid,
day,
slot,
name: name.trim() || chosen.map((c) => c.name).join(" + "),
products: chosen.map((c) => ({
id: c.id,
name: c.name,
expirationDate: c.expirationDate || null,
category: c.category || null,
})),
createdAt: serverTimestamp(),
};

// 1) add meal
const ref = await addDoc(collection(db, "users", user.uid, "meals"), payload);

// 2) delete chosen products from fridge
for (const c of chosen) {
await deleteDoc(doc(db, "users", user.uid, "fridge", c.id));
}

// 3) callback UI
onSaved && onSaved({ id: ref.id, ...payload, createdAt: new Date() });
setSaving(false);
onClose();
};

return (
<div className="modalOverlay" role="dialog" aria-modal="true">
<div className="modal">
<div className="modalHeader">
<h3>Ajouter un repas</h3>
<button className="btnGhost" onClick={onClose} aria-label="Fermer">✖</button>
</div>

<div className="modalBody">
<div className="fieldRow">
<label>Jour</label>
<input value={day} readOnly />
</div>

<div className="fieldRow">
<label>Créneau</label>
<input value={slot} readOnly />
</div>

<div className="fieldRow">
<label>Nom du repas</label>
<input
placeholder="ex : Pâtes bolo"
value={name}
onChange={(e) => setName(e.target.value)}
/>
</div>

<div className="fieldRow">
<label>Produits du frigo</label>
<div className="productListWrap">
<ul className="product-list">
{products.length === 0 ? (
<li className="emptyRow">Aucun produit dans ton frigo</li>
) : (
products.map((p) => {
const selected = selectedIds.includes(p.id);
return (
<li
key={p.id}
className={selected ? "is-selected" : ""}
onClick={() => toggleSelect(p.id)}
title="Sélectionner/retirer"
>
<span className="name">{p.name}</span>
{p.expirationDate && (
<span className="date">
{String(p.expirationDate).slice(0, 10)}
</span>
)}
</li>
);
})
)}
</ul>
</div>
</div>
</div>

<div className="modalActions">
<button className="btnGhost" onClick={onClose} disabled={saving}>
Annuler
</button>
<button className="btnPrimary" onClick={handleSave} disabled={saving}>
{saving ? "Enregistrement..." : "Enregistrer le repas"}
</button>
</div>
</div>
</div>
);
}
