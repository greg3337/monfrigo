"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase-config";
import {
addDoc,
collection,
deleteDoc,
doc,
getDocs,
serverTimestamp,
} from "firebase/firestore";

export default function CreateMealModal({ closeModal }) {
const [day, setDay] = useState("Lundi");
const [slot, setSlot] = useState("Déjeuner");
const [mealName, setMealName] = useState("");
const [products, setProducts] = useState([]);
const [selectedProducts, setSelectedProducts] = useState([]);

// Charger les produits du frigo
useEffect(() => {
const user = auth.currentUser;
if (!user) return;

const fetchProducts = async () => {
const snap = await getDocs(collection(db, "users", user.uid, "products"));
setProducts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
};

fetchProducts();
}, []);

// Ajouter ou retirer un produit sélectionné
const toggleProduct = (product) => {
setSelectedProducts((prev) =>
prev.find((p) => p.id === product.id)
? prev.filter((p) => p.id !== product.id)
: [...prev, product]
);
};

// Enregistrer le repas + retirer produits du frigo
const saveMeal = async () => {
const user = auth.currentUser;
if (!user) return;

const mealData = {
day,
slot,
name: mealName,
products: selectedProducts,
createdAt: serverTimestamp(),
};

await addDoc(collection(db, "users", user.uid, "meals"), mealData);

// Retirer les produits utilisés du frigo
for (const p of selectedProducts) {
await deleteDoc(doc(db, "users", user.uid, "products", p.id));
}

closeModal();
};

return (
<div className="modalOverlay">
<div className="modalContent">
<h2>➕ Ajouter un repas</h2>

<label>Jour</label>
<select value={day} onChange={(e) => setDay(e.target.value)}>
{["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"].map((d) => (
<option key={d} value={d}>{d}</option>
))}
</select>

<label>Créneau</label>
<select value={slot} onChange={(e) => setSlot(e.target.value)}>
<option value="Déjeuner">Déjeuner</option>
<option value="Dîner">Dîner</option>
</select>

<label>Nom du repas</label>
<input
type="text"
value={mealName}
onChange={(e) => setMealName(e.target.value)}
placeholder="Ex: Poulet rôti"
/>

<label>Produits du frigo</label>
<div className="productList">
{products.length === 0 && <p>Aucun produit dans le frigo</p>}
{products.map((p) => (
<div
key={p.id}
className={`productItem ${
selectedProducts.find((sp) => sp.id === p.id) ? "selected" : ""
}`}
onClick={() => toggleProduct(p)}
>
{p.name}
</div>
))}
</div>

<div className="modalActions">
<button onClick={saveMeal} className="btnPrimary">
✅ Enregistrer
</button>
<button onClick={closeModal} className="btnSecondary">
❌ Annuler
</button>
</div>
</div>
</div>
);
}
