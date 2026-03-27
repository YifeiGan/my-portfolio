"use client";

import { useState, useEffect } from "react";
import { storage, db } from "@/lib/firebase";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import Image from "next/image";

// 定义照片数据接口
interface PhotoData {
    id: string;
    url: string;
    category: string;
    isCover: boolean;
    isHero?: boolean;
    order: number;
    title: string;
    oneLiner?: string;
}

export default function SyncTool() {
    const [logs, setLogs] = useState<string[]>([]);
    const [photos, setPhotos] = useState<PhotoData[]>([]);
    const [currentTab, setCurrentTab] = useState<string>("birds");

    // 用于控制编辑弹窗的状态
    const [editingPhoto, setEditingPhoto] = useState<PhotoData | null>(null);

    // 获取特定分类的照片以展示缩略图
    const loadPhotos = async (category: string) => {
        const q = query(collection(db, "photos"), where("category", "==", category));
        const snapshot = await getDocs(q);
        const fetchedPhotos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PhotoData[];
        setPhotos(fetchedPhotos);
    };

    // 切换分类标签时重新加载照片
    useEffect(() => {
        loadPhotos(currentTab);
    }, [currentTab]);

    const syncFolder = async (folderName: string) => {
        const storageRef = ref(storage, folderName);
        const result = await listAll(storageRef);

        for (const item of result.items) {
            const q = query(collection(db, "photos"), where("title", "==", item.name));
            const existing = await getDocs(q);

            if (existing.empty) {
                const url = await getDownloadURL(item);
                const newPhotoDoc = {
                    url: url,
                    category: folderName,
                    isCover: false,
                    isHero: false,
                    order: 99,
                    title: item.name,
                    oneLiner: "",
                    createdAt: new Date()
                };

                await addDoc(collection(db, "photos"), newPhotoDoc);
                setLogs(prev => [`已同步: ${item.name}`, ...prev]);
            } else {
                setLogs(prev => [`跳过(已存在): ${item.name}`, ...prev]);
            }
        }
        // 同步完成后刷新当前列表
        if (folderName === currentTab) loadPhotos(currentTab);
    };

    // 提交修改到 Firestore
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPhoto) return;

        try {
            const photoRef = doc(db, "photos", editingPhoto.id);
            // 剔除 id 字段后更新到数据库
            const { id, ...updateData } = editingPhoto;
            await updateDoc(photoRef, updateData);

            setLogs(prev => [`已更新字段: ${editingPhoto.title}`, ...prev]);
            setEditingPhoto(null); // 关闭弹窗
            loadPhotos(currentTab); // 刷新列表展示最新数据
        } catch (error) {
            console.error("更新失败", error);
            setLogs(prev => [`更新失败: ${error}`, ...prev]);
        }
    };

    return (
        <div className="p-10 bg-white min-h-screen text-black">
            <h1 className="text-2xl font-bold mb-4">Firebase 图库管理中心</h1>

            {/* 1. 同步控制区 */}
            <div className="space-x-4 mb-4">
                <button onClick={() => syncFolder("birds")} className="px-4 py-2 bg-blue-500 text-white rounded">同步 Birds</button>
                <button onClick={() => syncFolder("landscape")} className="px-4 py-2 bg-green-500 text-white rounded">同步 Landscape</button>
                <button onClick={() => syncFolder("street")} className="px-4 py-2 bg-orange-500 text-white rounded">同步 Street</button>
            </div>

            <div className="bg-gray-100 p-2 rounded h-32 overflow-y-auto font-mono text-xs mb-8">
                {logs.map((log, i) => <p key={i}>{log}</p>)}
            </div>

            {/* 2. 缩略图展示与管理区 */}
            <div className="border-t pt-8">
                <div className="flex space-x-4 mb-6">
                    {["birds", "landscape", "street"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setCurrentTab(tab)}
                            className={`px-4 py-1 rounded-full border ${currentTab === tab ? 'bg-black text-white' : 'bg-gray-200'}`}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* 照片网格 */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {photos.map(photo => (
                        <div
                            key={photo.id}
                            onClick={() => setEditingPhoto(photo)}
                            className="cursor-pointer group relative aspect-[2/3] bg-gray-100 overflow-hidden rounded shadow-sm hover:shadow-md transition-shadow"
                        >
                            <Image
                                src={photo.url}
                                alt={photo.title}
                                fill
                                sizes="20vw"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-sm">
                                点击编辑
                            </div>
                            {/* 状态徽章 */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {photo.isCover && <span className="bg-blue-500 text-white text-[10px] px-1 rounded">主页封面</span>}
                                {photo.isHero && <span className="bg-red-500 text-white text-[10px] px-1 rounded">分类头图</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. 编辑表单弹窗 (Modal) */}
            {editingPhoto && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">编辑照片属性</h2>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-500">文件名 (不可改)</label>
                                <input type="text" disabled value={editingPhoto.title || ""} className="w-full border p-2 rounded bg-gray-100" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">一句话介绍 (oneLiner)</label>
                                <textarea
                                    value={editingPhoto.oneLiner || ""}
                                    onChange={e => setEditingPhoto({ ...editingPhoto, oneLiner: e.target.value })}
                                    className="w-full border p-2 rounded h-20"
                                    placeholder="例如：The ancient oak stands resilient..."
                                />
                            </div>

                            <div className="flex gap-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={editingPhoto.isCover || false}
                                        onChange={e => setEditingPhoto({ ...editingPhoto, isCover: e.target.checked })}
                                    />
                                    <span>设为主页封面图</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={editingPhoto.isHero || false}
                                        onChange={e => setEditingPhoto({ ...editingPhoto, isHero: e.target.checked })}
                                    />
                                    <span>设为分类头图</span>
                                </label>
                            </div>

                            <div className="flex justify-end space-x-4 mt-6">
                                <button type="button" onClick={() => setEditingPhoto(null)} className="px-4 py-2 bg-gray-300 rounded">取消</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded">保存修改</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}