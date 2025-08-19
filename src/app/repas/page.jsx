"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
collection,
query,
where,
getDocs,
deleteDoc,
doc,
orderBy,
} from "firebase/firestore";
import { db } from "../firebase/firebase-config";
import { useAuth } from "../hooks/useAuth";
import CreateMealModal from "./CreateMealModal";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SLOTS = ["Petit-déjeuner", "Déjeuner", "Dîner", "Goûter"];

export default function RepasPage() {
const pathname = usePathname();
const user = useAuth();

const [meals, setMeals] = useState([]);
const [showModal, setShowModal] = useState(false);
const [pendingDay, setPendingDay] = useState("");
const [pendingSlot, setPendingSlot] = useState("");

// Charger les repas depuis users/{uid}/meals
useEffect(() => {
if (!user) return;

(async () => {
const q = query(
collection(db, "users", user.uid, "meals"),
orderBy("createdAt", "desc")
);
const snap = await getDocs(q);
const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setMeals(data);
})();
}, [user]);

const openModal = (day, slot) => {
setPendingDay(day);
setPendingSlot(slot);
setShowModal(true);
};

const handleDeleteMeal = async (mealId) => {
if (!user) return;
await deleteDoc(doc(db, "users", user.uid, "meals", mealId));
setMeals((prev) => prev.filter((m) => m.id !== mealId));
};

return (
<>
<div className="repasSimple">
{/* En-tête */}
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🍽️</span>
<h2>Mes repas</h2>
</div>
<p className="hello">Planifie tes repas à partir de ton frigo</p>
</div>

<div className="actions">
<button className="btnPrimary" onClick={() => openModal("Lundi", "Déjeuner")}>
➕ Créer un repas
</button>
</div>
</div>

{/* Planning hebdo */}
<div className="mealPlanner">
{DAYS.map((day) => (
<div key={day} className="dayCard">
<h3 className="dayTitle">{day}</h3>

<div className="slots">
{SLOTS.map((slot) => {
const meal = meals.find((m) => m.day === day && m.slot === slot);
return (
<div key={slot} className="slotCard">
<div className="slotMain">
<span className="slotName">{slot}</span>
{meal ? (
<span className="slotMeal">
{meal.name}
{meal.products?.length ? (
<span className="slotProducts">
{" · "}
{meal.products.map((p) => p.name).join(", ")}
</span>
) : null}
</span>
) : (
<span className="slotPlaceholder">Aucun repas planifié</span>
)}
</div>

<div className="slotActions">
<button
className="btnLink"
onClick={() => openModal(day, slot)}
>
+ Ajouter un repas
</button>
{meal && (
<button
className="btnGhost"
onClick={() => handleDeleteMeal(meal.id)}
title="Supprimer ce repas"
>
❌ Supprimer
</button>
)}
</div>
</div>
);
})}
</div>
</div>
))}
</div>

{showModal && (
<CreateMealModal
user={user}
day={pendingDay}
slot={pendingSlot}
onClose={() => setShowModal(false)}
// Quand on enregistre, on met à jour la liste locale
onSaved={(newMeal) =>
setMeals((prev) => {
// remplace un éventuel repas existant même day/slot
const filtered = prev.filter(
(m) => !(m.day === newMeal.day && m.slot === newMeal.slot)
);
return [{ ...newMeal }, ...filtered];
})
}
/>
)}
</div>

{/* Tabbar */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname?.startsWith("/fridge") ? "is-active" : ""}`}>
<span className="tab_icon">🧊</span>
<span className="tab_label">Frigo</span>
</Link>
<Link href="/repas" className={`tab ${pathname?.startsWith("/repas") ? "is-active" : ""}`}>
<span className="tab_icon">🍽️</span>
<span className="tab_label">Repas</span>
</Link>
<Link href="/settings" className={`tab ${pathname?.startsWith("/settings") ? "is-active" : ""}`}>
<span className="tab_icon">⚙️</span>
<span className="tab_label">Paramètres</span>
</Link>
</nav>
</>
);
}
