'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import useAuth from '../hooks/useAuth';

function SuccessContent() {
const router = useRouter();
const searchParams = useSearchParams(); // on le garde si Stripe renvoie des params
const user = useAuth();

useEffect(() => {
const run = async () => {
try {
if (!user || !user.uid) return; // attendre l'auth
// Marquer l’abonnement comme actif
const userRef = doc(db, 'users', user.uid);
await updateDoc(userRef, { isSubscribed: true });
// Optionnel : lire des params si besoin
// const sessionId = searchParams.get('session_id');

// Redirection vers le dashboard
router.replace('/fridge');
} catch (err) {
console.error('Erreur lors de la MAJ abonnement :', err);
}
};
run();
}, [user, router, searchParams]);

return (
<div style={{ textAlign: 'center', marginTop: '60px' }}>
<h1>Merci pour votre abonnement 🎉</h1>
<p>Nous finalisons la configuration... redirection en cours.</p>
</div>
);
}

export default function SuccessPage() {
return (
<Suspense fallback={<div style={{ textAlign: 'center', marginTop: '60px' }}>Chargement...</div>}>
<SuccessContent />
</Suspense>
);
}
