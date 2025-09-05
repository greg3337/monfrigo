"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase-config";
import { addDoc, collection } from "firebase/firestore";

export default function AddProductModal({ closeModal }) {
// Cache la tabbar pendant la modale
useEffect(() => {
document.body.classList.add("modal-open");
return () => document.body.classList.remove("modal-open");
}, []);

const [name, setName] = useState("");
const [expirationDate, setExpirationDate] = useState("");
const [category, setCategory] = useState("autre");
const [place, setPlace] = useState("frigo");
const [saving, setSaving] = useState(false);

// Accepte "YYYY-MM-DD" ou "DD/MM/YYYY" et renvoie "YYYY-MM-DD"
function normalizeDate(d) {
if (!d) return "";
if (d.includes("/")) {
const [dd, mm, yyyy] = d.split("/");
return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}
return d;
}

function computeStatus(dateStr) {
if (!dateStr) return "ok";
const today = new Date();
const d = new Date(dateStr);
today.setHours(0, 0, 0, 0);
d.setHours(0, 0, 0, 0);

const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
if (diffDays < 0) return "expired";
if (diffDays <= 2) return "urgent";
return "ok";
}

async function onSubmit(e) {
e.preventDefault();
const user = auth.currentUser;

if (!user) return alert("Tu n'es pas connecté.");
if (!name.trim()) return alert("Nom obligatoire");
if (!expirationDate) return alert("Date d'expiration obligatoire");

const isoDate = normalizeDate(expirationDate);
const status = computeStatus(isoDate);

setSaving(true);
try {
await addDoc(collection(db, "users", user.uid, "products"), {
name: name.trim(),
expirationDate: isoDate, // format YYYY-MM-DD
category,
place,
status,
createdAt: new Date().toISOString(),
});

// reset + fermer
setName("");
setExpirationDate("");
setCategory("autre");
setPlace("frigo");
closeModal();
} catch (err) {
console.error("addDoc error:", err);
alert(`Erreur lors de l'ajout du produit: ${err.code || ""} ${err.message || ""}`);
} finally {
setSaving(false);
}
}

return (
<div className="modal-backdrop">
<div className="modal">
<h3>Ajouter un produit</h3>
<form onSubmit={onSubmit}>
<label htmlFor="name">Nom</label>
<input
id="name"
type="text"
value={name}
onChange={(e) => setName(e.target.value)}
placeholder="ex : Poulet"
required
/>

<label htmlFor="expirationDate">Date d'expiration</label>
<input
id="expirationDate"
type="date"
value={expirationDate}
onChange={(e) => setExpirationDate(e.target.value)}
required
/>

<label htmlFor="category">Catégorie</label>
<select
id="category"
value={category}
onChange={(e) => setCategory(e.target.value)}
>
<option value="viande">Viande</option>
<option value="poisson">Poisson</option>
<option value="légume">Légume</option>
<option value="fruit">Fruit</option>
<option value="laitier">Laitier</option>
<option value="autre">Autre</option>
</select>

<label htmlFor="place">Lieu</label>
<select
id="place"
value={place}
onChange={(e) => setPlace(e.target.value)}
>
<option value="frigo">Frigo</option>
<option value="congelo">Congélateur</option>
<option value="placard">Placard</option>
</select>

<div className="modal-actions">
<button type="button" className="ghostBtn" onClick={closeModal}>
Annuler
</button>
<button className="primary" type="submit" disabled={saving}>
{saving ? "Ajout…" : "Ajouter"}
</button>
</div>
</form>
</div>
</div>
);
}
