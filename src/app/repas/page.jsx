"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./repas.css";
import "../styles/tabbar.css"; // la CSS de ta tabbar globale (déjà présente)
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase/firebase-config";
import {
collection,
query,
onSnapshot,
orderBy,
} from "firebase/firestore";
import CreateMealModal from "./CreateMealModal";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SLOTS = ["Déjeuner", "Dîner"];

export default function RepasPage() {
const { user } = useAuth();
const [meals, setMeals] = useState([]);
const [open, setOpen] = useState(false);
const [presetDay, setPresetDay] = useState(DAYS[0]);
const [presetSlot, setPresetSlot] = useState(SLOTS[0]);

// Abonnement aux repas
useEffect(() => {
if (!user) return;
const ref = collection(db, "users", user.uid, "meals");
const q = query(ref, orderBy("createdAt", "desc"));
const unsub = onSnapshot(q, (snap) => {
setMeals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
});
return () => unsub();
}, [user]);

// Regroupe les repas par jour/créneau pour l’affichage
const grouped = useMemo(() => {
const map = {};
for (const day of DAYS) {
map[day] = { Déjeuner: [], Dîner: [] };
}
for (const m of meals) {
if (!map[m.day]) map[m.day] = { Déjeuner: [], Dîner: [] };
if (!map[m.day][m.slot]) map[m.day][m.slot] = [];
map[m.day][m.slot].push(m);
}
return map;
}, [meals]);

return (
<main className="repas_page">
<div className="repas_header">
<div className="repas_title">
<span className="emoji">🍽️</span>
<div>
<h1>Mes repas</h1>
<p>Planifie tes repas de la semaine</p>
</div>
</div>
<button
className="btn_primary"
onClick={() => {
setPresetDay(DAYS[0]);
setPresetSlot(SLOTS[0]);
setOpen(true);
}}
>
+ Ajouter un repas
</button>
</div>

<div className="week_grid">
{DAYS.map((day) => (
<div className="day_col" key={day}>
<h3 className="day_title">{day}</h3>

{SLOTS.map((slot) => (
<div className="slot_card" key={slot}>
<div className="slot_head">
<strong>{slot}</strong>
<button
className="link_add"
onClick={() => {
setPresetDay(day);
setPresetSlot(slot);
setOpen(true);
}}
>
+ Ajouter
</button>
</div>

{grouped[day]?.[slot]?.length ? (
grouped[day][slot].map((m) => (
<div className="meal_chip" key={m.id}>
<div className="meal_name">{m.name || "(sans titre)"}</div>
{!!m.items?.length && (
<ul className="meal_items">
{m.items.map((it, i) => (
<li key={i}>{it.name}</li>
))}
</ul>
)}
</div>
))
) : (
<div className="empty_meal">Aucun repas</div>
)}
</div>
))}
</div>
))}
</div>

{open && (
<CreateMealModal
defaultDay={presetDay}
defaultSlot={presetSlot}
onClose={() => setOpen(false)}
/>
)}

{/* Tabbar inline (pas d’import de composant pour éviter les chemins) */}
<nav className="tabbar">
<a className="tab" href="/fridge">
<span className="tab_icon">🧊</span>
<span>Frigo</span>
</a>
<a className="tab is-active" href="/repas">
<span className="tab_icon">🍽️</span>
<span>Repas</span>
</a>
<a className="tab" href="/settings">
<span className="tab_icon">⚙️</span>
<span>Paramètres</span>
</a>
</nav>
</main>
);
}
