"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase-config";
import { useAuth } from "../hooks/useAuth";
import CreateMealModal from "./CreateMealModal";
import "../styles/tabbar.css";
import "./repas.css";

const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const SLOTS = ["Petit-déjeuner","Déjeuner","Dîner","Goûter"];

export default function RepasPage() {
const { user } = useAuth();
const [meals, setMeals] = useState([]);
const [showModal, setShowModal] = useState(false);
const [selectedDay, setSelectedDay] = useState(null);
const [selectedSlot, setSelectedSlot] = useState(null);

useEffect(() => {
if (!user) return;
const q = query(collection(db, "meals"), where("userId", "==", user.uid));
const unsubscribe = onSnapshot(q, (snapshot) => {
setMeals(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
});
return () => unsubscribe();
}, [user]);

const openModal = (day, slot) => {
setSelectedDay(day);
setSelectedSlot(slot);
setShowModal(true);
};

const handleDelete = async (mealId) => {
await deleteDoc(doc(db, "meals", mealId));
};

return (
<div className="repasSimple">
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🍽️</span>
<h1>Planificateur de repas</h1>
</div>
</div>
</div>

<div className="mealPlanner">
{DAYS.map((day) => (
<div key={day} className="dayCard">
<h2 className="dayTitle">{day}</h2>
<div className="slots">
{SLOTS.map((slot) => {
const meal = meals.find((m) => m.day === day && m.slot === slot);
return (
<div
key={slot}
className="slotCard"
onClick={() => openModal(day, slot)}
>
<span className="slotName">{slot} :</span>
{meal ? (
<span>
{meal.name}
<button
onClick={(e) => {
e.stopPropagation();
handleDelete(meal.id);
}}
style={{
marginLeft: "10px",
background: "red",
color: "white",
border: "none",
borderRadius: "4px",
cursor: "pointer",
}}
>
Supprimer
</button>
</span>
) : (
<span className="slotPlaceholder">+ Ajouter un repas</span>
)}
</div>
);
})}
</div>
</div>
))}
</div>

{showModal && (
<CreateMealModal
day={selectedDay}
slot={selectedSlot}
onClose={() => setShowModal(false)}
/>
)}

{/* ---------- Bas de page ---------- */}
<div className="tabbar">
<a href="/fridge">🧊 Frigo</a>
<a href="/repas" className="active">🍽️ Repas</a>
<a href="/settings">⚙️ Réglages</a>
</div>
</div>
);
}
