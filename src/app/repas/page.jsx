"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { db } from "../firebase/firebase-config";
import {collection,getDocs,addDoc,deleteDoc,doc,} from "firebase/firestore";
import useAuth from "../hooks/useAuth";
import "./repas.css";

export default function RepasPage() {
const pathname = usePathname();
const { user } = useAuth();

const [fridgeItems, setFridgeItems] = useState([]);
const [meals, setMeals] = useState([]);
const [isOpen, setIsOpen] = useState(false);
const [selectedProducts, setSelectedProducts] = useState([]);
const [selectedDay, setSelectedDay] = useState(null);
const [selectedSlot, setSelectedSlot] = useState(null);

// Charger les produits du frigo
useEffect(() => {
if (!user) return;
const load = async () => {
const snap = await getDocs(collection(db, "users", user.uid, "fridge"));
setFridgeItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
};
load();
}, [user]);

// Ouvrir la modale
const openAddMeal = (day, slot) => {
setSelectedDay(day);
setSelectedSlot(slot);
setSelectedProducts([]);
setIsOpen(true);
};

// Toggle produit sélectionné
const toggleProduct = (item) => {
setSelectedProducts((prev) =>
prev.find((p) => p.id === item.id)
? prev.filter((p) => p.id !== item.id)
: [...prev, item]
);
};

// Sauvegarder repas
const saveMeal = async () => {
if (!user || !selectedDay || !selectedSlot) return;

// Enregistrer le repas
await addDoc(collection(db, "users", user.uid, "meals"), {
day: selectedDay,
slot: selectedSlot,
products: selectedProducts,
createdAt: new Date(),
});

// Supprimer du frigo les produits utilisés
for (const p of selectedProducts) {
await deleteDoc(doc(db, "users", user.uid, "fridge", p.id));
}

// Rafraîchir frigo
const snap = await getDocs(collection(db, "users", user.uid, "fridge"));
setFridgeItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

setIsOpen(false);
};

return (
<>
<div className="repasSimple">
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🍽️</span>
<h2>Mes repas</h2>
</div>
<p className="hello">Planifie tes repas de la semaine</p>
</div>
</div>

{/* Planning hebdo */}
<div className="mealPlanner">
{["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map(
(day, i) => (
<div key={i} className="dayCard">
<h3 className="dayTitle">{day}</h3>
<div className="slots">
{["Déjeuner", "Dîner"].map((slot, j) => (
<div
key={j}
className="slotCard"
onClick={() => openAddMeal(day, slot)}
>
<p className="slotName">{slot}</p>
<p className="slotPlaceholder">➕ Ajouter</p>
</div>
))}
</div>
</div>
)
)}
</div>

{/* Modale */}
{isOpen && (
<div className="modal">
<div className="modalContent">
<h3>
Ajouter {selectedSlot} du {selectedDay}
</h3>
<ul className="product-list">
{fridgeItems.length === 0 && (
<p className="emptyRow">Aucun produit dans ton frigo</p>
)}
{fridgeItems.map((item) => (
<li
key={item.id}
className={
selectedProducts.find((p) => p.id === item.id)
? "is-selected"
: ""
}
onClick={() => toggleProduct(item)}
>
{item.name}
</li>
))}
</ul>
<button className="btnPrimary" onClick={saveMeal}>
✅ Valider
</button>
<button className="btnSecondary" onClick={() => setIsOpen(false)}>
❌ Annuler
</button>
</div>
</div>
)}
</div>

{/* Tabbar */}
<nav
className="tabbar"
role="navigation"
aria-label="Navigation principale"
>
<Link
href="/fridge"
className={`tab ${pathname?.startsWith("/fridge") ? "is-active" : ""}`}
>
<span className="tab_icon">🧊</span>
<span className="tab_label">Frigo</span>
</Link>
<Link
href="/repas"
className={`tab ${pathname?.startsWith("/repas") ? "is-active" : ""}`}
>
<span className="tab_icon">🍽️</span>
<span className="tab_label">Repas</span>
</Link>
<Link
href="/settings"
className={`tab ${pathname?.startsWith("/settings") ? "is-active" : ""}`}
>
<span className="tab_icon">⚙️</span>
<span className="tab_label">Paramètres</span>
</Link>
</nav>
</>
);
}
