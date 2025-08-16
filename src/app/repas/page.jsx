'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase-config';
import { collection, onSnapshot, query } from 'firebase/firestore';
import CreateMealModal from './CreateMealModal';

const JOURS = [
'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche',
];

export default function RepasPage() {
const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]);
const [openDay, setOpenDay] = useState(null); // jour sur lequel on ajoute un repas

// Auth + chargement des repas
useEffect(() => {
const unsub = onAuthStateChanged(auth, (u) => {
setUser(u);
if (!u) {
setMeals([]);
return;
}
const q = query(collection(db, 'users', u.uid, 'meals'));
const unsubMeals = onSnapshot(q, (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setMeals(list);
});
// nettoyer quand l'utilisateur change
return () => unsubMeals();
});
return () => unsub();
}, []);

const mealsFor = (day) => meals.filter((m) => m.day === day);

return (
<div className="page repasPage" style={{ padding: 16 }}>
<h2>📅 Planning des repas</h2>

<div className="planning" style={{
display: 'grid',
gridTemplateColumns: 'repeat(3, 1fr)',
gap: 16,
marginTop: 12
}}>
{JOURS.map((day) => (
<div key={day} className="dayBlock" style={{
background: '#fff',
border: '1px solid #eee',
borderRadius: 10,
padding: 12,
minHeight: 140
}}>
<div className="dayHeader" style={{
display: 'flex',
alignItems: 'center',
justifyContent: 'space-between',
marginBottom: 8
}}>
<h3 style={{ margin: 0, textTransform: 'capitalize' }}>{day}</h3>
<button className="primary" onClick={() => setOpenDay(day)}>
➕
</button>
</div>

<ul className="mealList" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
{mealsFor(day).length === 0 && (
<li className="empty" style={{ opacity: 0.6 }}>Aucun repas</li>
)}
{mealsFor(day).map((meal) => (
<li key={meal.id} style={{
background: '#f7f7f9',
borderRadius: 8,
padding: '8px 10px',
marginBottom: 8
}}>
<div className="mealName" style={{ fontWeight: 600 }}>
{meal.name}
</div>
{Array.isArray(meal.items) && meal.items.length > 0 && (
<ul className="mealItems" style={{
listStyle: 'disc',
paddingLeft: 18,
margin: '6px 0 0 0'
}}>
{meal.items.map((it) => (
<li key={it.productId || it.name}>{it.name}</li>
))}
</ul>
)}
</li>
))}
</ul>
</div>
))}
</div>

{openDay && (
<CreateMealModal
selectedDay={openDay}
close={() => setOpenDay(null)}
/>
)}
</div>
);
}
