'use client';

import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import CreateMealModal from './CreateMealModal';
import './repas.css';

export default function RepasPage() {
const [meals, setMeals] = useState([]);
const [modalOpen, setModalOpen] = useState(false);
const [selectedDay, setSelectedDay] = useState(null);
const [selectedSlot, setSelectedSlot] = useState(null);

useEffect(() => {
const auth = getAuth();
const user = auth.currentUser;
if (!user) return;

const q = query(
collection(db, 'meals'),
where('userId', '==', user.uid)
);

const unsub = onSnapshot(q, snap => {
const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setMeals(data);
});

return () => unsub();
}, []);

const openModal = (day, slot) => {
setSelectedDay(day);
setSelectedSlot(slot);
setModalOpen(true);
};

const days = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const slots = ['Déjeuner','Dîner'];

return (
<div className="repasPage">
<h2>Mes repas</h2>
<p>Planifie tes repas de la semaine</p>

<div className="repasGrid">
{days.map(day => (
<div key={day} className="dayColumn">
<h3>{day}</h3>
{slots.map(slot => {
const found = meals.filter(m => m.day === day && m.slot === slot);
return (
<div key={slot} className="mealSlot">
<strong>{slot}</strong>
{found.length === 0 ? (
<p>Aucun repas <button onClick={() => openModal(day, slot)}>+ Ajouter</button></p>
) : (
<ul>
{found.map(m => (
<li key={m.id}>{m.name || '(Sans nom)'}</li>
))}
<button onClick={() => openModal(day, slot)}>+ Ajouter</button>
</ul>
)}
</div>
);
})}
</div>
))}
</div>

{modalOpen && (
<CreateMealModal
defaultDay={selectedDay}
defaultSlot={selectedSlot}
closeModal={() => setModalOpen(false)}
/>
)}
</div>
);
}
