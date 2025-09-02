import Link from "next/link";

export const metadata = {
title: "Mentions légales – MonFrigo.dev",
description: "Mentions légales de l'application MonFrigo.dev (éditeur, hébergeur, contact).",
};

export default function MentionsPage() {
return (
<main style={{maxWidth: 820, margin: "40px auto", padding: "0 16px", lineHeight: 1.65}}>
<h1 style={{fontSize: "2rem", marginBottom: 10}}>Mentions légales</h1>
<p style={{opacity: .7, marginBottom: 24}}>Dernière mise à jour : 2 septembre 2025</p>

<section style={{marginBottom: 28}}>
<h2 style={{fontSize: "1.25rem", marginBottom: 8}}>Éditeur</h2>
<p>
<strong>MonFrigo.dev</strong> est un service édité par <strong>GregDev</strong> (entreprise individuelle).<br />
<strong>Adresse :</strong> 108 bis cours Saint-Louis, Appartement 4, Bâtiment G1, 33300 Bordeaux, France<br />
<strong>SIRET :</strong> 989 527 809 00010<br />
<strong>Téléphone :</strong> 06 58 93 67 88<br />
<strong>Email :</strong> <a href="mailto:contact@gregdev.co">contact@gregdev.co</a>
</p>
</section>

<section style={{marginBottom: 28}}>
<h2 style={{fontSize: "1.25rem", marginBottom: 8}}>Hébergement</h2>
<p>
L’application et le site sont hébergés par <strong>Vercel Inc.</strong><br />
340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
</p>
</section>

<section style={{marginBottom: 28}}>
<h2 style={{fontSize: "1.25rem", marginBottom: 8}}>Propriété intellectuelle</h2>
<p>
Les contenus (textes, interfaces, code et éléments graphiques) sont protégés par le droit d’auteur.
Toute reproduction ou utilisation non autorisée est interdite sans accord préalable.
</p>
</section>

<section style={{marginBottom: 28}}>
<h2 style={{fontSize: "1.25rem", marginBottom: 8}}>Contact</h2>
<p>
Pour toute question, écrivez-nous à <a href="mailto:contact@gregdev.co">contact@gregdev.co</a>.
</p>
</section>

<p style={{marginTop: 24}}>
<Link href="/privacy">Lire la politique de confidentialité →</Link>
</p>
</main>
);
}
