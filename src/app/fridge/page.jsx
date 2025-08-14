'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import AddProductModal from './AddProductModal.jsx';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase-config';
import {
collection,
deleteDoc,
doc,
getDoc,
onSnapshot,
orderBy,
query
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

// ---- helpers ----
const formatDateFR = (d) => {
if (!d) return '';
const iso = d.includes('/') ? d.split('/').reverse().join('-') : d;
const date = new Date(iso);
if (isNaN(date)) return d;
return date.toLocaleDateString('fr-FR', {
day: '2-digit', month: '2-digit', year: 'numeric'
});
};

export default function FridgePage() {
// Auth + user
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);

// Données produits
const [products, setProducts] = useState([]);

// UI
const [isModalOpen, setIsModalOpen] = useState(false);
const [q, setQ] = useState('');
const [category, setCategory] = useState('all');
const [place, setPlace] = useState('all');

const pathname = usePathname();

// Auth + chargement données
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
const userRef = doc(db, 'users', u.uid);
const snap = await getDoc(userRef);
if (snap.exists()) setUserDoc(snap.data());

const qRef = query(
collection(db, 'users', u.uid, 'products'),
orderBy('expirationDate')
);
onSnapshot(qRef, (snapshot) => {
const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(list);
});
} catch (e) {
console.error('Firestore error:', e);
} finally {
setLoading(false);
}
});
return () => unsub();
}, []);

// Suppression
const deleteProduct = async (id) => {
if (!user) return;
await deleteDoc(doc(db, 'users', user.uid, 'products', id));
};

// Filtrage affiché
const visible = useMemo(() => {
return products.filter((p) => {
const okQ = q === '' || p.name.toLowerCase().includes(q.toLowerCase());
const okCat = category === 'all' || p.category === category;
const okPlace = place === 'all' || p.place === place;
return okQ && okCat && okPlace;
});
}, [products, q, category, place]);

// Compteurs
const total = products.length;
const urgent = products.filter((p) => p.status === 'urgent').length;
const expired = products.filter((p) => p.status === 'expired').length;

if (loading) return <p>Chargement...</p>;

return (
<div className="wrap">
{/* Header */}
<div className="header">
<div className="brand">
<div className="logo"></div>
<div className="brandTitle">Mon Frigo</div>
<div className="brandSub">
Salut {userDoc?.name || 'utilisateur'} 👋
</div>
</div>
</div>

{/* Cartes stats */}
<div className="stats">
<div className="card green">
<div className="cardLabel">Total</div>
<div className="cardValue">{total}</div>
</div>
<div className="card orange">
<div className="cardLabel">Urgent</div>
<div className="cardValue">{urgent}</div>
</div>
<div className="card red">
<div className="cardLabel">Expirés</div>
<div className="cardValue">{expired}</div>
</div>
</div>

{/* Barre d’actions */}
<div className="actions">
<input
className="search"
placeholder="Rechercher un produit..."
value={q}
onChange={(e) => setQ(e.target.value)}
/>

<div className="filters">
<select value={category} onChange={(e) => setCategory(e.target.value)}>
<option value="all">Toutes les catégories</option>
<option value="viande">Viande</option>
<option value="poisson">Poisson</option>
<option value="legume">Légumes</option>
<option value="fruit">Fruits</option>
<option value="laitier">Produits laitiers</option>
<option value="autre">Autres</option>
</select>

<select value={place} onChange={(e) => setPlace(e.target.value)}>
<option value="all">Tous les lieux</option>
<option value="frigo">Frigo</option>
<option value="congel">Congélateur</option>
<option value="placard">Placard</option>
</select>
</div>
</div>

<button className="primary" onClick={() => setIsModalOpen(true)}>
+ Ajouter un produit
</button>

{/* Liste produits */}
<div className="content">
<ul className="grid">
{visible.map((p) => (
<li key={p.id} className="item">
<div className="itemMeta">
<span className="itemName">{p.name}</span>
{p.category && <span className="pill">{p.category}</span>}
{p.place && <span className="pill">{p.place}</span>}
{p.expirationDate && (
<span className="pill">{formatDateFR(p.expirationDate)}</span>
)}
</div>
<button className="deleteBtn" onClick={() => deleteProduct(p.id)}>
Supprimer
</button>
</li>
))}
</ul>
</div>

{/* État vide */}
{products.length === 0 && (
<div className="empty">
<div className="emptyIcon">🗂️</div>
<div className="emptyTitle">Votre frigo est vide</div>
<div className="emptyText">Ajoutez vos premiers produits pour commencer.</div>
<button className="primary" onClick={() => setIsModalOpen(true)}>
Ajouter un produit
</button>
</div>
)}

{/* Modal d’ajout */}
{isModalOpen && <AddProductModal closeModal={() => setIsModalOpen(false)} />}

{/* Tabbar */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname.includes('/fridge') ? 'is-active' : ''}`}>
<span className="tab__icon">🧊</span>
<span className="tab__label">Frigo</span>
</Link>
<Link href="/repas" className={`tab ${pathname.includes('/repas') ? 'is-active' : ''}`}>
<span className="tab__icon">🍽️</span>
<span className="tab__label">Repas</span>
</Link>
<Link href="/settings" className={`tab ${pathname.includes('/settings') ? 'is-active' : ''}`}>
<span className="tab__icon">⚙️</span>
<span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}