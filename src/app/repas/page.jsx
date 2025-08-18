"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { auth, db } from "../firebase/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

import CreateMealModal from "./CreateMealModal";

// ⚠️ Assure-toi que ce fichier existe: src/app/styles/tabbar.css
import "../styles/tabbar.css";
import "../globals.css";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function RepasPage() {
const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]);
const [showModal, setShowModal] = useState(false);
const pathname = usePathname();

// Auth + chargement des repas de l’utilisateur
useEffect(() => {
const unsubAuth = onAuthStateChanged(auth, (u) => {
setUser(u || null);
if (!u) return;

const q = query(
collection(db, "users", u.uid, "meals"),
orderBy("createdAt", "desc")
);
const unsubMeals = onSnapshot(q, (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setMeals(list);
});

// Nettoyage quand on change d’utilisateur
return () => unsubMeals();
});

return () => unsubAuth();
}, []);

return (
<div className="repasSimple">
{/* Header */}
<div className="repasHeader">
<div className="title">
<span className="cube">🍽️</span>
<div className="titleLine">
<h1>Planning des repas</h1>
</div>
<div className="hello">Salut {user?.displayName || "utilisateur"} 👋</div>
</div>

<div className="actions">
<button className="primary" onClick={() => setShowModal(true)}>
+ Composer un repas
</button>
</div>
</div>

{/* Planning 7 jours (midi/soir) */}
<div className="planning">
{DAYS.map((day) => (
<section key={day} className="day">
<h2 className="dayTitle">📅 {day}</h2>

<div className="slots">
{["Midi", "Soir"].map((time) => {
const items = meals.filter((m) => m.day === day && m.time === time);
return (
<div key={time} className="slot">
<h3 className="slotTitle">{time}</h3>
{items.length === 0 ? (
<p className="emptyMeal">— Aucun repas —</p>
) : (
<ul className="mealList">
{items.map((m) => (
<li key={m.id} className="mealCard">
<div className="mealName">{m.name}</div>
{m.products?.length ? (
<div className="mealProducts">
{m.products.join(", ")}
</div>
) : null}
</li>
))}
</ul>
)}
</div>
);
})}
</div>
</section>
))}
</div>

{/* Modal de création */}
{showModal && <CreateMealModal closeModal={() => setShowModal(false)} />}

{/* ===== Tabbar en bas ===== */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link
href="/fridge"
className={`tab ${pathname.includes("/fridge") ? "is-active" : ""}`}
>
<span className="tab_icon">🧊</span>
<span className="tab_label">Frigo</span>
</Link>

<Link
href="/repas"
className={`tab ${pathname.includes("/repas") ? "is-active" : ""}`}
>
<span className="tab_icon">🍽️</span>
<span className="tab_label">Repas</span>
</Link>

<Link
href="/settings"
className={`tab ${pathname.includes("/settings") ? "is-active" : ""}`}
>
<span className="tab_icon">⚙️</span>
<span className="tab_label">Paramètres</span>
</Link>
</nav>
</div>
);
}
