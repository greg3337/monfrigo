'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebase-config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import CreateMealModal from '../../components/CreateMealModal';

const jours = [
"lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"
];

export default function RepasPage() {
const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]);
const [openDay, setOpenDay] = useState(null); // pour savoir sur quel jour on ajoute un repas

useEffect(() => {
const unsubscribe = auth.onAuthStateChanged(u => {
setUser(u);
if (u) {
const q = query(collection(db, "users", u.uid, "meals"));
onSnapshot(q, snapshot => {
const data = snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
}));
setMeals(data);
});
}
});
return () => unsubscribe();
}, []);

function getMealsForDay(day) {
return meals.filter(m => m.day === day);
}

return (
<div className="page repasPage">
<h2>Planning des repas</h2>

<div className="planning">
{jours.map(day => (
<div key={day} className="dayBlock">
<div className="dayHeader">
<h3>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
<button onClick={() => setOpenDay(day)}>➕</button>
</div>

<ul className="mealList">
{getMealsForDay(day).length === 0 && (
<li className="empty">Aucun repas</li>
)}
{getMealsForDay(day).map(meal => (
<li key={meal.id}>
<span className="mealName">{meal.name}</span>
<ul className="mealItems">
{meal.items.map(it => (
<li key={it.productId}>{it.name}</li>
))}
</ul>
</li>
))}
</ul>
</div>
))}
</div>

{openDay && (
<CreateMealModal
closeModal={() => setOpenDay(null)}
selectedDay={openDay}
/>
)}
</div>
);
}
