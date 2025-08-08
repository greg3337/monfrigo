'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import  useAuth  from '../hooks/useAuth';

export default function SuccessPage() {
const router = useRouter();
const searchParams = useSearchParams();
const user = useAuth();

useEffect(() => {
const run = async () => {
try {
// 1) On récupère l'uid prioritairement depuis Stripe (client_reference_id),
// sinon on utilise l'utilisateur connecté.
const uidFromStripe = searchParams.get('client_reference_id');
const uid = uidFromStripe || (user && user.uid);

if (!uid) return; // on attend que l'info arrive (Stripe ou auth)

// 2) Mise à jour Firestore
await updateDoc(doc(db, 'users', uid), { isSubscribed: true });

// 3) Redirection vers le tableau de bord
router.replace('/app');
} catch (err) {
console.error('Erreur lors de la MAJ abonnement :', err);
}
};

run();
}, [searchParams, user, router]);

return (
<div style={{ textAlign: 'center', marginTop: 60 }}>
<h1>Merci pour votre abonnement 🎉</h1>
<p>Nous finalisons la configuration… redirection en cours.</p>
</div>
);
}