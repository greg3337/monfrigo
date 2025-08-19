"use client";

import React from "react";
import "./settings.css";
import Link from "next/link";

export default function SettingsPage() {
return (
<div className="settings-container">
<h1>⚙️ Paramètres</h1>
<p className="subtitle">Personnalisez votre expérience</p>

{/* Profil */}
<section className="settings-section">
<h2>👤 Profil</h2>
<div className="settings-item">
<p><strong>gregpeli</strong></p>
<p>gregpeli@yahoo.fr</p>
<button className="btn-secondary">Modifier</button>
</div>
</section>

{/* Notifications */}
<section className="settings-section">
<h2>🔔 Notifications</h2>
<div className="settings-item">
<label>
<input type="checkbox" /> Notifications d’expiration
</label>
<small>Recevoir des alertes pour les produits qui expirent</small>
</div>
<div className="settings-item">
<label>
<input type="checkbox" /> Son des notifications
</label>
<small>Jouer un son lors des notifications</small>
</div>
<button className="btn-secondary">Diagnostiquer les notifications</button>
</section>

{/* Support */}
<section className="settings-section">
<h2>🛠 Support</h2>
<ul>
<li>Aide et FAQ</li>
<li>Nous contacter</li>
<li>Confidentialité</li>
</ul>
</section>

{/* Déconnexion / Suppression */}
<section className="settings-section danger-zone">
<button className="btn-secondary">Se déconnecter</button>
<button className="btn-danger">Supprimer mon compte</button>
</section>

{/* Navigation bas (tabbar) */}
<nav className="tabbar">
<Link href="/fridge" className="tabbar-item">🥶 Frigo</Link>
<Link href="/repas" className="tabbar-item">🍽 Repas</Link>
<Link href="/settings" className="tabbar-item active">⚙️ Paramètres</Link>
</nav>
</div>
);
}
