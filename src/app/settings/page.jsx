'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, updateProfile, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase-config';
import './settings.css';

export default function SettingsPage() {
const [user, setUser] = useState(null);
const [displayName, setDisplayName] = useState('');
const [email, setEmail] = useState('');
const [saving, setSaving] = useState(false);
const [msg, setMsg] = useState('');

// Charge l’utilisateur + son doc Firestore
useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
setUser(u || null);
setMsg('');
if (!u) return;

setEmail(u.email || '');
// récupère le nom depuis Firestore si présent
try {
const snap = await getDoc(doc(db, 'users', u.uid));
const nameFromDb = snap.exists() ? snap.data().name : '';
setDisplayName(nameFromDb || u.displayName || '');
} catch {
setDisplayName(u.displayName || '');
}
});
return () => unsub();
}, []);

// Enregistrer le nom
const handleSave = async () => {
if (!user) return;
setSaving(true);
setMsg('');
try {
// maj auth (facultatif mais propre)
await updateProfile(user, { displayName: displayName || '' });
// maj firestore
await setDoc(
doc(db, 'users', user.uid),
{ name: displayName || '' },
{ merge: true }
);
setMsg('✅ Modifications enregistrées.');
} catch (e) {
setMsg("❌ Impossible d'enregistrer. Réessaie.");
console.warn(e);
} finally {
setSaving(false);
setTimeout(() => setMsg(''), 3000);
}
};

// Lien de reset mot de passe
const handleChangePassword = async () => {
if (!email) return;
try {
await sendPasswordResetEmail(auth, email);
setMsg('📨 Email de réinitialisation envoyé.');
} catch (e) {
setMsg("❌ Envoi impossible. Vérifie l'email.");
console.warn(e);
} finally {
setTimeout(() => setMsg(''), 3500);
}
};

// Déconnexion
const handleLogout = async () => {
try {
await signOut(auth);
} catch (e) {
console.warn(e);
}
};

if (!user) {
return (
<div className="settings-container">
<h1>Paramètres</h1>
<p>Connecte-toi pour gérer ton profil.</p>
</div>
);
}

return (
<div className="settings-container">
<h1>Paramètres</h1>
<p>Personnalisez votre expérience</p>

<div className="profile-card">
<div style={{ marginBottom: 12, color: '#555', fontWeight: 600 }}>Profil</div>

<input
type="email"
value={email}
readOnly
placeholder="Adresse e-mail"
aria-label="Adresse e-mail"
/>

<input
type="text"
value={displayName}
onChange={(e) => setDisplayName(e.target.value)}
placeholder="Ex. Grégoire"
aria-label="Nom à afficher"
/>

<div className="actions">
<button onClick={handleSave} disabled={saving}>
{saving ? 'Sauvegarde…' : 'Enregistrer'}
</button>
<button className="secondary" type="button" onClick={handleChangePassword}>
Modifier le mot de passe
</button>
</div>

{msg ? (
<div style={{ marginTop: 10, fontSize: 13, color: msg.startsWith('✅') || msg.startsWith('📨') ? '#065f46' : '#b91c1c' }}>
{msg}
</div>
) : null}
</div>

<div className="support-card">
<div style={{ marginBottom: 8, color: '#555', fontWeight: 600 }}>Support</div>
<a href="/settings/faq">Aide et FAQ</a>
<a href="/settings/privacy">Confidentialité</a>
<a href="mailto:contact@monfrigo.app">Nous contacter</a>
</div>

<div className="logout-card">
<button type="button" onClick={handleLogout}>Se déconnecter</button>
</div>
</div>
);
}
