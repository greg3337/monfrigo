"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";

export default function LoginPage() {
const router = useRouter();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [err, setErr] = useState("");

async function handleLogin(e) {
e.preventDefault();
setErr("");

try {
const auth = getAuth();
await signInWithEmailAndPassword(auth, email, password);
router.push("/fridge"); // ✅ redirection une fois connecté
} catch (error) {
console.error(error);
setErr("Adresse email ou mot de passe incorrect.");
}
}

return (
<div style={{ maxWidth: 400, margin: "50px auto", padding: 20 }}>
<h1>Connexion</h1>
<form onSubmit={handleLogin}>
<label>Email</label>
<input
type="email"
placeholder="nom@exemple.com"
value={email}
onChange={(e) => setEmail(e.target.value)}
required
/>

<label>Mot de passe</label>
<input
type="password"
placeholder="••••••••"
value={password}
onChange={(e) => setPassword(e.target.value)}
required
/>

{err && <p style={{ color: "red" }}>{err}</p>}

<button type="submit">Se connecter</button>
</form>

<p style={{ marginTop: 14 }}>
Pas encore de compte ? <Link href="/signup">Créer un compte</Link>
</p>
</div>
);
}
