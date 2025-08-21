'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
collection, getDocs, addDoc, serverTimestamp,
writeBatch, doc
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function CreateMealModal({
open, onClose, defaultDay='Lundi', defaultSlot='Déjeuner', user, onSaved
}) {
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);
const [name, setName] = useState('');
const [fridge, setFridge] = useState([]);
const [checked, setChecked] = useState([]);
const [loading, setLoading] = useState(false);
const [loadingFridge, setLoadingFridge] = useState(false);
const [err, setErr] = useState('');

useEffect(() => { setDay(defaultDay); setSlot(defaultSlot); }, [defaultDay, defaultSlot]);

// charge les produits du frigo
useEffect(() => {
if (!open) return;
if (!user?.uid) { setFridge([]); return; }
(async () => {
setLoadingFridge(true); setErr('');
try {
// Nom attendu: 'fridge'. Si chez toi c'est différent, adapte ici.
const snap = await getDocs(collection(db, 'users', user.uid, 'fridge'));
const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setFridge(items);
} catch (e) {
console.error(e);
setErr("Impossible de charger les produits du frigo.");
setFridge([]);
} finally {
setLoadingFridge(false);
}
})();
}, [open, user?.uid]);

const canSave = useMemo(() => !!day && !!slot && !loading, [day, slot, loading]);

const toggle = (id) => {
setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};

const handleSave = async () => {
if (!user?.uid) { onClose?.(); return; }
setLoading(true);
try {
const selected = fridge.filter(f => checked.includes(f.id))
.map(f => ({ id: f.id, name: f.name || f.nom || 'Produit' }));

const payload = {
day, slot, name: name.trim(), products: selected, createdAt: serverTimestamp(),
};
const ref = await addDoc(collection(db, 'users', user.uid, 'meals'), payload);

// supprime du frigo ceux qui ont été utilisés
if (checked.length) {
const batch = writeBatch(db);
checked.forEach(id => batch.delete(doc(db, 'users', user.uid, 'fridge', id)));
await batch.commit();
}

onSaved?.({ id: ref.id, ...payload, products: selected });
} catch (e) {
console.error(e);
// on ferme quand même pour ne pas bloquer l’UI
onClose?.();
} finally {
setLoading(false);
}
};

if (!open) return null;

return (
<div className="modal_backdrop" role="dialog" aria-modal="true">
<div className="modal_card">
<div className="modal_head">
<h3>Ajouter un repas</h3>
<button className="btn_close" onClick={onClose} aria-label="Fermer">×</button>
</div>

<div className="gridTwo">
<label>Jour
<select value={day} onChange={e => setDay(e.target.value)}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</label>
<label>Créneau
<select value={slot} onChange={e => setSlot(e.target.value)}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<label className="mt8">Nom du repas (facultatif)
<input placeholder="Ex : Salade de poulet" value={name} onChange={e => setName(e.target.value)} />
</label>

<h4 className="mt16">Produits du frigo</h4>
{loadingFridge && <p className="muted">Chargement…</p>}
{err && <p className="error">{err}</p>}
{!loadingFridge && !err && fridge.length === 0 && (
<p className="muted">Aucun produit trouvé dans le frigo.</p>
)}
{!loadingFridge && !err && fridge.length > 0 && (
<ul className="fridgeList">
{fridge.map(p => (
<li key={p.id} className="checkLine">
<label>
<input type="checkbox"
checked={checked.includes(p.id)}
onChange={() => toggle(p.id)} />
<span>{p.name || p.nom || 'Produit'}</span>
</label>
</li>
))}
</ul>
)}

<div className="modalActions">
<button className="btnGhost" onClick={onClose} disabled={loading}>Annuler</button>
<button className="btnPrimary" onClick={handleSave} disabled={!canSave}>
{loading ? '…' : 'Sauvegarder'}
</button>
</div>
</div>
</div>
);
}
