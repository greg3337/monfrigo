'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import AddProductModal from './AddProductModal.jsx';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase-config';
import {
collection,
deleteDoc,
doc,
getDoc,
onSnapshot,
orderBy,
query,
} from 'firebase/firestore';

export default function FridgePage() {
// Auth + user doc
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);

// UI / données
const [isModalOpen, setIsModalOpen] = useState(false);
const [products, setProducts] = useState([]);

const pathname = usePathname();

// Auth + données
useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
setUser(u || null);

if (!u) {
setUserDoc(null);
setProducts([]);
setLoading(false);
return;
}

try {
// Doc utilisateur
const userRef = doc(db, 'users', u.uid);
const snap = await getDoc(userRef);
if (snap.exists()) setUserDoc(snap.data());

// Produits (temps réel)
const q = query(
collection(db, 'users', u.uid, 'products'),
orderBy('expirationDate')
);
onSnapshot(q, (snapshot) => {
const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
});
} catch (err) {
console.error('Erreur Firestore :', err);
} finally {
setLoading(false);
}
});

return () => unsub();
}, []);

// Suppression produit
const deleteProduct = async (id) => {
if (!user) return;
await deleteDoc(doc(db, 'users', user.uid, 'products', id));
};

if (loading) return <p>Chargement...</p>;

return (
<div className="wrap">
{/* Header */}
<div className="header">
<div className="brand">
<div className="logo">🧊</div>
<div>
<div className="brandTitle">Mon Frigo</div>
<div className="brandSub">Salut {userDoc?.name || 'utilisateur'} 👋</div>
</div>
</div>
</div>

{/* Cartes stats */}
<div className="stats">
<div className="card card_green">
<div className="cardLabel">Total</div>
<div className="cardValue">{products.length}</div>
</div>
<div className="card card_orange">
<div className="cardLabel">Urgent</div>
<div className="cardValue">
{products.filter((p) => p.status === 'urgent').length}
</div>
</div>
<div className="card card_red">
<div className="cardLabel">Expirés</div>
<div className="cardValue">
{products.filter((p) => p.status === 'expired' || p.status === 'expiré').length}
</div>
</div>
</div>

{/* Bouton haut (uniquement si on a déjà des produits) */}
{products.length > 0 && (
<div className="actions">
<button className="primary" onClick={() => setIsModalOpen(true)}>
+ Ajouter un produit
</button>
</div>
)}

{/* Liste produits */}
<div className="content">
<ul className="grid">
{products.map((p) => (
<li key={p.id} className="item">
<div className="itemMeta">
<span className="itemName">{p.name}</span>
</div>
<button className="deleteBtn" onClick={() => deleteProduct(p.id)}>
Supprimer
</button>
</li>
))}
</ul>

{/* État vide */}
{products.length === 0 && (
<div className="empty">
<div className="emptyIcon">🧺</div>
<div className="emptyTitle">Votre frigo est vide</div>
<div className="emptyText">Ajoutez vos premiers produits pour commencer.</div>
<button className="primary" onClick={() => setIsModalOpen(true)}>
Ajouter un produit
</button>
</div>
)}
</div>

{/* Modal d’ajout */}
{isModalOpen && (
<AddProductModal closeModal={() => setIsModalOpen(false)} />
)}

{/* Barre d’onglets */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link
href="/fridge"
className={`tab ${pathname.includes('/fridge') ? 'is-active' : ''}`}
>
<span className="tab__icon">❄️</span>
<span className="tab__label">Frigo</span>
</Link>

<Link
href="/repas"
className={`tab ${pathname.includes('/repas') ? 'is-active' : ''}`}
>
<span className="tab__icon">🍽️</span>
<span className="tab__label">Repas</span>
</Link>

<Link
href="/settings"
className={`tab ${pathname.includes('/settings') ? 'is-active' : ''}`}
>
<span className="tab__icon">⚙️</span>
<span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}
