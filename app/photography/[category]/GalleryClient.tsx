// app/photography/[category]/GalleryClient.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Photo {
    id: string;
    url: string;
    title?: string;
    category: string;
    oneLiner?: string;
    isHero?: boolean;
    createdAt?: any;
}

export default function GalleryClient({ category }: { category: string }) {
    const router = useRouter();
    const [heroPhoto, setHeroPhoto] = useState<Photo | null>(null);
    const [otherPhotos, setOtherPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isHeroLoaded, setIsHeroLoaded] = useState(false);

    const targetRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [scrollRange, setScrollRange] = useState(0);
    const [dynamicScale, setDynamicScale] = useState(1.5);

    const updateScrollRange = () => {
        if (carouselRef.current && carouselRef.current.lastElementChild) {
            const lastEl = carouselRef.current.lastElementChild as HTMLElement;

            // --- 自动计算缩放比例逻辑 ---
            const img = lastEl.querySelector('img');
            if (img && img.naturalWidth) {
                const screenRatio = window.innerWidth / window.innerHeight;
                const imgRatio = img.naturalWidth / img.naturalHeight;

                // 1 / 0.75 是因为图片现在占高度的 75%，要填满 100% 高度至少要 1.33 倍
                const scaleH = 1 / 0.75;
                const scaleW = screenRatio / (0.75 * imgRatio);

                // 取宽和高中较大的那个填充系数，并多加 0.1 作为安全余量防止露边
                setDynamicScale(Math.max(scaleH, scaleW) + 0.1);
            }
            const lastWidth = lastEl.getBoundingClientRect().width;

            const centerOffset = (window.innerWidth / 2) - (lastWidth / 2);
            const maxScroll = carouselRef.current.scrollWidth - centerOffset - lastWidth;

            setScrollRange(Math.max(0, maxScroll));
        }
    };

    useEffect(() => {
        updateScrollRange();
        window.addEventListener("resize", updateScrollRange);
        return () => window.removeEventListener("resize", updateScrollRange);
    }, [otherPhotos]);

    useEffect(() => {
        const fetchPhotos = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, "photos"),
                    where("category", "==", category),
                    orderBy("createdAt", "desc")
                );

                const querySnapshot = await getDocs(q);
                const allPhotos = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Photo[];

                const hero = allPhotos.find(p => p.isHero) || allPhotos[0];
                const others = allPhotos.filter(p => p.id !== hero?.id);

                setHeroPhoto(hero);
                setOtherPhotos(others);
            } catch (error) {
                console.error("Error fetching photos:", error);
            } finally {
                setLoading(false);
            }
        };

        if (category) fetchPhotos();
    }, [category]);

    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"]
    });

    const springConfig = { stiffness: 400, damping: 40, restDelta: 0.001 };
    const smoothScrollY = useSpring(scrollYProgress, springConfig);

    // ========== 💡 动画映射 ==========
    // 0 到 0.75：横向滚动画廊，将最后一张照片拉到屏幕中央
    const translateX = useTransform(smoothScrollY, [0, 0.75], [0, -scrollRange]);

    // 0.75 到 1.0：对最后一张照片进行物理放大，并偏移制造“放大到死角”的效果
    const lastPhotoScale = useTransform(smoothScrollY, [0.75, 1], [1, dynamicScale]);
    const lastPhotoX = useTransform(smoothScrollY, [0.75, 1.0], ["0vw", "0vw"]); // 取消左右偏移
    const lastPhotoY = useTransform(smoothScrollY, [0.75, 1.0], ["0vh", "0vh"]); // 取消上下偏移

    // 隐藏最后一张照片底部的一句话
    const lastTextOpacity = useTransform(smoothScrollY, [0.75, 0.8], [1, 0]);

    // 全局暗色遮罩和最终文字的淡入
    const maskOpacity = useTransform(smoothScrollY, [0.75, 1.0], [0, 0.5]); // 控制背景有多暗
    const finalContentOpacity = useTransform(smoothScrollY, [0.85, 1.0], [0, 1]);
    const finalContentY = useTransform(smoothScrollY, [0.85, 1.0], [30, 0]);

    const lastPhoto = otherPhotos[otherPhotos.length - 1];

    return (
        <div className="bg-black text-white min-h-screen">
            {/* ==================== 加载遮罩层 ==================== */}
            <AnimatePresence mode="wait">
                {(loading || (heroPhoto && !isHeroLoaded)) && (
                    <motion.div
                        key="gallery-loader"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black pointer-events-auto"
                    >
                        <div className="flex flex-col items-center">
                            <motion.h2
                                initial={{ opacity: 0.3 }}
                                animate={{ opacity: 1 }}
                                transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
                                className="text-white text-2xl font-light tracking-[0.5em] uppercase"
                            >
                                Loading
                            </motion.h2>
                            <div className="w-12 h-[1px] bg-white/20 mt-4 overflow-hidden relative">
                                <motion.div
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "100%" }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    className="absolute top-0 left-0 w-full h-full bg-white"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav className="fixed top-0 left-0 w-full z-[60] p-6 flex justify-between items-center bg-gradient-to-b from-black/30 to-transparent">
                <Link
                    href="/#photography"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs uppercase tracking-[0.2em]">Back</span>
                </Link>
                <h1 className="text-xl font-light uppercase tracking-[0.5em] ml-[-40px]">
                    {category}
                </h1>
                <div className="w-10" />
            </nav>

            {heroPhoto && (
                <section className="relative w-screen h-screen flex items-center justify-center overflow-hidden">
                    <Image
                        src={heroPhoto.url}
                        alt={heroPhoto.title || category}
                        fill
                        sizes="100vw"
                        className="object-cover object-center"
                        priority
                        onLoad={() => setIsHeroLoaded(true)}
                    />

                    {/* 1. 添加一个从左到右的暗色渐变遮罩，确保左侧文字不会被过亮的图片背景吃掉 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent pointer-events-none" />

                    {/* 2. 文字内容容器：定位在左侧垂直居中 */}
                    <div className="absolute left-[8vw] md:left-[10vw] bottom-0.5 -translate-y-1/2 max-w-lg z-10 pointer-events-none">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                            className="text-4xl md:text-6xl font-light uppercase tracking-[0.3em] mb-6 text-white"
                        >
                        </motion.h1>

                        {heroPhoto.oneLiner && (
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                                className="text-gray-300 font-racing italic font-extralight tracking-widest leading-relaxed text-sm md:text-base"
                            >
                                {heroPhoto.oneLiner}
                            </motion.p>
                        )}
                    </div>

                    {/* 原有的向下滚动提示 */}
                    <div className="absolute bottom-16 flex flex-col items-center animate-pulse opacity-70 z-10">
                        <p className="text-xs tracking-widest uppercase mb-4 font-light">Scroll down to explore</p>
                        <div className="w-[1px] h-16 bg-white" />
                    </div>
                </section>
            )}

            <section ref={targetRef} style={{ height: `${otherPhotos.length * 60 + 200}vh` }} className="relative bg-[#3a3c45]">
                <div className="sticky top-0 h-screen w-screen overflow-hidden flex flex-col justify-center">

                    {/* 横向滚动画廊 */}
                    <motion.div
                        ref={carouselRef}
                        style={{ x: translateX }}
                        className="flex flex-row flex-nowrap h-[75vh] pl-[10vw] absolute inset-y-auto w-full"
                    >
                        {otherPhotos.map((photo, index) => {
                            const isLast = index === otherPhotos.length - 1;

                            // 只有最后一张照片挂载放大动画
                            const imgContainerStyle = isLast
                                ? { scale: lastPhotoScale, x: lastPhotoX, y: lastPhotoY }
                                : {};

                            return (
                                <div key={photo.id} className={`h-full flex-shrink-0 flex flex-col group w-max ${isLast ? 'z-10' : 'mr-[5vw]'}`}>
                                    <motion.div
                                        style={imgContainerStyle}
                                        className="overflow-hidden rounded-sm mb-[24px] h-[calc(75vh-40px)] relative"
                                    >
                                        <Image
                                            src={photo.url}
                                            alt={photo.title || category}
                                            width={0}
                                            height={0}
                                            sizes="100vh"
                                            style={{ width: 'auto', height: '100%' }}
                                            className="object-contain"
                                            onLoad={updateScrollRange}
                                        />
                                    </motion.div>

                                    {/* 底部文字 */}
                                    <motion.div
                                        style={isLast ? { opacity: lastTextOpacity } : {}}
                                        className="w-full text-center mt-auto"
                                    >
                                        <p className="text-sm font-racing text-gray-400 tracking-wider">
                                            {photo.oneLiner || "The ancient oak stands resilient against the wind."}
                                        </p>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </motion.div>

                    {/* ========== 独立出来的暗色遮罩与文字层 ========== */}
                    {lastPhoto && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                            {/* 纯粹的渐黑遮罩，盖在放大的照片上 */}
                            <motion.div
                                className="absolute inset-0 bg-black"
                                style={{ opacity: maskOpacity }}
                            />

                            {/* 浮现的文字 */}
                            <motion.div
                                className="relative z-30 pointer-events-auto flex flex-col items-center max-w-2xl px-8 text-center"
                                style={{ opacity: finalContentOpacity, y: finalContentY }}
                            >
                                <h2 className="text-2xl font-light uppercase tracking-[0.4em] mb-8 text-white">
                                    Fin.
                                </h2>
                                <p className="text-gray-300 font-light tracking-widest leading-loose">
                                    The end of the gallery. <br />
                                </p>
                            </motion.div>
                        </div>
                    )}

                </div>
            </section>
        </div>
    );
}