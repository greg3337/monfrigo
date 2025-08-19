"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase-config";
import {
collection,
query,
where,
getDocs,
addDoc,
deleteDoc,
doc,
serverTimestamp,
} from "firebase/firestore";

/**
* Props attendues :
* - day: string (ex. "Lundi")
* - slot: string (ex. "Déjeuner")
* - onClose: () => void
*/
export default function CreateMealModal({ day, slot, onClose }) {
const [name, setName] = useState("");
const [products, setProducts] = useState([]); // Produits du frigo
const [selectedProductId, setSelectedProductId] = useState(""); // id produit choisi
const [loading, setLoading] = useState(false);

const user = auth.currentUser;

// Charger les produits du frigo (users/{uid}/products)
useEffect(() => {
const loadProducts = async () => {
if (!user) return;

try {
// Sous-collection des produits de l'utilisateur
const ref = collection(db, "users", user.uid, "products");
const snap = await getDocs(ref);

const list = snap.docs.map((d) => ({
id: d.id,
...d.data(),
}));

// Tri simple : urgents d'abord puis alphabétique
list.sort((a, b) => {
const sa = a.status || "";
const sb = b.status || "";
if (sa === "urgent" && sb !== "urgent") return -1;
if (sb === "urgent" && sa !== "urgent") return 1;
return (a.name || "").localeCompare(b.name || "");
});

setProducts(list);
} catch (e) {
console.error("Erreur chargement produits du frigo :", e);
}
};

loadProducts();
}, [user]);

// Enregistrer le repas et retirer le produit du frigo
const handleSave = async (e) => {
e.preventDefault();
if (!user) return;

if (!name.trim() && !selectedProductId) {
alert("Renseigne un nom de repas ou sélectionne au moins un produit.");
return;
}

setLoading(true);
try {
// Préparer le/les produits associés au repas (facultatif)
let mealProducts = [];
let productToRemoveDocRef = null;

if (selectedProductId) {
const prod = products.find((p) => p.id === selectedProductId);
if (prod) {
mealProducts = [
{
id: prod.id,
name: prod.name || "",
expirationDate: prod.expirationDate || null,
status: prod.status || "",
place: prod.place || "",
category: prod.category || "",
},
];
// Référence du doc à supprimer dans le frigo
productToRemoveDocRef = doc(db, "users", user.uid, "products", prod.id);
}
}

// Créer le repas (collection top-level "meals")
await addDoc(collection(db, "meals"), {
userId: user.uid,
day,
slot,
name: name.trim() || (mealProducts[0]?.name ?? "Repas"),
products: mealProducts,
createdAt: serverTimestamp(),
});

// Si un produit a été sélectionné, on le retire du frigo
if (productToRemoveDocRef) {
await deleteDoc(productToRemoveDocRef);
}

onClose?.();
} catch (e) {
console.error("Erreur enregistrement repas :", e);
alert("Impossible d'enregistrer le repas. Réessaie.");
} finally {
setLoading(false);
}
};

return (
<div className="modalOverlay" onClick={onClose}>
<div className="modal" onClick={(e) => e.stopPropagation()}>
<h3>Ajouter un repas</h3>
<p style={{ marginTop: -6, opacity: 0.8 }}>
{day} · {slot}
</p>

<form onSubmit={handleSave} style={{ marginTop: 12, display: "grid", gap: 10 }}>
{/* Nom du repas */}
<label>
<span>Nom du repas</span>
<input
type="text"
placeholder="ex : Pâtes bolognaise"
value={name}
onChange={(e) => setName(e.target.value)}
style={{ width: "100%" }}
/>
</label>

{/* Sélection d'un produit du frigo (facultatif) */}
<label>
<span>Produit du frigo (optionnel)</span>
<select
value={selectedProductId}
onChange={(e) => setSelectedProductId(e.target.value)}
style={{ width: "100%", padding: "8px 10px" }}
>
<option value="">— Aucun produit sélectionné —</option>
{products.map((p) => (
<option key={p.id} value={p.id}>
{p.name}
{p.expirationDate ? ` — ${p.expirationDate}` : ""}
{p.status === "urgent" ? " ⚠️" : ""}
</option>
))}
</select>
</label>

<div className="modalActions">
<button type="button" className="btnGhost" onClick={onClose} disabled={loading}>
Annuler
</button>
<button type="submit" className="btnPrimary" disabled={loading}>
{loading ? "Enregistrement…" : "Enregistrer"}
</button>
</div>
</form>
</div>
</div>
);
}
