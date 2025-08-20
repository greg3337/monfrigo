'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FAQPage() {
const pathname = usePathname();

return (
<>
<div className="settings-container">
<header className="settings-header">
<div className="icon">❓</div>
<div>
<h1>Aide & FAQ</h1>
<p>Réponses rapides aux questions fréquentes</p>
</div>
</header>

<section className="settings-section">
<h2>Général</h2>
<details>
<summary>Comment ajouter un produit dans le frigo ?</summary>
<p>Depuis l’onglet <b>Frigo</b>, clique sur « Ajouter un produit », remplis les infos et valide.</p>
</details>
<details>
<summary>Comment planifier un repas ?</summary>
<p>Dans l’onglet <b>Repas</b>, clique sur « Ajouter un repas », choisis un jour, un créneau et les produits.</p>
</details>
<details>
<summary>Pourquoi un produit disparaît du frigo quand je l’utilise ?</summary>
<p>Quand tu planifies un repas avec des produits du frigo, ils sont retirés automatiquement pour éviter les doublons.</p>
</details>
</section>

<section className="settings-section">
<h2>Compte</h2>
<details>
<summary>Comment me déconnecter ?</summary>
<p>Dans <b>Paramètres</b> &gt; « Se déconnecter ».</p>
</details>
<details>
<summary>Comment supprimer mon compte ?</summary>
<p>Dans <b>Paramètres</b> &gt; « Supprimer mon compte ». (Action définitive.)</p>
</details>
</section>
</div>

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
