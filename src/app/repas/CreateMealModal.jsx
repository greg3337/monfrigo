'use client';

import React, { useEffect, useState } from 'react';
import {
collection,
query,
where,
getDocs,
addDoc,
deleteDoc,
doc,
serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase/firebase-config';

export default function CreateMealModal({
dayLabel,
slotLabel,
onClose,
onSaved,
}) {
const [saving, setSaving] = useState(false);
const [products, setProducts] = useState([]); // [{id, name, collection}]
const [selected, setSelected] = useState('');
const user = auth.currentUser;

// -------- Charger les produits du frigo (robuste) --------
useEffect(() => {
let mounted = true;
async function load() {
if (!user) {
console.warn('[CreateMealModal] Pas d’utilisateur connecté');
setProducts([]);
return;
}

const uid = user.uid;
const normalize = (p) => ({
id: p.id,
name: p.name || p.label || p.title || '(sans nom)',
collection: p.__collection || 'products',
});

const tryFetch = async (colName) => {
// On tente différentes clés utilisateur
const colRef = collection(db, colName);
const queries = [
query(colRef, where('userId', '==', uid)),
query(colRef, where('uid', '==', uid)),
query(colRef, where('ownerId', '==', uid)),
];

for (const qy of queries) {
try {
const snap = await getDocs(qy);
if (!snap.empty) {
const arr = snap.docs.map((d) => ({
id: d.id,
__collection: colName,
...d.data(),
}));
return arr.map(normalize);
}
} catch (e) {
// Certaines combinaisons where peuvent échouer si l’index n’existe pas, on ignore et on continue
}
}

// Dernier recours : on prend tout et on filtre côté client si possible
try {
const snapAll = await getDocs(colRef);
const arr = snapAll.docs
.map((d) => ({ id: d.id, __collection: colName, ...d.data() }))
.filter((p) => {
const owner = p.userId || p.uid || p.ownerId;
return !owner || owner === uid;
});
if (arr.length) return arr.map(normalize);
} catch (e) {
console.error(`[CreateMealModal] Erreur fetch ${colName}`, e);
}

return [];
};

// On essaie d’abord "products", puis "fridge"
const fromProducts = await tryFetch('products');
let finalList = fromProducts;
if (finalList.length === 0) {
const fromFridge = await tryFetch('fridge');
finalList = fromFridge;
}

if (mounted) {
console.log('[CreateMealModal] Produits chargés :', finalList);
setProducts(finalList);
}
}
load();
return () => { mounted = false; };
}, [user]);

// -------- Enregistrer --------
const handleSave = async () => {
if (!user) return;
if (!selected) {
alert('Sélectionne un produit du frigo');
return;
}

const prod = products.find((p) => p.id === selected);
if (!prod) return;

setSaving(true);
try {
// 1) Créer le repas
await addDoc(collection(db, 'meals'), {
userId: user.uid,
day: dayLabel, // ex: "Lundi"
slot: slotLabel, // ex: "Déjeuner"
title: prod.name,
products: [prod.name],
createdAt: serverTimestamp(),
});

// 2) Supprimer le produit de la bonne collection
await deleteDoc(doc(db, prod.collection || 'products', prod.id));

if (onSaved) onSaved();
onClose();
} catch (e) {
console.error('[CreateMealModal] Erreur save:', e);
alert("Impossible d'enregistrer le repas.");
} finally {
setSaving(false);
}
};

return (
<div className="modal">
<h3>Ajouter un repas</h3>
<p style={{ marginTop: 8, marginBottom: 8 }}>
{dayLabel} - {slotLabel}
</p>

<label>
<span>Produits du frigo</span>
<select
value={selected}
onChange={(e) => setSelected(e.target.value)}
style={{ width: '100%', padding: 8, marginTop: 4 }}
>
<option value="">-- Sélectionne un produit du frigo --</option>
{products.map((p) => (
<option key={`${p.collection}:${p.id}`} value={p.id}>
{p.name}
</option>
))}
</select>
</label>

{products.length === 0 && (
<p style={{ opacity: 0.7, fontSize: 13, marginTop: 8 }}>
Aucun produit trouvé pour ton compte. Ajoute d’abord des produits dans l’onglet Frigo.
</p>
)}

<div className="modalActions" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
<button className="btnPrimary" disabled={saving} onClick={handleSave}>
{saving ? 'Enregistrement…' : 'Sauvegarder'}
</button>
<button className="btnGhost" onClick={onClose}>Annuler</button>
</div>
</div>
);
}
