// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚠️ 这里替换成你自己在 Firebase Console -> 项目设置里看到的配置
const firebaseConfig = {
    apiKey: "AIzaSyBrjcHBw9FcgH5F1mkIRqjLMB3DlomiakQ",
    authDomain: "yifei-portfolio-fbed4.firebaseapp.com",
    projectId: "yifei-portfolio-fbed4",
    storageBucket: "yifei-portfolio-fbed4.firebasestorage.app",
    messagingSenderId: "351339950661",
    appId: "1:351339950661:web:bea27f04e6c1d3ff89a92c",
    measurementId: "G-1VMWKSG567"
};

// 防止 Next.js 热重载时重复初始化 Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 导出数据库和存储实例，供你的 SyncTool 使用
export const db = getFirestore(app);
export const storage = getStorage(app);