import "../privacy.css";

export default function PrivacyPage() {
return (
<div className="privacy-container">
<h1 className="privacy-title">Confidentialité</h1>
<p className="privacy-subtitle">Comment nous traitons vos données</p>

<div className="privacy-section">
<h2>Données collectées</h2>
<p>Nous collectons uniquement les données nécessaires :</p>
<ul>
<li>Nom, adresse email</li>
<li>Produits ajoutés, repas planifiés</li>
<li>Préférences (notifications, langue)</li>
</ul>
<div className="privacy-message success">
✅ Aucune donnée sensible (mot de passe, données bancaires) n’est collectée.
</div>
</div>

<div className="privacy-section">
<h2>Stockage et sécurité</h2>
<ul>
<li>Stockage local (vos données restent sur votre appareil)</li>
<li>Chiffrement : communications sécurisées (HTTPS)</li>
<li>Pas de serveur : aucune donnée envoyée ailleurs</li>
</ul>
<div className="privacy-message warning">
🔒 Vos données restent privées et sous votre contrôle.
</div>
</div>

<div className="privacy-section">
<h2>Utilisation des données</h2>
<ul>
<li>Fonctionnement de l’application (frigo & repas)</li>
<li>Notifications (si activées)</li>
<li>Amélioration des suggestions de repas</li>
</ul>
<div className="privacy-message error">
❌ Aucune donnée n’est vendue, partagée ou utilisée à des fins publicitaires.
</div>
</div>

<div className="privacy-section">
<h2>Vos droits</h2>
<ul>
<li>Consulter vos données</li>
<li>Modifier vos informations</li>
<li>Supprimer votre compte</li>
<li>Exporter vos données</li>
</ul>
<div className="privacy-message success">
✅ Exercez ces droits dans l’onglet Paramètres ou contactez-nous.
</div>
</div>

<div className="privacy-section">
<h2>Cookies</h2>
<p>Aucun cookie de tracking ou publicitaire n’est utilisé.</p>
</div>

<div className="privacy-section">
<h2>Contact</h2>
<p>Email : <a href="mailto:monfrigo@gmail.com">monfrigo@gmail.com</a></p>
<p>Réponse sous 48h maximum</p>
</div>

<p className="privacy-footer">Dernière mise à jour : août 2025</p>
</div>
);
}
