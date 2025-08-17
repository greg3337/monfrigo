'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth, db } from '../firebase/firebase-config';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import CreateMealModal from './CreateMealModal';

export default function RepasPage() {
const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]);
const [open, setOpen] = useState(false);
const pathname = usePathname();

useEffect(() => {
const unsubAuth = auth.onAuthStateChanged(u => setUser(u || null));
return () => unsubAuth();
}, []);

useEffect(() => {
if (!user) return;
const q = query(collection(db, 'users', user.uid, 'meals'), orderBy('createdAt', 'desc'));
const unsub = onSnapshot(q, snap => {
const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setMeals(list);
});
return () => unsub();
}, [user]);

return (
<div className="repasSimple">
{/* Header */}
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🍴</span>
<span>Salut {user?.email?.split('@')[0] || 'utilisateur'} 👋</span>
</div>
<div className="hello">Tes repas composés</div>
</div>
<div className="actions">
<input className="search" placeholder="Rechercher un repas ou un ingrédient…" />
<button className="primary" onClick={() => setOpen(true)}>+ Composer un repas</button>
</div>
</div>

{/* Liste / état vide */}
{meals.length === 0 ? (
<div className="emptyMeals">
<div className="emoji">🍽️</div>
<div className="emptyTitle">Aucun repas pour l’instant</div>
<div className="emptyText">Compose un repas à partir des produits de ton frigo.</div>
<button className="primary" onClick={() => setOpen(true)}>Composer un repas</button>
</div>
) : (
<ul className="grid">
{meals.map(m => (
<li key={m.id} className="item">
<div className="itemMeta">
<span className="itemName">{m.name}</span>
<span className="pill">{m.items?.length || 0} produit(s)</span>
</div>
</li>
))}
</ul>
)}

{/* Modal */}
{open && <CreateMealModal onClose={() => setOpen(false)} />}

{/* Tabbar (bas) */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname.includes('/fridge') ? 'is-active' : ''}`}>
<span className="tab_icon">🧊</span>
<span className="tab_label">Frigo</span>
</Link>

<Link href="/repas" className={`tab ${pathname.includes('/repas') ? 'is-active' : ''}`}>
<span className="tab_icon">🍽️</span>
<span className="tab_label">Repas</span>
</Link>

<Link href="/settings" className={`tab ${pathname.includes('/settings') ? 'is-active' : ''}`}>
<span className="tab_icon">⚙️</span>
<span className="tab_label">Paramètres</span>
</Link>
</nav>
</div>
);
}
