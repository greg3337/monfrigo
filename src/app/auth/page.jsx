"use client";

import React, { useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 🔧 Initialisation Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔐 Codes de configuration
const PARTNER_CODE =
process.env.NEXT_PUBLIC_PARTNER_CODE_CCAS || "CCAS-TESTEDEBUCH-2025";
const STRIPE_LINK =
process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ||
"https://buy.stripe.com/5kQdR8b9w1Xn6rd7903cc02";

export default function AuthPage() {
const [mode, setMode] = useState("signup");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [promoCode, setPromoCode] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// 🔸 Création de compte
const handleSignup = async () => {
setError(null);
setLoading(true);
try {
const cred = await createUserWithEmailAndPassword(auth, email, password);
const uid = cred.user.uid;
const hasFreeAccess = promoCode.trim() === PARTNER_CODE;

await setDoc(
doc(db, "users", uid),
{
uid,
email,
createdAt: Date.now(),
isSubscribed: hasFreeAccess,
plan: hasFreeAccess ? "Accès CCAS Gratuit" : "Aucun",
promoCode: hasFreeAccess ? promoCode.trim() : null,
},
{ merge: true }
);

if (!hasFreeAccess) {
window.location.href = STRIPE_LINK; // paiement Stripe
return;
}

alert("✅ Accès gratuit CCAS activé !");
window.location.href = "/";
} catch (e) {
setError(e?.message || "Erreur lors de l'inscription.");
} finally {
setLoading(false);
}
};

// 🔹 Connexion
const handleSignin = async () => {
setError(null);
setLoading(true);
try {
const cred = await signInWithEmailAndPassword(auth, email, password);
const uid = cred.user.uid;
const snap = await getDoc(doc(db, "users", uid));
const data = snap.exists() ? snap.data() : {};
const isSubscribed = !!data?.isSubscribed;

if (!isSubscribed) {
window.location.href = STRIPE_LINK; // redirection paiement
return;
}

alert("👋 Connexion réussie !");
window.location.href = "/";
} catch (e) {
setError(e?.message || "Erreur de connexion.");
} finally {
setLoading(false);
}
};

return (
<div
style={{
maxWidth: 420,
margin: "80px auto",
padding: 24,
border: "1px solid #eee",
borderRadius: 12,
boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
}}
>
<h2 style={{ textAlign: "center" }}>
{mode === "signup" ? "Créer un compte" : "Se connecter"}
</h2>

<input
type="email"
placeholder="Adresse e-mail"
value={email}
onChange={(e) => setEmail(e.target.value)}
style={{
width: "100%",
padding: 10,
marginTop: 10,
borderRadius: 8,
border: "1px solid #ccc",
}}
/>

<input
type="password"
placeholder="Mot de passe"
value={password}
onChange={(e) => setPassword(e.target.value)}
style={{
width: "100%",
padding: 10,
marginTop: 10,
borderRadius: 8,
border: "1px solid #ccc",
}}
/>

{mode === "signup" && (
<>
<input
type="text"
placeholder="Code partenaire (optionnel)"
value={promoCode}
onChange={(e) => setPromoCode(e.target.value)}
style={{
width: "100%",
padding: 10,
marginTop: 10,
borderRadius: 8,
border: "1px solid #ccc",
}}
/>
<small style={{ color: "#666" }}>
Entrez le code partenaire (ex : {PARTNER_CODE}) pour un accès
gratuit.
</small>
</>
)}

{error && <p style={{ color: "crimson", marginTop: 10 }}>{error}</p>}

<button
onClick={mode === "signup" ? handleSignup : handleSignin}
disabled={loading}
style={{
width: "100%",
padding: 12,
marginTop: 16,
background: "#0ea5e9",
color: "#fff",
border: "none",
borderRadius: 8,
fontWeight: 600,
}}
>
{loading
? "Veuillez patienter..."
: mode === "signup"
? "Créer mon compte"
: "Se connecter"}
</button>

<p style={{ textAlign: "center", marginTop: 14 }}>
{mode === "signup" ? (
<>
Déjà un compte ?{" "}
<a
href="#"
onClick={(e) => {
e.preventDefault();
setMode("signin");
}}
>
Se connecter
</a>
</>
) : (
<>
Pas encore de compte ?{" "}
<a
href="#"
onClick={(e) => {
e.preventDefault();
setMode("signup");
}}
>
S’inscrire
</a>
</>
)}
</p>
</div>
);
}