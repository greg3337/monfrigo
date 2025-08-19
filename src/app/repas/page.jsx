"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, db } from "../firebase/firebase-config";
import {
collection,
onSnapshot,
query,
orderBy,
deleteDoc,
doc,
} from "firebase/firestore";

import CreateMealModal from "./CreateMealModal";
import "./repas.css";

export default function RepasPage() {
const pathname = usePathname();
const [isOpen, setIsOpen] = useState(false);
const [meals, setMeals] = useState([]);

// Charger les repas depuis Firestore
useEffect(() => {
const user = auth.currentUser;
if (!user) return;

const q = query(
collection(db, "users", user.uid, "meals"),
orderBy("createdAt", "asc")
);
const unsub = onSnapshot(q, (snapshot) => {
setMeals(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
});

return () => unsub();
}, []);

// Supprimer un repas
const deleteMeal = async (mealId) => {
const user = auth.currentUser;
if (!user) return;
await deleteDoc(doc(db, "users", user.uid, "meals", mealId));
};

return (
<>
<div className="repasSimple">
{/* ===== En-tête ===== */}
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🍽️</span>
<h2>Mes repas</h2>
</div>
<p className="hello">Planifie tes repas de la semaine</p>
</div>
<div className="actions">
<button className="btnPrimary" onClick={() => setIsOpen(true)}>
➕ Ajouter un repas
</button>
</div>
</div>

{/* ===== Liste repas ===== */}
<div className="mealPlanner">
{meals.length === 0 && <p>Aucun repas planifié pour l’instant.</p>}
{meals.map((meal) => (
<div key={meal.id} className="dayCard">
<h3 className="dayTitle">
{meal.day} - {meal.slot}
</h3>
<div className="slots">
<div className="slotCard">
<p>{meal.name}</p>
{meal.products && meal.products.length > 0 && (
<ul>
{meal.products.map((p, i) => (
<li key={i}>{p.name}</li>
))}
</ul>
)}
<button
className="btnDelete"
onClick={() => deleteMeal(meal.id)}
>
❌ Supprimer
</button>
</div>
</div>
</div>
))}
</div>

{/* ===== Modale ===== */}
{isOpen && <CreateMealModal closeModal={() => setIsOpen(false)} />}
</div>

{/* ===== Tabbar en bas ===== */}
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
className={`tab ${
pathname?.startsWith("/settings") ? "is-active" : ""
}`}
>
<span className="tab_icon">⚙️</span>
<span className="tab_label">Paramètres</span>
</Link>
</nav>
</>
);
}
