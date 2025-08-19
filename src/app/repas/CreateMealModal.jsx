'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function CreateMealModal({ closeModal, defaultDay, defaultSlot }) {
const [products, setProducts] = useState([]);
const [selectedProduct, setSelectedProduct] = useState('');

useEffect(() => {
const fetchProducts = async () => {
const snapshot = await getDocs(collection(db, 'fridge'));
setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
};
fetchProducts();
}, []);

const handleSave = async () => {
if (!selectedProduct) return;

const product = products.find((p) => p.id === selectedProduct);

// Ajouter le repas
await addDoc(collection(db, 'meals'), {
day: defaultDay,
slot: defaultSlot,
productId: product.id,
productName: product.name,
});

// Supprimer du frigo
await deleteDoc(doc(db, 'fridge', product.id));

closeModal();
};

return (
<div className="modalOverlay">
<div className="modalContent">
<h3>Ajouter un repas</h3>
<p>{defaultDay} - {defaultSlot}</p>

<select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
<option value="">-- Sélectionne un produit du frigo --</option>
{products.map((product) => (
<option key={product.id} value={product.id}>
{product.name}
</option>
))}
</select>

<div className="modalActions">
<button onClick={handleSave} className="btnPrimary">✅ Sauvegarder</button>
<button onClick={closeModal} className="btnSecondary">❌ Annuler</button>
</div>
</div>
</div>
);
}
