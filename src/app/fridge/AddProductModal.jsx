'use client';

import { useState } from 'react';
import { auth, db } from '../app/firebase/firebase-config';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

const CATEGORIES = [
'Fruits',
'Légumes',
'Viandes',
'Poissons',
'Produits laitiers',
'Boissons',
'Épicerie',
'Autre',
];

export default function AddProductModal({ open, onClose, onSaved }) {
const [name, setName] = useState('');
const [cat, setCat] = useState(CATEGORIES[0]);
const [date, setDate] = useState('');
const [saving, setSaving] = useState(false);
const [error, setError] = useState('');

if (!open) return null;

const reset = () => {
setName('');
setCat(CATEGORIES[0]);
setDate('');
setError('');
};

const save = async (e) => {
e.preventDefault();
setError('');
if (!name || !date) {
setError('Nom et date d’expiration requis.');
return;
}
const uid = auth.currentUser?.uid;
if (!uid) {
setError('Utilisateur non connecté.');
return;
}
setSaving(true);
try {
const exp = Timestamp.fromDate(new Date(date));
await addDoc(collection(db, 'users', uid, 'products'), {
name,
category: cat,
expirationDate: exp,
createdAt: Timestamp.now(),
});
reset();
onSaved?.();
} catch (err) {
console.error(err);
setError('Impossible d’ajouter le produit.');
} finally {
setSaving(false);
}
};

return (
<div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
<div className="bg-white w-full sm:max-w-md sm:rounded-2xl sm:shadow-xl p-5">
<div className="flex items-center justify-between mb-3">
<h3 className="text-lg font-semibold">Ajouter un produit</h3>
<button
onClick={() => {
reset();
onClose?.();
}}
className="text-gray-500 hover:text-gray-700"
>
✕
</button>
</div>

<form onSubmit={save} className="space-y-4">
<div>
<label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
<input
type="text"
className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
placeholder="Ex: Yaourt nature"
value={name}
onChange={(e) => setName(e.target.value)}
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
<select
className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
value={cat}
onChange={(e) => setCat(e.target.value)}
>
{CATEGORIES.map((c) => (
<option key={c} value={c}>
{c}
</option>
))}
</select>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-1">
Date d’expiration
</label>
<input
type="date"
className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
value={date}
onChange={(e) => setDate(e.target.value)}
/>
</div>

{error && <div className="text-sm text-rose-600">{error}</div>}

<button
type="submit"
disabled={saving}
className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg transition"
>
{saving ? 'Enregistrement…' : 'Ajouter'}
</button>
</form>
</div>
</div>
);
}
