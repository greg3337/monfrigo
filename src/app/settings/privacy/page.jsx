"use client";

import Link from "next/link";
import "./privacy.css";

export default function PrivacyPage() {
return (
<main className="privacyPage">
<header className="privacyHeader">
<div className="privacyIcon">🛡️</div>
<div>
<h1>Confidentialité</h1>
<p className="subtitle">Comment nous traitons vos données</p>
</div>
</header>

{/* Données collectées */}
<section className="card">
<h2>📘 Données collectées</h2>
<p>
Nous collectons uniquement les informations nécessaires au
fonctionnement de l’application :
</p>
<ul>
<li>
<strong>Informations de compte</strong> : nom, adresse email
</li>
<li>
<strong>Données d’utilisation</strong> : produits ajoutés, repas
planifiés
</li>
<li>
<strong>Préférences</strong> : paramètres de notification, langue
</li>
</ul>
<p className="note ok">
✅ Aucune donnée sensible (mot de passe, données bancaires) n’est
collectée.
</p>
</section>

{/* Stockage & sécurité */}
<section className="card">
<h2>🔒 Stockage et sécurité</h2>
<ul>
<li>
<strong>Stockage local</strong> : vos données sont stockées sur
votre appareil.
</li>
<li>
<strong>Chiffrement</strong> : communications sécurisées (HTTPS).
</li>
<li>
<strong>Accès limité</strong> : seul vous avez accès à vos données.
</li>
<li>
<strong>Pas de serveur</strong> : aucune donnée envoyée sur nos
serveurs.
</li>
</ul>
<p className="note info">
🔐 Vos données restent privées et sous votre contrôle.
</p>
</section>

{/* Utilisation des données */}
<section className="card">
<h2>👁️ Utilisation des données</h2>
<p>Vos données sont utilisées exclusivement pour :</p>
<ul>
<li>Le fonctionnement de l’application (frigo, repas)</li>
<li>La personnalisation de votre expérience</li>
<li>L’envoi de notifications (si activées)</li>
<li>L’amélioration des suggestions de repas</li>
</ul>
<p className="note bad">
❌ Aucune donnée n’est vendue, partagée ou utilisée à des fins
publicitaires.
</p>
</section>

{/* Vos droits */}
<section className="card">
<h2>🧑‍⚖️ Vos droits</h2>
<p>Vous disposez des droits suivants :</p>
<ul>
<li>
<strong>Accès</strong> : consulter toutes vos données
</li>
<li>
<strong>Modification</strong> : corriger vos informations
</li>
<li>
<strong>Suppression</strong> : supprimer votre compte et vos données
</li>
<li>
<strong>Portabilité</strong> : exporter vos données
</li>
</ul>
<p className="note ok">
✅ Exercez ces droits directement dans l’app (onglet Paramètres) ou
contactez-nous.
</p>
</section>

{/* Cookies */}
<section className="card">
<h2>🍪 Cookies et technologies similaires</h2>
<p>Nous utilisons uniquement :</p>
<ul>
<li>
<strong>Stockage local</strong> : pour sauvegarder vos données
</li>
<li>
<strong>Cookies techniques</strong> : nécessaires au
fonctionnement de l’app
</li>
</ul>
<p className="note info">
🍪 Aucun cookie de tracking ou publicitaire n’est utilisé.
</p>
</section>

{/* Contact */}
<section className="card">
<h2>📧 Contact</h2>
<p>
Pour toute question concernant cette politique de confidentialité :
</p>
<p>
Email :{" "}
<a href="mailto:smonfrigo@gmail.com">smonfrigo@gmail.com</a>
<br />
Réponse : sous 48h maximum
</p>

<div className="actions">
<Link href="/settings" className="btnPrimary">
J’ai compris
</Link>
</div>
</section>

<p className="smallMuted">Dernière mise à jour : août 2025</p>
</main>
);
}
