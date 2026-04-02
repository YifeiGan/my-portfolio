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
    const [isMobile, setIsMobile] = useState(false);

    const targetRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [scrollRange, setScrollRange] = useState(0);
    const [dynamicScale, setDynamicScale] = useState(1.5);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

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

            // --- 使用 offset 属性代替 getBoundingClientRect 和 scrollWidth ---
            // offsetWidth 获取元素的原始物理宽度，不受 scale 影响
            const lastWidth = lastEl.offsetWidth;
            // offsetLeft 获取元素左侧相对于父容器的固定距离
            const lastOffsetLeft = lastEl.offsetLeft;

            const maxScroll = (lastOffsetLeft + lastWidth / 2) - (window.innerWidth / 2);

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
        ...(isMobile ? {} : { target: targetRef }),
        offset: ["start start", "end end"]
    });

    // const springConfig = { stiffness: 200, damping: 40, restDelta: 0.001 };
    // const smoothScrollY = useSpring(scrollYProgress, springConfig);

    // ========== 💡 动画映射 ==========
    // 0 到 0.75：横向滚动画廊，将最后一张照片拉到屏幕中央
    const translateX = useTransform(scrollYProgress, [0, 0.75], [0, -scrollRange]);

    // 0.75 到 1.0：对最后一张照片进行物理放大，并偏移制造“放大到死角”的效果
    const lastPhotoScale = useTransform(scrollYProgress, [0.75, 1], [1, dynamicScale]);
    const lastPhotoX = useTransform(scrollYProgress, [0.75, 1.0], ["0vw", "0vw"]); // 取消左右偏移
    const lastPhotoY = useTransform(scrollYProgress, [0.75, 1.0], ["0vh", "0vh"]); // 取消上下偏移

    // 隐藏最后一张照片底部的一句话
    const lastTextOpacity = useTransform(scrollYProgress, [0.75, 0.8], [1, 0]);

    // 全局暗色遮罩和最终文字的淡入
    const maskOpacity = useTransform(scrollYProgress, [0.75, 1.0], [0, 0.5]); // 控制背景有多暗
    const finalContentOpacity = useTransform(scrollYProgress, [0.85, 1.0], [0, 1]);
    const finalContentY = useTransform(scrollYProgress, [0.85, 1.0], [30, 0]);

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

            {/* ==================== 手机端布局：垂直瀑布流 ==================== */}
            {isMobile && heroPhoto && (
                <>
                    <section className="relative w-full pt-16">
                        <Image
                            src={heroPhoto.url}
                            alt={heroPhoto.title || category}
                            width={0}
                            height={0}
                            sizes="100vw"
                            style={{ width: '100%', height: 'auto' }}
                            priority
                            onLoad={() => setIsHeroLoaded(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        {heroPhoto.oneLiner && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                                className="absolute bottom-4 left-0 w-full text-center text-gray-300 font-racing italic font-extralight tracking-widest text-sm px-6"
                            >
                                {heroPhoto.oneLiner}
                            </motion.p>
                        )}
                    </section>

                    <section className="px-4 pt-6 pb-20 space-y-6 bg-black/20 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/10">
                        {otherPhotos.map((photo) => (
                            <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="flex flex-col"
                            >
                                <Image
                                    src={photo.url}
                                    alt={photo.title || category}
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    style={{ width: '100%', height: 'auto' }}
                                    className="rounded-lg"
                                />
                                {photo.oneLiner && (
                                    <p className="text-xs font-racing text-gray-500 tracking-wider text-center mt-2">
                                        {photo.oneLiner}
                                    </p>
                                )}
                            </motion.div>
                        ))}
                        <div className="text-center pt-8 pb-4">
                            <p className="text-sm font-light uppercase tracking-[0.4em] text-gray-500">Fin.</p>
                        </div>
                    </section>
                </>
            )}

            {/* ==================== 桌面端布局：全屏 Hero + 横向滚动画廊 ==================== */}
            {!isMobile && heroPhoto && (
                <section className="sticky top-0 z-0 w-screen h-screen flex items-center justify-center overflow-hidden">
                    <Image
                        src={heroPhoto.url}
                        alt={heroPhoto.title || category}
                        fill
                        sizes="100vw"
                        className="object-cover object-center"
                        priority
                        onLoad={() => setIsHeroLoaded(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute left-[10vw] bottom-0.5 -translate-y-1/2 max-w-lg z-10 pointer-events-none">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                            className="text-6xl font-light uppercase tracking-[0.3em] mb-6 text-white"
                        >
                        </motion.h1>
                        {heroPhoto.oneLiner && (
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                                className="text-gray-300 font-racing italic font-extralight tracking-widest leading-relaxed text-base"
                            >
                                {heroPhoto.oneLiner}
                            </motion.p>
                        )}
                    </div>
                    <div className="absolute bottom-16 flex flex-col items-center animate-pulse opacity-70 z-10">
                        <p className="text-xs tracking-widest uppercase mb-4 font-light">Scroll down to explore</p>
                        <div className="w-[1px] h-16 bg-white" />
                    </div>
                </section>
            )}

            {!isMobile && (
                <section ref={targetRef} style={{ height: `${otherPhotos.length * 100 + 200}vh` }} className="relative z-10">
                    <div className="sticky top-0 h-screen w-screen overflow-hidden flex flex-col justify-center bg-black/20 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/10">

                        <motion.div
                            ref={carouselRef}
                            style={{ x: translateX }}
                            className="flex flex-row flex-nowrap h-[75vh] pl-[10vw] absolute inset-y-auto w-full"
                        >
                            {otherPhotos.map((photo, index) => {
                                const isLast = index === otherPhotos.length - 1;
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
                                                priority={true}
                                                onLoad={updateScrollRange}
                                            />
                                        </motion.div>
                                        <motion.div
                                            style={isLast ? { opacity: lastTextOpacity } : {}}
                                            className="w-full text-center mt-auto"
                                        >
                                            <p className="text-sm font-racing text-gray-400 tracking-wider">
                                                {photo.oneLiner}
                                            </p>
                                        </motion.div>
                                    </div>
                                );
                            })}
                        </motion.div>

                        {lastPhoto && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                                <motion.div
                                    className="absolute inset-0 bg-black"
                                    style={{ opacity: maskOpacity }}
                                />
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
            )}
        </div>
    );
}