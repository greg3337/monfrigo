'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import "./privacy.css";

export default function PrivacyPage() {
const pathname = usePathname();

return (
<>
<div className="wrap legalPage">
<header className="brandHeader">
<div className="brandTitle">Confidentialité</div>
<div className="brandSub">Comment nous traitons vos données</div>
</header>

{/* ===== Données collectées ===== */}
<section className="card">
<h2>📦 Données collectées</h2>
<p>Nous collectons uniquement les données nécessaires au fonctionnement de l’application :</p>
<ul>
<li><b>Informations de compte</b> : nom, adresse e-mail.</li>
<li><b>Données d’utilisation</b> : produits ajoutés au frigo, repas planifiés.</li>
<li><b>Préférences</b> : paramètres de notification, langue.</li>
</ul>
<div className="note ok">
✅ Aucune donnée sensible (mots de passe en clair, données bancaires) n’est collectée.
</div>
</section>

{/* ===== Stockage & sécurité ===== */}
<section className="card">
<h2>🔐 Stockage et sécurité</h2>
<ul>
<li><b>Stockage local</b> : une partie des réglages est stockée sur votre appareil.</li>
<li><b>Chiffrement</b> : toutes les communications sont sécurisées (HTTPS).</li>
<li><b>Accès limité</b> : votre contenu est associé à votre compte ; vous seul y avez accès.</li>
<li><b>Pas de revente</b> : vos données ne sont pas revendues ni utilisées à des fins publicitaires.</li>
</ul>
<div className="note info">
🔒 Vos données restent privées et sous votre contrôle.
</div>
</section>

{/* ===== Utilisation ===== */}
<section className="card">
<h2>🎯 Utilisation des données</h2>
<p>Vos données sont utilisées exclusivement pour :</p>
<ul>
<li>Le fonctionnement de l’application (gestion du frigo et des repas).</li>
<li>La personnalisation de votre expérience (préférences, langue).</li>
<li>L’envoi de notifications (si vous les avez activées).</li>
<li>L’amélioration des suggestions de repas (statistiques anonymisées).</li>
</ul>
<div className="note bad">
❌ Aucune donnée n’est vendue, partagée ou utilisée pour de la publicité.
</div>
</section>

{/* ===== Droits ===== */}
<section className="card">
<h2>🧭 Vos droits</h2>
<p>Vous disposez des droits suivants :</p>
<ul>
<li><b>Accès</b> : consulter vos données.</li>
<li><b>Modification</b> : corriger vos informations.</li>
<li><b>Suppression</b> : supprimer votre compte et toutes vos données.</li>
<li><b>Portabilité</b> : exporter vos données sur demande.</li>
</ul>
<div className="note ok">
✅ Exercez ces droits directement dans <Link href="/settings">Paramètres</Link> (sections “Profil” et “Supprimer mon compte”)
ou contactez-nous.
</div>
</section>

{/* ===== Cookies ===== */}
<section className="card">
<h2>🍪 Cookies et technologies similaires</h2>
<p>Nous utilisons uniquement :</p>
<ul>
<li><b>Stockage local</b> pour sauvegarder certaines préférences.</li>
<li><b>Cookies techniques</b> nécessaires au fonctionnement de l’app.</li>
</ul>
<div className="note info">
🍪 Aucun cookie de tracking ou publicitaire.
</div>
</section>

{/* ===== Contact ===== */}
<section className="card">
<h2>📬 Contact</h2>
<p>
Pour toute question concernant cette politique de confidentialité&nbsp;:
</p>
<p><b>Email</b> : <a href="mailto:smonfrigo@gmail.com">smonfrigo@gmail.com</a><br />
<b>Réponse</b> : sous 48h maximum
</p>
<p style={{marginTop: 12}}>
<Link className="btn" href="/settings">⬅️ Retour aux paramètres</Link>
</p>
</section>

<p className="legalSmall">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
</div>

{/* ===== Tabbar ===== */}
<nav className="tabbar" role="navigation" aria-label="Navigation principale">
<Link href="/fridge" className={`tab ${pathname?.startsWith('/fridge') ? 'is-active' : ''}`}>
<span className="tab_icon">🧊</span>
<span className="tab_label">Frigo</span>
</Link>
<Link href="/repas" className={`tab ${pathname?.startsWith('/repas') ? 'is-active' : ''}`}>
<span className="tab_icon">🍽️</span>
<span className="tab_label">Repas</span>
</Link>
<Link href="/settings" className={`tab ${pathname?.startsWith('/settings') ? 'is-active' : ''}`}>
<span className="tab_icon">⚙️</span>
<span className="tab_label">Paramètres</span>
</Link>
</nav>
</>
);
}
