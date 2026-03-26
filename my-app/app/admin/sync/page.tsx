"use client";

import { useState } from "react";
import { storage, db } from "@/lib/firebase";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

export default function SyncTool() {
    const [logs, setLogs] = useState<string[]>([]);

    const syncFolder = async (folderName: string) => {
        const storageRef = ref(storage, folderName);

        // 1. 读取 Storage 文件夹下的所有文件
        const result = await listAll(storageRef);

        for (const item of result.items) {
            // 检查 Firestore 是否已经存在该路径的照片，防止重复
            const q = query(collection(db, "photos"), where("title", "==", item.name));
            const existing = await getDocs(q);

            if (existing.empty) {
                const url = await getDownloadURL(item);

                // 2. 这里的对象就是你的“字段模板”
                const newPhotoDoc = {
                    url: url,
                    category: folderName, // 自动根据文件夹归类
                    isCover: false,       // 默认非封面
                    order: 99,            // 默认排在最后
                    title: item.name,     // 文件名作为标题
                    createdAt: new Date()
                };

                // 3. 自动写入 Firestore
                await addDoc(collection(db, "photos"), newPhotoDoc);
                setLogs(prev => [...prev, `已同步: ${item.name}`]);
            } else {
                setLogs(prev => [...prev, `跳过(已存在): ${item.name}`]);
            }
        }
    };

    return (
        <div className="p-10 bg-white min-h-screen text-black">
            <h1 className="text-2xl font-bold mb-4">Firebase 自动同步工具</h1>
            <div className="space-x-4 mb-8">
                <button onClick={() => syncFolder("birds")} className="px-4 py-2 bg-blue-500 text-white rounded">
                    同步 Birds 文件夹
                </button>
                <button onClick={() => syncFolder("landscape")} className="px-4 py-2 bg-green-500 text-white rounded">
                    同步 Landscape 文件夹
                </button>
                <button onClick={() => syncFolder("street")} className="px-4 py-2 bg-orange-500 text-white rounded">
                    同步 Street 文件夹
                </button>
            </div>
            <div className="bg-gray-100 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
                {logs.map((log, i) => <p key={i}>{log}</p>)}
            </div>
        </div>
    );
}