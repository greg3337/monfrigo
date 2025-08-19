"use client";

import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase/firebase-config";
import {
collection,
query,
where,
onSnapshot,
addDoc,
deleteDoc,
doc,
} from "firebase/firestore";
import CreateMealModal from "./CreateMealModal";
import "./repas.css";

const DAYS = [
"Lundi",
"Mardi",
"Mercredi",
"Jeudi",
"Vendredi",
"Samedi",
"Dimanche",
];
const SLOTS = ["Petit-déjeuner", "Déjeuner", "Diner", "Goûter"];

export default function MealsPage() {
const [meals, setMeals] = useState([]);
const [showModal, setShowModal] = useState(false);
const [selectedDay, setSelectedDay] = useState("");
const [selectedSlot, setSelectedSlot] = useState("");

const user = auth.currentUser;

// Charger les repas
useEffect(() => {
if (!user) return;

const q = query(
collection(db, "meals"),
where("userId", "==", user.uid)
);

const unsubscribe = onSnapshot(q, (snapshot) => {
const data = snapshot.docs.map((doc) => ({
id: doc.id,
...doc.data(),
}));
setMeals(data);
});

return () => unsubscribe();
}, [user]);

// Ouvrir le modal
const handleAddMeal = (day, slot) => {
setSelectedDay(day);
setSelectedSlot(slot);
setShowModal(true);
};

// Supprimer un repas
const handleDeleteMeal = async (id) => {
try {
await deleteDoc(doc(db, "meals", id));
} catch (error) {
console.error("Erreur suppression repas :", error);
}
};

return (
<div className="mealsPage">
<h1>🍽️ Mes repas</h1>
{user && <p>Salut {user.email} 👋</p>}

{DAYS.map((day) => (
<div key={day} className="dayBlock">
<h2>{day}</h2>
{SLOTS.map((slot) => {
const meal = meals.find(
(m) => m.day === day && m.slot === slot
);
return (
<div key={slot} className="mealRow">
<strong>{slot}</strong> :{" "}
{meal ? (
<>
{meal.name}
<button
className="btnDelete"
onClick={() => handleDeleteMeal(meal.id)}
>
Supprimer
</button>
</>
) : (
"Aucun repas planifié"
)}
<button
className="btnAdd"
onClick={() => handleAddMeal(day, slot)}
>
+ Ajouter un repas
</button>
</div>
);
})}
</div>
))}

{showModal && (
<CreateMealModal
day={selectedDay}
slot={selectedSlot}
onClose={() => setShowModal(false)}
/>
)}
</div>
);
}
