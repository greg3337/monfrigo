"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase-config";
import { useAuth } from "../hooks/useAuth";
import CreateMealModal from "./CreateMealModal";
import "../styles/repas.css"; // styles de la page
import "../styles/tabbar.css"; // assure la tabbar en bas

const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const SLOTS = ["Déjeuner","Dîner"];

export default function MealsPage() {
const { user } = useAuth();
const [open, setOpen] = useState(false);
const [meals, setMeals] = useState([]); // [{id, day, slot, name, productIds}]
const [loading, setLoading] = useState(true);

// stream des repas de l'utilisateur
useEffect(() => {
if (!user) return;
const q = query(collection(db, `users/${user.uid}/meals`));
const unsub = onSnapshot(q, (snap) => {
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setMeals(rows);
setLoading(false);
});
return () => unsub();
}, [user]);

const grouped = DAYS.map(day => ({
day,
slots: SLOTS.map(slot => ({
slot,
items: meals.filter(m => m.day === day && m.slot === slot),
})),
}));

return (
<main className="page page-meals">
<header className="pageHeader">
<h1>🍽️ Mes repas</h1>
<p>Planifie tes repas de la semaine</p>
<button className="btnPrimary" onClick={() => setOpen(true)}>
+ Ajouter un repas
</button>
</header>

<section className="gridWeek">
{grouped.map(({ day, slots }) => (
<div key={day} className="dayCol">
<h3>{day}</h3>
{slots.map(({ slot, items }) => (
<div key={slot} className="slotCard">
<div className="slotHead">
<strong>{slot}</strong>
<button className="link" onClick={() => setOpen(true)}>+ Ajouter</button>
</div>

{items.length === 0 ? (
<p className="muted">Aucun repas</p>
) : (
<ul className="mealList">
{items.map(m => (
<li key={m.id}>{m.name || "(sans nom)"}</li>
))}
</ul>
)}
</div>
))}
</div>
))}
</section>

<CreateMealModal open={open} onClose={() => setOpen(false)} />

{/* Tabbar déjà fixée en bas via tabbar.css */}
<nav className="tabbar">
<a className="tab" href="/fridge">
<span className="tab_icon">🧊</span> Frigo
</a>
<a className="tab is-active" href="/repas">
<span className="tab_icon">🍽️</span> Repas
</a>
<a className="tab" href="/settings">
<span className="tab_icon">⚙️</span> Paramètres
</a>
</nav>
</main>
);
}
