'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase-config';
import {
collection,
deleteDoc,
doc,
getDoc,
onSnapshot,
orderBy,
query
} from 'firebase/firestore';

import CreateMealModal from './CreateMealModal.jsx';
import '../styles/tabbar.css';

export default function MealsPage() {
const [user, setUser] = useState(null);
const [userDoc, setUserDoc] = useState(null);
const [loading, setLoading] = useState(true);

// Données
const [products, setProducts] = useState([]); // produits du frigo
const [meals, setMeals] = useState([]); // repas composés

// UI
const [isModalOpen, setIsModalOpen] = useState(false);
const [q, setQ] = useState(''); // recherche repas

const pathname = usePathname();

useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
setUser(u || null);
if (!u) {
setUserDoc(null);
setProducts([]);
setMeals([]);
setLoading(false);
return;
}

try {
// User doc (pour le nom/prénom)
const userRef = doc(db, 'users', u.uid);
const snap = await getDoc(userRef);
if (snap.exists()) setUserDoc(snap.data());

// Produits du frigo (temps réel)
const pRef = query(
collection(db, 'users', u.uid, 'products'),
orderBy('expirationDate')
);
onSnapshot(pRef, (s) => {
setProducts(s.docs.map((d) => ({ id: d.id, ...d.data() })));
});

// Repas (temps réel)
const mRef = query(
collection(db, 'users', u.uid, 'meals'),
orderBy('createdAt')
);
onSnapshot(mRef, (s) => {
setMeals(s.docs.map((d) => ({ id: d.id, ...d.data() })));
});
} catch (e) {
console.error('Firestore error:', e);
} finally {
setLoading(false);
}
});

return () => unsub();
}, []);

// Suppression d'un repas
const deleteMeal = async (id) => {
if (!user) return;
await deleteDoc(doc(db, 'users', user.uid, 'meals', id));
};

// Filtre affichage des repas
const visibleMeals = useMemo(() => {
const term = q.trim().toLowerCase();
if (!term) return meals;
return meals.filter((m) => {
const inName = (m.name || '').toLowerCase().includes(term);
const inItems = (m.items || []).some((it) =>
(it.name || '').toLowerCase().includes(term)
);
return inName || inItems;
});
}, [meals, q]);

// Nom convivial
const greetingName =
(typeof user?.displayName === 'string' && user.displayName.trim()) ||
(typeof userDoc?.name === 'string' && userDoc.name.trim()) ||
'';

if (loading) return <p>Chargement...</p>;

return (
<div className="wrap">
{/* Header */}
<div className="header">
<div className="brand">
<div className="brandTitle">Repas</div>
<div className="brandSub">
{`Salut${greetingName ? ' ' + greetingName : ''} 👋`}
</div>
</div>
</div>

{/* Barre d’actions */}
<div className="actions">
<input
className="search"
placeholder="Rechercher un repas ou un ingrédient…"
value={q}
onChange={(e) => setQ(e.target.value)}
/>
<button className="primary" onClick={() => setIsModalOpen(true)}>
+ Composer un repas
</button>
</div>

{/* Liste des repas */}
<div className="content">
{visibleMeals.length > 0 ? (
<ul className="grid">
{visibleMeals.map((meal) => (
<li key={meal.id} className="item">
<div className="itemMeta">
<span className="itemName">{meal.name}</span>
<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
{(meal.items || []).map((it) => (
<span key={it.productId} className="pill">
{it.name}
</span>
))}
</div>
</div>
<button className="deleteBtn" onClick={() => deleteMeal(meal.id)}>
Supprimer
</button>
</li>
))}
</ul>
) : (
<div className="empty">
<div className="emptyIcon">🍽️</div>
<div className="emptyTitle">Aucun repas pour l’instant</div>
<div className="emptyText">
Compose un repas à partir des produits de ton frigo.
</div>
<button className="primary" onClick={() => setIsModalOpen(true)}>
Composer un repas
</button>
</div>
)}
</div>

{/* Modal de composition */}
{isModalOpen && (
<CreateMealModal
products={products}
close={() => setIsModalOpen(false)}
/>
)}

{/* Tabbar */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname.includes('/fridge') ? 'is-active' : ''}`}>
<span className="tab__icon">🧊</span><span className="tab__label">Frigo</span>
</Link>
<Link href="/repas" className={`tab ${pathname.includes('/repas') ? 'is-active' : ''}`}>
<span className="tab__icon">🍽️</span><span className="tab__label">Repas</span>
</Link>
<Link href="/settings" className={`tab ${pathname.includes('/settings') ? 'is-active' : ''}`}>
<span className="tab__icon">⚙️</span><span className="tab__label">Paramètres</span>
</Link>
</nav>
</div>
);
}
