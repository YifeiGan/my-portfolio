"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronRight, ChevronDown } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PortfolioPage() {
  const [covers, setCovers] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchCovers = async () => {
      const q = query(collection(db, "photos"), where("isCover", "==", true));
      const querySnapshot = await getDocs(q);
      const coverData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCovers(coverData);
    };
    fetchCovers();
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);

  // 监听容器在 X (水平) 和 Y (垂直) 轴上的滚动进度
  const { scrollXProgress, scrollYProgress } = useScroll({
    container: containerRef,
  });

  // ========== 水平滑动动画 (0 -> 1 代表向右滑到摄影页) ==========

  // 1. 蓝色天空色块逐渐变细直至消失 ( ScaleY 从 1 到 0 )，变透明消失
  const skyboxScaleY = useTransform(scrollXProgress, [0, 0.8], [1, 0]);
  const skyboxOpacity = useTransform(scrollXProgress, [0.5, 1], [1, 0]);

  // 2. 名字半透明，逐渐变浅消失 ( Z-0 底层固定层 )
  const nameOpacity = useTransform(scrollXProgress, [0, 0.5], [0.7, 0]); // 初始半透明

  // 3. 燕鸥破框飞走消失动画 ( Z-50 超顶层固定层 )
  // 燕鸥放大飞走 ( 放大至 5 倍，向右上方飞出 )
  const birdScale = useTransform(scrollXProgress, [0, 1], [1, 0.1]);
  const birdX = useTransform(scrollXProgress, [0, 1], ["20vw", "-100vw"]);
  const birdY_X = useTransform(scrollXProgress, [0, 1], ["-5vh", "-50vh"]);
  // 燕鸥透明度：飞出时变透明消失
  const birdOpacityX = useTransform(scrollXProgress, [0, 0.4], [1, 0]);


  // ========== 垂直滑动动画 (0 -> 1 代表向下滑到代码页) ==========

  // 向下滑动时，首页的元素整体向上移动并变透明
  const homeY = useTransform(scrollYProgress, [0, 1], ["0vh", "-50vh"]);

  // 燕鸥专用的垂直位移：向右上方移动
  // X轴：从初始位置向右飞出 100vw
  const birdX_Vertical = useTransform(scrollYProgress, [0, 1], ["0vw", "50vw"]);
  // Y轴：向上飞出屏幕 -100vh
  const birdY_Vertical = useTransform(scrollYProgress, [0, 1], ["0vh", "-100vh"]);
  const birdScale_Vertical = useTransform(scrollYProgress, [0, 1], [1, 0.1]);

  const homeOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <main
      ref={containerRef}
      // 开启 X 和 Y 轴双向滚动，隐藏原生滚动条，开启段落吸附 ( snap )
      className="w-screen h-screen overflow-auto snap-x snap-y snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[url('/background.png')] bg-cover bg-center"
    >
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400..900&family=Comfortaa:wght@300..700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=Stardos+Stencil:wght@400;700&display=swap" rel="stylesheet"
      />

      {/* ==================== 动态背景层 ( Z-0 & Z-10 ) - 固定不动 ==================== */}
      <motion.div
        style={{ y: homeY, opacity: homeOpacity }}
        className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center pointer-events-none z-0"
      >
        {/* Layer 1 (底): 你的名字 (半透明背景字) */}
        <motion.h1
          style={{
            opacity: nameOpacity,
            fontFamily: "'Bebas Neue', sans-serif",
            fontWeight: 700,              // 粗细 (400-700)
            backgroundImage: "url('/clouds.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          className="absolute bg-clip-text text-transparent text-7xl md:text-[25rem] select-none z-20"
        >
          Gan Yifei
        </motion.h1>

        {/* Layer 2: 蓝色天空色块 (伪边界盒子) - Z-10 */}
        {/* <motion.div
          style={{ scaleY: skyboxScaleY, opacity: skyboxOpacity }}
          className="absolute w-full h-[40vh] bg-[#4a6b8c] shadow-inner origin-center"
        /> */}
      </motion.div>


      {/* ==================== 燕鸥前景层 ( Z-50 极高，确保飞在所有东西之上 ) ==================== */}
      <motion.div
        style={{
          x: birdX_Vertical,
          y: birdY_Vertical,
          scale: birdScale_Vertical,
          opacity: homeOpacity
        }}
        className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center pointer-events-none z-50"
      >
        <motion.img
          src="/tern.png"
          alt="Arctic Tern"
          style={{
            scale: birdScale,
            x: birdX,
            y: birdY_X,
            opacity: birdOpacityX,
          }}
          className="w-[80%] md:w-[50%] h-auto origin-center"
        />
      </motion.div>


      {/* ==================== 2D 滚动内容画布 ( Z-20 ) - 滚动吸附点 ==================== */}
      <div className="relative w-[200vw] h-[200vh] pointer-events-none">

        {/* 1. 首页占位符 ( 0, 0 ) - 起始点，提供滚动吸附点和提示 */}
        <div className="absolute top-0 left-0 w-screen h-screen snap-center pointer-events-auto">
          {/* 右滑提示 (指向摄影页) */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center text-gray-400 animate-pulse">
            <p className="text-xs tracking-widest mr-2 uppercase">Photography</p>
            <ChevronRight size={24} />
          </div>
          {/* 下滑提示 (指向代码页) */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-gray-400 animate-pulse">
            <p className="text-xs tracking-widest mb-2 uppercase">Code</p>
            <ChevronDown size={24} />
          </div>
        </div>

        {/* 2. 摄影作品集 - 右滑到达：全屏蓝色调布局 */}
        <div className="absolute top-0 left-[100vw] w-screen h-screen flex snap-center pointer-events-auto overflow-hidden bg-black">

          {/* 左侧大列：包含 Birds 和 Street */}
          <motion.div
            layout
            className="flex flex-col h-full border-r border-white/10"
            style={{ flex: 1.6 }} // 保持你的初始权重
            whileHover={{ flex: 1.7 }} // 保持你的悬停权重
            transition={{ duration: 0.6, ease: [0.36, 1, 0.22, 1] }}
          >
            {/* 左上：Birds */}
            <motion.div
              layout
              className="relative w-full overflow-hidden cursor-pointer group border-b border-white/10"
              style={{ flex: 0.85 }}
              whileHover={{ flex: 1 }}
              transition={{ duration: 0.6, ease: "circOut" }}
              onClick={() => window.location.href = '/photography/birds'}
            >
              {covers.find(c => c.category === "birds") && (
                <img
                  src={covers.find(c => c.category === "birds").url}
                  alt="birds"
                  className="absolute inset-0 w-full h-full object-cover object-[50%_60%] group-hover:scale-105 transition-transform duration-1000"
                />
              )}

              {/* 💡 关键：蓝色调叠加层 (混合模式) */}
              <div className="absolute inset-0 bg-[#425567] mix-blend-color z-10 opacity-100 group-hover:opacity-0 transition-opacity duration-500" />

              {/* 💡 标题：默认显示，悬停隐藏 */}
              <div className="absolute inset-0 flex items-center justify-center text-white z-20 opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none">
                <h3 className="text-3xl md:text-5xl font-light uppercase tracking-[0.3em]">Birds</h3>
              </div>
            </motion.div>

            {/* 左下：Street */}
            <motion.div
              layout
              className="relative w-full overflow-hidden cursor-pointer group"
              style={{ flex: 1 }}
              whileHover={{ flex: 1.15 }}
              transition={{ duration: 0.6, ease: "circOut" }}
              onClick={() => window.location.href = '/photography/street'}
            >
              {covers.find(c => c.category === "street") && (
                <img
                  src={covers.find(c => c.category === "street").url}
                  alt="street"
                  className="absolute inset-0 w-full h-full object-cover object-[40%_80%] group-hover:scale-104 transition-transform duration-1000"
                />
              )}

              <div className="absolute inset-0 bg-[#425567] mix-blend-color z-10 opacity-100 group-hover:opacity-0 transition-opacity duration-500" />

              <div className="absolute inset-0 flex items-center justify-center text-white z-20 opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle,_rgba(0,0,0,0.3)_0%,_transparent_70%)]">
                <h3 className="text-3xl md:text-5xl font-light uppercase tracking-[0.3em]">Street</h3>
              </div>
            </motion.div>
          </motion.div>

          {/* 右侧大列：Landscape 独占 */}
          <motion.div
            layout
            className="relative h-full overflow-hidden cursor-pointer group"
            style={{ flex: 1 }} // 初始权重
            whileHover={{ flex: 1 }} // 悬停权重
            transition={{ duration: 0.6, ease: [0.36, 1, 0.22, 1] }}
            onClick={() => window.location.href = '/photography/landscape'}
          >
            {covers.find(c => c.category === "landscape") && (
              <img
                src={covers.find(c => c.category === "landscape").url}
                alt="landscape"
                className="absolute inset-0 w-full h-full object-cover object-[0%_100%] group-hover:scale-102 transition-transform duration-1000"
              />
            )}

            <div className="absolute inset-0 bg-[#425567] mix-blend-color z-10 opacity-100 group-hover:opacity-0 transition-opacity duration-500" />

            <div className="absolute inset-0 flex items-center justify-center text-white z-20 opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none">
              <h3 className="text-5xl md:text-4xl font-light uppercase tracking-[0.4em]">Landscape</h3>
            </div>
          </motion.div>

        </div>

        {/* 3. 代码部分 ( 0, 100vh ) - 下滑到达 ( Section 2 ) */}
        <div className="absolute top-[100vh] left-0 w-screen h-screen bg-gray-900 text-white flex flex-col items-center justify-center snap-center pointer-events-auto z-20 overflow-visible">
          {/* 此时燕鸥和天空整体向上飞出并变透明消失 */}
          <h2 className="text-4xl font-mono tracking-tighter text-gray-500">
            {"<Code />"}
          </h2>
          <p className="mt-4 text-gray-600">在此处放置垂直滚动的项目展示卡片 ( 留白 )</p>

          {/* 垂直滚动的占位符，模拟代码页“下滑下来就是完整页面”且无水平滑动的质感 */}
          <div className="mt-10 h-32 w-48 border border-gray-700/50 rounded-lg flex items-center justify-center text-gray-600 p-4">
            (垂直滚动的项目内容...)
          </div>
        </div>

        {/* ⚠️ 限制死角滚动：不放置 (100vw, 100vh) 的页面单元格，确保用户只能在这三个单元格之间移动 */}
      </div>
    </main>
  );
}