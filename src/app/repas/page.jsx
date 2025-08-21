"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import TabBar from "../components/TabBar";

export default function RepasPage() {
const [meals, setMeals] = useState([]);
const [newMeal, setNewMeal] = useState("");

// Charger les repas depuis Firestore
useEffect(() => {
const fetchMeals = async () => {
try {
const querySnapshot = await getDocs(collection(db, "meals"));
setMeals(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
} catch (error) {
console.error("Erreur lors du chargement des repas:", error);
}
};
fetchMeals();
}, []);

// Ajouter un repas
const addMeal = async () => {
if (!newMeal.trim()) return;

try {
const docRef = await addDoc(collection(db, "meals"), {
name: newMeal,
createdAt: serverTimestamp(),
});
setMeals([...meals, { id: docRef.id, name: newMeal }]);
setNewMeal("");
} catch (error) {
console.error("Erreur lors de l'ajout du repas:", error);
}
};

return (
<div style={{ padding: "20px" }}>
<h1>🍽️ Mes Repas</h1>
<div style={{ marginBottom: "20px" }}>
<input
type="text"
value={newMeal}
onChange={(e) => setNewMeal(e.target.value)}
placeholder="Ajouter un repas"
/>
<button onClick={addMeal}>Ajouter</button>
</div>
<ul>
{meals.map((meal) => (
<li key={meal.id}>{meal.name}</li>
))}
</ul>

{/* Onglet en bas */}
<TabBar />
</div>
);
}
