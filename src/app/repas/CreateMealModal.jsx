import { useEffect, useState } from 'react';
import { db, auth } from '../firebase/firebase-config'; // ← ajuste le chemin si besoin

import {collection,query,where,orderBy,getDocs,addDoc,serverTimestamp,deleteDoc,doc,} from 'firebase/firestore';

/**
* Props attendus :
* - dayLabel : libellé du jour (ex: "Lundi")
* - slotLabel : libellé du créneau (ex: "Déjeuner")
* - onClose : fonction pour fermer la modale
* - onSaved : callback après sauvegarde pour rafraîchir la liste
*/
export default function CreateMealModal({ dayLabel, slotLabel, onClose, onSaved }) {
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [products, setProducts] = useState([]);
const [selectedProductId, setSelectedProductId] = useState('');

// 1) Charger les produits du frigo de l'utilisateur
useEffect(() => {
const unsub = auth.onAuthStateChanged(async (user) => {
if (!user) {
setProducts([]);
setLoading(false);
return;
}
try {
const q = query(
collection(db, 'products'), // ← nom de ta collection frigo
where('userId', '==', user.uid),
orderBy('expirationDate', 'asc')
);
const snap = await getDocs(q);
const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setProducts(items);
} catch (e) {
console.error('Erreur chargement produits :', e);
setProducts([]);
} finally {
setLoading(false);
}
});
return () => unsub(); // nettoyage
}, []);

// 2) Sauvegarder le repas + retirer le produit du frigo
const handleSave = async () => {
const user = auth.currentUser;
if (!user) return;

if (!selectedProductId) {
alert('Choisis un produit du frigo.');
return;
}

try {
setSaving(true);

// Récupérer le produit choisi (pour stocker son nom dans le repas)
const chosen = products.find((p) => p.id === selectedProductId);
const productName = chosen?.name || 'Produit';

// Créer le repas
await addDoc(collection(db, 'meals'), {
userId: user.uid,
day: dayLabel, // ex "Lundi"
slot: slotLabel, // ex "Déjeuner"
title: productName, // simple : le nom du produit
createdAt: serverTimestamp(),
});

// Supprimer le produit du frigo
await deleteDoc(doc(db, 'products', selectedProductId));

// Fermer + rafraîchir
onClose?.();
onSaved?.();
} catch (e) {
console.error('Erreur sauvegarde repas :', e);
alert("Impossible d'enregistrer le repas.");
} finally {
setSaving(false);
}
};

return (
<div
role="dialog"
aria-modal="true"
className="modal"
style={{
position: 'fixed',
inset: 0,
background: 'rgba(0,0,0,.2)',
display: 'grid',
placeItems: 'center',
zIndex: 50,
}}
onClick={(e) => {
// fermer si clic sur le backdrop
if (e.target === e.currentTarget) onClose?.();
}}
>
<div
style={{
width: 'min(520px, 92vw)',
background: '#fff',
borderRadius: 12,
padding: 18,
boxShadow: '0 8px 28px rgba(0,0,0,.18)',
}}
>
<h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Ajouter un repas</h3>
<p style={{ margin: '6px 0 14px', color: '#555' }}>
{dayLabel} – {slotLabel}
</p>

{/* Select produit */}
{loading ? (
<p style={{ margin: '10px 0' }}>Chargement des produits…</p>
) : products.length === 0 ? (
<p style={{ margin: '10px 0', color: '#777' }}>
Aucun produit dans le frigo.
</p>
) : (
<label style={{ display: 'block', margin: '8px 0 16px' }}>
<span style={{ display: 'block', fontSize: 13, color: '#444', marginBottom: 6 }}>
Produits du frigo
</span>
<select
value={selectedProductId}
onChange={(e) => setSelectedProductId(e.target.value)}
style={{
width: '100%',
padding: '10px 12px',
borderRadius: 8,
border: '1px solid #d0d5dd',
background: '#fff',
}}
>
<option value="">— Sélectionne un produit du frigo —</option>
{products.map((p) => (
<option key={p.id} value={p.id}>
{p.name}{' '}
{p.expirationDate ? ` • ${p.expirationDate}` : ''}
</option>
))}
</select>
</label>
)}

<div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
<button
disabled={saving || loading}
onClick={handleSave}
className="btnPrimary"
style={{
background: '#0ea5e9',
color: '#fff',
border: 0,
padding: '10px 14px',
borderRadius: 8,
cursor: 'pointer',
}}
>
{saving ? 'Enregistrement…' : 'Sauvegarder'}
</button>
<button
onClick={() => onClose?.()}
className="btnGhost"
style={{
background: '#f3f4f6',
color: '#111827',
border: 0,
padding: '10px 14px',
borderRadius: 8,
cursor: 'pointer',
}}
>
Annuler
</button>
</div>
</div>
</div>
);
}
