"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Star, GitFork } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const GithubIcon = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function PortfolioPage() {
  const [covers, setCovers] = React.useState<any[]>([]);

  // 加载状态控制
  const [isLoading, setIsLoading] = useState(true);
  const [pinnedProjects, setPinnedProjects] = useState<any[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  // 综合处理数据获取与 Loading 状态（包含缓存处理与兜底机制）
  // 2. 解绑请求与定时器
  useEffect(() => {
    let isMounted = true;
    const isReturning = window.location.hash === '#photography';

    // 如果是带有 hash 返回，直接取消 Loading 并瞬间定位；否则正常显示 Loading
    if (isReturning) {
      setIsLoading(false);
      setTimeout(() => {
        containerRef.current?.scrollTo({
          left: window.innerWidth,
          top: 0,
          behavior: 'instant'
        });
      }, 50);
    } else {
      setIsLoading(true);
    }

    const fetchData = async () => {
      try {
        const q = query(collection(db, "photos"), where("isCover", "==", true));
        const querySnapshot = await getDocs(q);
        if (isMounted) {
          setCovers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        }
      } catch (error) {
        console.error("Failed to fetch covers:", error);
      }
    };

    fetchData();

    let loadingTimer: NodeJS.Timeout;

    if (!isReturning) {
      loadingTimer = setTimeout(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      }, 1500);
    }

    return () => {
      isMounted = false;
      clearTimeout(loadingTimer);
    };
  }, [pathname]);

  useEffect(() => {
    // 必须使用 "Owner/Repo" 的格式，请将 YifeiGan 替换为实际拥有该仓库的组织或用户名
    const pinnedRepoPaths = [
      "No-RAGrets-Research/baseline-model",
      "No-RAGrets-Research/llm_paper_reviewer",
      "No-RAGrets-Research/llm_to_knowledge_graph",
      "No-RAGrets-Research/SciBERT_Training"
    ];

    Promise.all(
      pinnedRepoPaths.map(repoPath =>
        fetch(`https://api.github.com/repos/${repoPath}`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch ${repoPath}`);
            return res.json();
          })
      )
    )
      .then(data => {
        const finalProjects = data.map((item: any) => ({
          repo: item.name,
          link: item.html_url,
          description: item.description || "No description provided.",
          language: item.language,
          languageColor: item.language === "Python" ? "#3572A5" : item.language === "Jupyter Notebook" ? "#DA5B0B" : "#8b949e",
          stars: item.stargazers_count,
          forks: item.forks_count,
        }));

        setPinnedProjects(finalProjects);
      })
      .catch((error) => {
        console.error("Failed to fetch GitHub projects:", error);
        setPinnedProjects([
          {
            repo: "baseline-model",
            link: "https://github.com/No-RAGrets-Research/baseline-model",
            description: "No-RAGrets-Research baseline model",
            language: "Python",
            languageColor: "#3572A5",
            stars: 0,
            forks: 0
          }
        ]);
      });
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  // 动态锁定次要滚动轴，防止进入右下角死区
  const handleScrollLock = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollLeft } = containerRef.current;

    // 设定一个 20px 的容差范围。在起点附近时，允许用户向任意方向启动滑动
    if (scrollLeft < 20 && scrollTop < 20) {
      containerRef.current.style.overflowX = 'auto';
      containerRef.current.style.overflowY = 'auto';
    }
    // 如果水平滑动进度大于垂直进度，说明用户选择了“向右滑”
    else if (scrollLeft > scrollTop) {
      containerRef.current.style.overflowY = 'hidden'; // 锁死垂直方向
      containerRef.current.style.overflowX = 'auto';
    }
    // 反之，说明用户选择了“向下滑”
    else {
      containerRef.current.style.overflowX = 'hidden'; // 锁死水平方向
      containerRef.current.style.overflowY = 'auto';
    }
  };

  const scrollToPhotography = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: window.innerWidth, // 滚动距离为屏幕宽度 (100vw)
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const scrollToCode = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: window.innerHeight, // 滚动距离为屏幕高度 (100vh)
        left: 0,
        behavior: 'smooth'
      });
    }
  };

  const scrollToHome = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: 0,
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  // 监听容器在 X (水平) 和 Y (垂直) 轴上的滚动进度
  const { scrollXProgress, scrollYProgress } = useScroll({
    container: containerRef,
  });

  // ========== 使用 useSpring 缓冲滚动吸附导致的数值突变 ==========
  const springConfig = { stiffness: 400, damping: 40, restDelta: 0.001 };
  const smoothScrollX = useSpring(scrollXProgress, springConfig);
  const smoothScrollY = useSpring(scrollYProgress, springConfig);

  // ========== 水平滑动动画 (0 -> 1 代表向右滑到摄影页) ==========、

  // 1. 名字半透明，逐渐变浅消失 ( Z-0 底层固定层 )
  const nameOpacity = useTransform(smoothScrollX, [0, 0.4, 1], [0.7, 0, 0]);
  const nameVisibility = useTransform(smoothScrollX, [0.4, 0.41], ["visible", "hidden"]);

  // 2. 燕鸥破框飞走消失动画 ( Z-50 超顶层固定层 )
  // 燕鸥放大飞走 ( 向右上方飞出 )
  const birdScale = useTransform(smoothScrollX, [0, 1], [1, 0.1]);
  const birdX = useTransform(smoothScrollX, [0, 1], ["20vw", "-100vw"]);
  const birdY_X = useTransform(smoothScrollX, [0, 1], ["-5vh", "-50vh"]);
  // 燕鸥透明度：飞出时变透明消失
  const birdOpacityX = useTransform(smoothScrollX, [0, 0.4], [1, 0]);


  // ========== 垂直滑动动画 (0 -> 1 代表向下滑到代码页) ==========

  // 向下滑动时，首页的元素整体向上移动并变透明
  const homeY = useTransform(smoothScrollY, [0, 1], ["0vh", "-50vh"]);

  // 燕鸥专用的垂直位移：向右上方移动
  // X轴：从初始位置向右飞出 100vw
  const birdX_Vertical = useTransform(smoothScrollY, [0, 1], ["0vw", "50vw"]);
  // Y轴：向上飞出屏幕 -100vh
  const birdY_Vertical = useTransform(smoothScrollY, [0, 1], ["0vh", "-100vh"]);
  const birdScale_Vertical = useTransform(smoothScrollY, [0, 1], [1, 0.1]);

  const homeOpacity = useTransform(smoothScrollY, [0, 0.3], [1, 0]);
  const homeVisibility = useTransform(smoothScrollY, [0.3, 0.31], ["visible", "hidden"]);

  return (
    <>
      {/* ==================== 1. 加载遮罩层  ==================== */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loader"
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
              <div className="w-12 h-[1px] bg-white/20 mt-4 overflow-hidden">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-full h-full bg-white"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        ref={containerRef}
        // 开启 X 和 Y 轴双向滚动，隐藏原生滚动条，开启段落吸附，限制滚动方向
        onScroll={handleScrollLock}
        className="w-screen h-screen overflow-auto snap-x snap-y snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[url('/background.png')] bg-cover bg-center"
      >
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400..900&family=Comfortaa:wght@300..700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=Stardos+Stencil:wght@400;700&display=swap" rel="stylesheet"
        />

        {/* ==================== 动态背景层 ( Z-0 & Z-10 ) - 固定不动 ==================== */}
        <motion.div
          style={{ y: homeY, opacity: homeOpacity, visibility: homeVisibility }}
          className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center pointer-events-none z-0"
        >
          {/* Layer 1 (底) */}
          <motion.div
            style={{ opacity: nameOpacity, visibility: nameVisibility }}
            className="absolute flex flex-col items-end z-20"
          >
            <span className="text-white/80 text-sm md:text-xl tracking-tight font-light mb-[-1rem] md:mb-[-4rem] pr-[1vw] z-30 pointer-events-none -translate-y-[2rem]">
              欢迎来到干意非的缓冲区
            </span>

            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontWeight: 700,
                backgroundImage: "url('/clouds.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              className="bg-clip-text text-transparent text-7xl md:text-[25rem] select-none leading-none"
            >
              Gan Yifei
            </h1>
          </motion.div>

          {/* Layer 2: 蓝色天空色块 (伪边界盒子) - Z-10 */}
          {/* <motion.div
          style={{ scaleY: skyboxScaleY, opacity: skyboxOpacity }}
          className="absolute w-full h-[40vh] bg-[#4a6b8c] shadow-inner origin-center"
        /> */}
        </motion.div>


        {/* ==================== 燕鸥前景层 ==================== */}
        <motion.div
          style={{
            x: birdX_Vertical,
            y: birdY_Vertical,
            scale: birdScale_Vertical,
            opacity: homeOpacity,
            visibility: homeVisibility
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
            <div
              onClick={scrollToPhotography}
              className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center text-gray-400 animate-pulse cursor-pointer z-50 hover:text-white transition-colors"
            >
              <p className="text-xs tracking-widest mr-2 uppercase">Photography</p>
              <ChevronRight size={24} />
            </div>
            {/* 下滑提示 (指向代码页) */}
            <div
              onClick={scrollToCode}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-gray-400 animate-pulse cursor-pointer z-50 hover:text-white transition-colors"
            >
              <p className="text-xs tracking-widest mb-2 uppercase">Code</p>
              <ChevronDown size={24} />
            </div>
          </div>

          {/* 2. 摄影作品集 - 右滑到达：全屏蓝色调布局 */}
          <div className="absolute top-0 left-[100vw] w-screen h-screen flex snap-center pointer-events-auto overflow-hidden bg-black">

            {/* 返回首页按钮 */}
            <div
              onClick={scrollToHome}
              className="absolute left-10 top-1/2 -translate-y-1/2 flex items-center text-gray-400 animate-pulse cursor-pointer z-50 hover:text-white transition-colors"
            >
              <ChevronLeft size={24} />
              <p className="text-xs tracking-widest ml-2 uppercase">Home</p>
            </div>

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
                onClick={() => router.push('/photography/birds')}
              >
                {covers.find(c => c.category === "birds") && (
                  <Image
                    src={covers.find(c => c.category === "birds").url}
                    alt="birds"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="absolute inset-0 w-full h-full object-cover object-[50%_60%] group-hover:scale-105 transition-transform duration-1000"
                    priority
                  />
                )}

                {/* 💡 关键：蓝色调叠加层 (混合模式) */}
                <div className="absolute inset-0 bg-[#425567]/60 z-10 opacity-100 group-hover:opacity-0 transition-opacity duration-500" />

                {/* 💡 标题：默认显示，悬停隐藏 */}
                <div className="absolute inset-0 flex items-center justify-center text-white z-20 opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none">
                  <h3 className="text-3xl md:text-4xl font-light uppercase tracking-[0.3em]">Birds</h3>
                </div>
              </motion.div>

              {/* 左下：Street */}
              <motion.div
                layout
                className="relative w-full overflow-hidden cursor-pointer group"
                style={{ flex: 1 }}
                whileHover={{ flex: 1.15 }}
                transition={{ duration: 0.6, ease: "circOut" }}
                onClick={() => router.push('/photography/street')}
              >
                {covers.find(c => c.category === "street") && (
                  <Image
                    src={covers.find(c => c.category === "street").url}
                    alt="street"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="absolute inset-0 w-full h-full object-cover object-[40%_80%] group-hover:scale-104 transition-transform duration-1000"
                    priority
                  />
                )}

                <div className="absolute inset-0 bg-[#425567]/60 z-10 opacity-100 group-hover:opacity-0 transition-opacity duration-500" />

                <div className="absolute inset-0 flex items-center justify-center text-white z-20 opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle,_rgba(0,0,0,0.3)_0%,_transparent_70%)]">
                  <h3 className="text-3xl md:text-4xl font-light uppercase tracking-[0.3em]">Street</h3>
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
              onClick={() => router.push('/photography/landscape')}
            >
              {covers.find(c => c.category === "landscape") && (
                <Image
                  src={covers.find(c => c.category === "landscape").url}
                  alt="landscape"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="absolute inset-0 w-full h-full object-cover object-[0%_100%] group-hover:scale-102 transition-transform duration-1000"
                  priority
                />
              )}

              <div className="absolute inset-0 bg-[#425567]/60 z-10 opacity-100 group-hover:opacity-0 transition-opacity duration-500" />

              <div className="absolute inset-0 flex items-center justify-center text-white z-20 opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none">
                <h3 className="text-5xl md:text-4xl font-light uppercase tracking-[0.4em]">Landscape</h3>
              </div>
            </motion.div>

          </div>

          {/* 3. 代码部分 ( 0, 100vh ) - 下滑到达 ( Section 2 ) */}
          <div className="absolute top-[100vh] left-0 w-screen h-screen bg-[#0d1117] text-white flex flex-col items-center pt-24 pb-10 snap-center pointer-events-auto z-20 overflow-hidden">

            {/* 返回首页按钮 */}
            <div
              onClick={scrollToHome}
              className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-gray-500 animate-pulse cursor-pointer z-50 hover:text-white transition-colors"
            >
              <ChevronUp size={24} />
              <p className="text-xs tracking-widest mt-2 uppercase">Home</p>
            </div>

            <h2 className="text-4xl md:text-5xl font-mono tracking-tighter text-gray-400 mb-8 flex items-center gap-4">
              <GithubIcon size={40} />
              {"<Code />"}
            </h2>

            {/* 内部滚动容器：项目较多时可以在此处上下滑动 */}
            <div className="w-full max-w-6xl px-6 md:px-12 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {pinnedProjects.map((project, index) => (
                  <motion.a
                    key={index}
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -5 }}
                    className="flex flex-col p-6 rounded-xl bg-[#161b22] border border-gray-700/50 hover:border-gray-500 transition-colors group cursor-pointer text-left h-full"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <GithubIcon size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                      <h3 className="font-semibold text-blue-400 group-hover:text-blue-300 transition-colors truncate">
                        {project.repo}
                      </h3>
                    </div>

                    <p className="text-sm text-gray-400 flex-1 mb-4 line-clamp-3">
                      {project.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto pt-4 border-t border-gray-800">
                      {project.language && (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.languageColor || '#8b949e' }}
                          />
                          <span>{project.language}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 hover:text-white transition-colors">
                        <Star size={14} />
                        <span>{project.stars || 0}</span>
                      </div>

                      <div className="flex items-center gap-1 hover:text-white transition-colors">
                        <GitFork size={14} />
                        <span>{project.forks || 0}</span>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>

            </div>
          </div>

          {/* ⚠️ 限制死角滚动：不放置 (100vw, 100vh) 的页面单元格，确保用户只能在这三个单元格之间移动 */}
        </div>
      </main>
    </>
  );
}