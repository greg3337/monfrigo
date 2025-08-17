'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase-config';
import {
collection,
onSnapshot,
orderBy,
query,
} from 'firebase/firestore';
import CreateMealModal from './CreateMealModal';

export default function RepasPage() {
const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]);
const [open, setOpen] = useState(false);

useEffect(() => {
const unsubAuth = auth.onAuthStateChanged(u => setUser(u || null));
return () => unsubAuth();
}, []);

useEffect(() => {
if (!user) return;
const q = query(
collection(db, 'users', user.uid, 'meals'),
orderBy('createdAt', 'desc')
);
const unsub = onSnapshot(q, snap => {
const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setMeals(list);
});
return () => unsub();
}, [user]);

return (
<div className="repasSimple">
<div className="repasHeader">
<div className="title">
<div className="titleLine">
<span className="cube">🍴</span>
<span>Salut {user?.email || 'inconnu'}</span>
</div>
<div className="hello">Tes repas composés</div>
</div>
<div className="actions">
<input
className="search"
placeholder="Rechercher un repas ou un ingrédient…"
/>
<button className="primary" onClick={() => setOpen(true)}>
+ Composer un repas
</button>
</div>
</div>

{/* Liste ou état vide */}
{meals.length === 0 ? (
<div className="emptyMeals">
<div className="emoji">🍽️</div>
<div className="emptyTitle">Aucun repas pour l’instant</div>
<div className="emptyText">
Compose un repas à partir des produits de ton frigo.
</div>
<button className="primary" onClick={() => setOpen(true)}>
Composer un repas
</button>
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

{open && <CreateMealModal onClose={() => setOpen(false)} />}
</div>
);
}

