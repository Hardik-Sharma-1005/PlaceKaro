import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAtotMhuXydAcUeMUw25dE2-mGoVWkFc4M",
  authDomain: "placekaro.firebaseapp.com",
  projectId: "placekaro",
  storageBucket: "placekaro.firebasestorage.app",
  messagingSenderId: "145724023390",
  appId: "1:145724023390:web:b7c662187b559551b64acf",
};

export const app = initializeApp(firebaseConfig);