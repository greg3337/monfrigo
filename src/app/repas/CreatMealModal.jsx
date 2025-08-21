'use client';

import React, { useEffect, useMemo, useState } from 'react';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS = ['Déjeuner','Dîner'];

export default function CreateMealModal({
userId,
defaultDay = 'Lundi',
defaultSlot = 'Déjeuner',
loadFridge, // (userId) => { items:[{id,name,_collection}], tried:[...] }
onSaveMeal, // ({day,slot,name,selectedItems}) => Promise
onClose,
}) {
const [day, setDay] = useState(defaultDay);
const [slot, setSlot] = useState(defaultSlot);
const [name, setName] = useState('');
const [loading, setLoading] = useState(true);
const [fridge, setFridge] = useState([]);
const [triedCols, setTriedCols] = useState([]);
const [err, setErr] = useState('');

useEffect(() => {
let stop = false;
(async () => {
try {
setLoading(true);
const { items, tried } = await loadFridge(userId);
if (!stop) {
setFridge(items);
setTriedCols(tried);
}
} catch (e) {
if (!stop) setErr("Impossible de charger les produits du frigo.");
} finally {
if (!stop) setLoading(false);
}
})();
return () => { stop = true; };
}, [userId, loadFridge]);

const [checked, setChecked] = useState({});
const selectedItems = useMemo(() =>
fridge.filter(f => checked[f.id]).map(f => ({ id: f.id, name: f.name, _collection: f._collection }))
, [fridge, checked]);

function toggle(id) {
setChecked(prev => ({ ...prev, [id]: !prev[id] }));
}

async function save() {
await onSaveMeal({ day, slot, name, selectedItems });
onClose?.();
}

return (
<div className="modal">
<div className="modalCard">
<div className="modalHead">
<h4>Ajouter un repas</h4>
<button className="close" onClick={onClose}>×</button>
</div>

<div className="formRow gridTwo">
<label>
Jour
<select value={day} onChange={e => setDay(e.target.value)}>
{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
</select>
</label>
<label>
Créneau
<select value={slot} onChange={e => setSlot(e.target.value)}>
{SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</label>
</div>

<label className="mt8">
Nom du repas (facultatif)
<input
placeholder="Ex : Salade de poulet"
value={name}
onChange={e => setName(e.target.value)}
/>
</label>

<div className="sectionTitle">Produits du frigo</div>

{loading ? (
<p className="muted">Chargement des produits…</p>
) : fridge.length === 0 ? (
<>
{err ? <p className="error">{err}</p> : null}
<p className="muted">Aucun produit trouvé dans le frigo.</p>
<p className="hint small">
Collections testées : {triedCols.join(', ') || 'aucune'}.
</p>
</>
) : (
<ul className="fridgeList">
{fridge.map(p => (
<li key={p.id} className={`checkLine ${checked[p.id] ? 'active' : ''}`}>
<label>
<input
type="checkbox"
checked={!!checked[p.id]}
onChange={() => toggle(p.id)}
/>
<span>{p.name}</span>
<em className="muted small">({p._collection})</em>
</label>
</li>
))}
</ul>
)}

<div className="modalActions">
<button className="btnGhost" onClick={onClose}>Annuler</button>
<button
className="btnPrimary"
onClick={save}
disabled={loading}
>
Sauvegarder
</button>
</div>
</div>
</div>
);
}
