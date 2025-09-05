"use client";

import React, { useState } from "react";
import { auth, db } from "../firebase/firebase-config";
import { addDoc, collection } from "firebase/firestore";

export default function AddProductModal({ closeModal }) {
const [name, setName] = useState("");
const [expirationDate, setExpirationDate] = useState("");
const [category, setCategory] = useState("autre");
const [place, setPlace] = useState("frigo");
const [saving, setSaving] = useState(false);

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
const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
if (diffDays < 0) return "expiré";
if (diffDays <= 2) return "urgent";
return "ok";
}

async function onSubmit(e) {
e.preventDefault();
const user = auth.currentUser;
if (!user) {
alert("Tu n'es pas connecté.");
return;
}
if (!name.trim()) {
alert("Nom obligatoire");
return;
}
if (!expirationDate) {
alert("Date d'expiration obligatoire");
return;
}

const isoDate = normalizeDate(expirationDate);
const status = computeStatus(isoDate);

setSaving(true);
try {
await addDoc(collection(db, "users", user.uid, "products"), {
name: name.trim(),
expirationDate: isoDate,
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
<div className="form-grid">
<div className="field">
<label htmlFor="name">Nom</label>
<input
id="name"
type="text"
value={name}
onChange={(e) => setName(e.target.value)}
placeholder="ex : Poulet"
required
/>
</div>

<div className="field">
<label htmlFor="exp">Date d'expiration</label>
<input
id="exp"
type="date"
value={expirationDate}
onChange={(e) => setExpirationDate(e.target.value)}
aria-describedby="exp-help"
required
/>
<small id="exp-help" className="help-text">
Choisissez une date dans le calendrier
</small>
</div>

<div className="field">
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
</div>

<div className="field">
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
</div>
</div>

<div className="modal-actions">
<button
type="button"
className="ghostBtn"
onClick={closeModal}
>
Annuler
</button>
<button
className="primary"
type="submit"
disabled={saving}
>
{saving ? "Ajout…" : "Ajouter"}
</button>
</div>
</form>
</div>
</div>
);
}
