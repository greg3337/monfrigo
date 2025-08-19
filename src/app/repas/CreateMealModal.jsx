'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import {
collection,
addDoc,
deleteDoc,
doc,
getDocs,
} from 'firebase/firestore';

export default function CreateMealModal({ closeModal, defaultDay, defaultSlot }) {
const [mealName, setMealName] = useState('');
const [products, setProducts] = useState([]); // produits du frigo
const [selectedProduct, setSelectedProduct] = useState('');

useEffect(() => {
if (!auth.currentUser) return;
const fetchProducts = async () => {
const snap = await getDocs(collection(db, 'users', auth.currentUser.uid, 'products'));
setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};
fetchProducts();
}, []);

const handleSave = async () => {
if (!auth.currentUser) return;
try {
// 1) Ajouter le repas
await addDoc(collection(db, 'users', auth.currentUser.uid, 'meals'), {
name: mealName || 'Repas',
day: defaultDay,
slot: defaultSlot,
productId: selectedProduct || null,
createdAt: new Date(),
});

// 2) Supprimer le produit du frigo si choisi
if (selectedProduct) {
await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'products', selectedProduct));
}

closeModal();
} catch (e) {
console.error('Erreur ajout repas :', e);
}
};

return (
<div className="modal">
<div className="modal-content">
<h3>Ajouter un repas</h3>

<label>Nom du repas</label>
<input
type="text"
value={mealName}
onChange={(e) => setMealName(e.target.value)}
placeholder="Ex : Pâtes bolo"
/>

<label>Choisir un produit du frigo</label>
<select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
<option value="">-- Aucun produit sélectionné --</option>
{products.map(p => (
<option key={p.id} value={p.id}>
{p.name || 'Produit'}
</option>
))}
</select>

<div className="modal-actions">
<button onClick={handleSave}>Enregistrer</button>
<button onClick={closeModal}>Annuler</button>
</div>
</div>
</div>
);
}
