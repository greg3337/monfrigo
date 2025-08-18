'use client';

import React, { useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import './repas.css'; // tu peux mettre le style du modal dedans

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function CreateMealModal({ closeModal, defaultDay, defaultSlot }) {
const [mealName, setMealName] = useState('');
const [day, setDay] = useState(defaultDay || 'Lundi');
const [slot, setSlot] = useState(defaultSlot || 'Déjeuner');
const [items, setItems] = useState('');

const handleSave = async () => {
try {
const user = auth.currentUser;
if (!user) {
alert('Vous devez être connecté pour ajouter un repas');
return;
}

await addDoc(collection(db, 'users', user.uid, 'meals'), {
name: mealName,
day: day,
slot: slot,
items: items ? items.split(',').map(i => i.trim()) : [],
createdAt: serverTimestamp(),
});

// ferme la modale après ajout
closeModal();
} catch (err) {
console.error('Erreur lors de l’ajout du repas:', err);
alert('Impossible d’ajouter le repas.');
}
};

return (
<div className="modalOverlay">
<div className="modalContent">
<h2>Ajouter un repas</h2>

<label>Nom du repas</label>
<input
type="text"
value={mealName}
onChange={(e) => setMealName(e.target.value)}
placeholder="Ex : Pâtes bolo"
/>

<label>Jour</label>
<select value={day} onChange={(e) => setDay(e.target.value)}>
{DAYS.map((d) => (
<option key={d} value={d}>{d}</option>
))}
</select>

<label>Créneau</label>
<select value={slot} onChange={(e) => setSlot(e.target.value)}>
{SLOTS.map((s) => (
<option key={s} value={s}>{s}</option>
))}
</select>

<label>Ingrédients (séparés par des virgules)</label>
<input
type="text"
value={items}
onChange={(e) => setItems(e.target.value)}
placeholder="Ex : tomates, pâtes, viande"
/>

<div className="modalActions">
<button onClick={handleSave} className="btnPrimary">💾 Sauvegarder</button>
<button onClick={closeModal} className="btnSecondary">❌ Annuler</button>
</div>
</div>
</div>
);
}
