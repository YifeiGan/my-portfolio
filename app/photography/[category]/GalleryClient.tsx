// app/photography/[category]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChevronLeft, Loader2 } from "lucide-react";

interface Photo {
    id: string;
    url: string;
    title?: string;
    category: string;
    createdAt?: any;
}

export default function GalleryClient({ category }: { category: string }) {
    const router = useRouter();

    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPhotos = async () => {
            setLoading(true);
            try {
                // 查询当前分类下的所有照片
                const q = query(
                    collection(db, "photos"),
                    where("category", "==", category),
                    // 如果你有时间戳字段，可以开启排序
                    // orderBy("createdAt", "desc") 
                );

                const querySnapshot = await getDocs(q);
                const fetchedPhotos = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Photo[];

                setPhotos(fetchedPhotos);
            } catch (error) {
                console.error("Error fetching photos:", error);
            } finally {
                setLoading(false);
            }
        };

        if (category) fetchPhotos();
    }, [category]);

    return (
        <div className="min-h-screen bg-black text-white px-6 py-12 md:px-12">
            {/* 顶部导航 */}
            <nav className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-black/50 backdrop-blur-md">
                <button
                    onClick={() => router.push('/#photography')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs uppercase tracking-[0.2em]">Back</span>
                </button>
                <h1 className="text-xl font-light uppercase tracking-[0.5em] ml-[-40px]">
                    {category}
                </h1>
                <div className="w-10" /> {/* 占位平衡 */}
            </nav>

            {/* 照片展示区 */}
            <main className="mt-20">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-[60vh] flex flex-col items-center justify-center gap-4"
                        >
                            <Loader2 className="animate-spin text-gray-500" size={32} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4"
                        >
                            {photos.map((photo, index) => (
                                <motion.div
                                    key={photo.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative overflow-hidden rounded-sm group cursor-zoom-in"
                                >
                                    <Image
                                        src={photo.url}
                                        alt={photo.title || category}
                                        width={800}
                                        height={1200}
                                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    {/* 悬停信息遮罩 */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                        <p className="text-xs tracking-widest uppercase">{photo.title}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!loading && photos.length === 0 && (
                    <div className="text-center py-20 text-gray-500 tracking-widest uppercase text-sm">
                        No photos found in this gallery.
                    </div>
                )}
            </main>
        </div>
    );
}