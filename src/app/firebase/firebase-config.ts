import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
apiKey: "AIzaSyBjyN4XJDyFvt-QUd1BESDepOJqw1X1lxk", 
authDomain: "monfrigo-3ae11.firebaseapp.com",
projectId: "monfrigo-3ae11",  
storageBucket: "monfrigo-3ae11.firebasestorage.app", 
messagingSenderId: "1045422730422",  
appId: "1:1045422730422:web:5e66f2268869f842d30a17",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);