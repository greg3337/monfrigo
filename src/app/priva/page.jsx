import Link from "next/link";

export const metadata = {
title: "Politique de confidentialité – MonFrigo.dev",
description:
"Politique de confidentialité de MonFrigo.dev : données collectées, usages, base légale, conservation, droits RGPD.",
};

export default function PrivacyPage() {
return (
<main style={{maxWidth: 820, margin: "40px auto", padding: "0 16px", lineHeight: 1.65}}>
<h1 style={{fontSize: "2rem", marginBottom: 10}}>Politique de confidentialité</h1>
<p style={{opacity: .7, marginBottom: 24}}>Dernière mise à jour : 2 septembre 2025</p>

<section style={{marginBottom: 24}}>
<p>
Cette politique explique comment <strong>MonFrigo.dev</strong> (édité par <strong>GregoDev</strong>)
collecte, utilise et protège vos données personnelles conformément au RGPD.
</p>
</section>

<section style={{marginBottom: 28}}>
<h2 style={{fontSize: "1.25rem", marginBottom: 8}}>1) Données que nous collectons</h2>
<ul style={{marginLeft: 18}}>
<li><strong>Compte :</strong> adresse e-mail et mot de passe (géré par Firebase Auth, jamais stocké en clair).</li>
<li><strong>Frigo :</strong> produits ajoutés, catégories, lieux (frigo/placard/congélo), dates d’expiration, statut (ok/urgent/expiré).</li>
<li><strong>Paiements :</strong> données d’abonnement traitées par <strong>Stripe</strong> (nous n’avons pas accès à votre numéro de carte).</li>
<li><strong>Notifications :</strong> jeton de notification (FCM) si vous les activez.</li>
<li><strong>Données techniques :</strong> logs techniques anonymisés pour sécuriser et améliorer le service.</li>
</ul>
</section>

<section style={{marginBottom: 28}}>
<h2 style={{fontSize: "1.25rem", marginBottom: 8}}>2) Finalités et base légale</h2>
<ul style={{marginLeft: 18}}>
<li>Fournir le service (authentification, sauvegarde de vos produits) — <em>exécution du contrat</em>.</li>
<li>Envoyer des alertes de péremption (si activées) — <em>intérêt légitime</em>/<em>consentement</em>.</li>
<li>Gérer l’abonnement et la facturation — <em>obligation contractuelle</em> (Stripe).</li>
<li>Améliorer l’app et la sécurité — <em>intérêt légitime</em>.</li>
</ul>
</section>

<section style={{marginBottom: 28}}>
<h2 style={{fontSize: "1.25rem", marginBottom: 8}}>3) Destinataires & sous-traitants</h2>
<ul style={{marginLeft: 18}}>
<li><strong>Firebase (Google)</strong> : authentification et base de données (Firestore).</li>
<li><strong>Vercel</strong> : hébergement de l’application.</li>
<li><strong>Stripe</strong> : paiements et facturation.</li>
</ul>
<p style={{marginTop: 8}}>
Vos données ne sont jamais revendues. Des transferts hors UE peuvent avoir lieu (ex. Firebase/Vercel/Stripe)
avec des garanties appropriées (clauses contractuelles types, etc.).
</p>
</section>

<section style={{marginBottom: 28}}>
<h2 style={{fontSize: "1.25rem", marginBottom: 8}}>4) Durées de conservation</h2>
<ul style={{marginLeft: 18}}>
<li>Données du compte : tant que le compte est actif.</li>
<li>Données du frigo : tant que vous les conservez ou jusqu’à suppression du compte.</li>
<li>Facturation : selon obligations légales (comptabilité).</li>
</ul>
</section>

<section style={{marginBottom: 28}}>
<h2 style={{fontSize: "1.25rem", marginBottom: 8}}>5) Vos droits</h2>
<p>Vous pouvez exercer à tout moment vos droits :</p>
<ul style={{marginLeft: 18}}>
<li><strong>Accès / rectification</strong> de vos données,</li>
<li><strong>Suppression</strong> du compte et des données,</li>
<li><strong>Portabilité</strong> (export de vos données),</li>
<li><strong>Opposition</strong> et <strong>limitation</strong> dans les conditions légales.</li>
</ul>
<p style={{marginTop: 8}}>
Contact : <a href="mailto:contact@gregdev.co">contact@gregdev.co</a>
</p>
</section>

<section style={{marginBottom: 28}}>
<h2 style={{fontSize: "1.25rem", marginBottom: 8}}>6) Sécurité</h2>
<p>
Nous utilisons Firebase/Firestore et Stripe pour stocker et traiter vos données de manière sécurisée
(chiffrement en transit, authentification, règles d’accès). Vous pouvez aussi activer les notifications
(FCM) : cela crée un jeton associé à votre appareil.
</p>
</section>

<section style={{marginBottom: 28}}>
<h2 style={{fontSize: "1.25rem", marginBottom: 8}}>7) Contact & réclamations</h2>
<p>
Pour toute question ou demande relative à vos données personnelles :{" "}
<a href="mailto:contact@gregdev.co">contact@gregdev.co</a>.
</p>
<p>
Vous pouvez également introduire une réclamation auprès de la CNIL (
<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr</a>).
</p>
</section>

<p style={{marginTop: 24}}>
<Link href="/mentions">Voir les mentions légales →</Link>
</p>
</main>
);
}
