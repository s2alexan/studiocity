import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';

export interface FirebaseServices {
  app: FirebaseApp;
  db: Firestore;
  functions: Functions;
}

let services: FirebaseServices | undefined;

const fallbackConfig = {
  apiKey: 'AIzaSyAWLLfnpfStFLOvTrhLH89Z_jHhBNIj0ck',
  authDomain: 'studiocity-f56c1.firebaseapp.com',
  projectId: 'studiocity-f56c1',
  storageBucket: 'studiocity-f56c1.firebasestorage.app',
  messagingSenderId: '541528776492',
  appId: '1:541528776492:web:e262f9c0f44c4b2d0e1689',
  measurementId: 'G-8Q2XTSLR0S',
};

export function getFirebaseServices(): FirebaseServices {
  if (services) {
    return services;
  }

  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? fallbackConfig.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? fallbackConfig.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? fallbackConfig.projectId,
    storageBucket:
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? fallbackConfig.storageBucket,
    messagingSenderId:
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ??
      fallbackConfig.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? fallbackConfig.appId,
    measurementId:
      import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? fallbackConfig.measurementId,
  });

  const db = getFirestore(app);
  const functions = getFunctions(app);

  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  }

  services = { app, db, functions };
  return services;
}
