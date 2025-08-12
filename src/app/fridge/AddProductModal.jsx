"use client";

import React, { useState } from "react";

export default function AddProductModal({ onClose, onAdd }) {
const [name, setName] = useState("");
const [expiration, setExpiration] = useState("");
const [category, setCategory] = useState("");

const handleSubmit = async (e) => {
e.preventDefault();
if (!name.trim()) {
return alert("Nom du produit requis.");
}

const product = {
name: name.trim(),
expiration: expiration || null, // format yyyy-mm-dd
category: category || null,
};

try {
await onAdd(product); // appelle la fonction transmise par la page
setName("");
setExpiration("");
setCategory("");
} catch (err) {
console.error("Erreur lors de l'ajout du produit :", err);
alert("Erreur lors de l'ajout du produit.");
}
};

return (
<div style={backdropStyle}>
<div style={modalStyle}>
<h3>Ajouter un produit</h3>
<form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
<label>
Nom
<input
type="text"
value={name}
onChange={(e) => setName(e.target.value)}
autoFocus
/>
</label>

<label>
Date d’expiration
<input
type="date"
value={expiration}
onChange={(e) => setExpiration(e.target.value)}
/>
</label>

<label>
Catégorie
<input
type="text"
value={category}
onChange={(e) => setCategory(e.target.value)}
placeholder="Fruits, Viandes…"
/>
</label>

<div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
<button type="button" onClick={onClose}>
Annuler
</button>
<button type="submit">Ajouter</button>
</div>
</form>
</div>
</div>
);
}

const backdropStyle = {
position: "fixed",
inset: 0,
background: "rgba(0,0,0,0.5)",
display: "grid",
placeItems: "center",
zIndex: 1000,
};

const modalStyle = {
width: 360,
maxWidth: "90vw",
background: "#121212",
color: "#fff",
border: "1px solid #2a2a2a",
borderRadius: 10,
padding: 16,
boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
};
