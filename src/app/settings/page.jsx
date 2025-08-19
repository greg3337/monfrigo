'use client';

import React, { useState } from 'react';
import './settings.css';

// (optionnel) branchement Firebase pour se déconnecter
// ajuste le chemin si besoin : le dossier "firebase" est au même niveau que "settings"
import { auth } from '../firebase/firebase-config';
import { signOut } from 'firebase/auth';

export default function SettingsPage() {
const [notifyExpiry, setNotifyExpiry] = useState(false);
const [notifySound, setNotifySound] = useState(false);

const handleSignOut = async () => {
try {
await signOut(auth);
// on laisse Next.js rediriger via ton guard d'auth (ou affiche un toast)
alert('Déconnexion réussie.');
} catch (e) {
console.error(e);
alert("Impossible de se déconnecter.");
}
};

// placeholder : à brancher plus tard (suppression du compte = reauth + delete)
const handleDeleteAccount = () => {
alert("Suppression du compte : à confirmer/brancher plus tard.");
};

return (
<div className="settings wrap">
<header className="settingsHeader">
<div className="brandIcon">⚙️</div>
<div>
<h1 className="brandTitle">Paramètres</h1>
<p className="brandSub">Personnalisez votre expérience</p>
</div>
</header>

{/* Profil */}
<section className="block">
<h2 className="blockTitle">Profil</h2>
<div className="card">
<div className="row">
<div className="rowLabel">Nom</div>
<div className="rowValue">gregpeli</div>
</div>
<div className="row">
<div className="rowLabel">Email</div>
<div className="rowValue">
<a href="mailto:gregpeli@yahoo.fr">gregpeli@yahoo.fr</a>
</div>
</div>
<div className="actions">
<button className="btn">Modifier</button>
</div>
</div>
</section>

{/* Notifications */}
<section className="block">
<h2 className="blockTitle">Notifications</h2>
<div className="card">
<label className="toggle">
<input
type="checkbox"
checked={notifyExpiry}
onChange={() => setNotifyExpiry(v => !v)}
/>
<span>
<strong>Notifications d'expiration</strong>
<small>Recevoir des alertes pour les produits qui expirent</small>
</span>
</label>

<label className="toggle">
<input
type="checkbox"
checked={notifySound}
onChange={() => setNotifySound(v => !v)}
/>
<span>
<strong>Son des notifications</strong>
<small>Jouer un son lors des notifications</small>
</span>
</label>

<button className="btnGhost">Diagnostiquer les notifications</button>
</div>
</section>

{/* Support */}
<section className="block">
<h2 className="blockTitle">Support</h2>
<div className="card list">
<a className="listItem" href="#" role="button">❓ Aide et FAQ</a>
<a className="listItem" href="mailto:support@monfrigo.dev" role="button">📩 Nous contacter</a>
<a className="listItem" href="#" role="button">🔒 Confidentialité</a>
</div>
</section>

{/* Compte */}
<section className="block">
<div className="card">
<div className="stack">
<button className="btn" onClick={handleSignOut}>Se déconnecter</button>
<button className="btnDanger" onClick={handleDeleteAccount}>Supprimer mon compte</button>
</div>
</div>
</section>
</div>
);
}
