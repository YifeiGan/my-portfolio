// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚠️ 这里替换成你自己在 Firebase Console -> 项目设置里看到的配置
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 防止 Next.js 热重载时重复初始化 Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 导出数据库和存储实例，供你的 SyncTool 使用
export const db = getFirestore(app);
export const storage = getStorage(app);