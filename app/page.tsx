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
  const [photoHover, setPhotoHover] = useState<"street" | "birds" | "landscape" | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  // 综合处理数据获取与 Loading 状态（包含缓存处理与兜底机制）
  // 2. 解绑请求与定时器
  useEffect(() => {
    let isMounted = true;
    const isReturning = window.location.hash === "#photography";

    // 移动端后台标签页会节流 setTimeout，用最长等待保证遮罩一定会关掉
    const maxWaitTimer = window.setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 5000);

    // 如果是带有 hash 返回，直接取消 Loading 并瞬间定位；否则正常显示 Loading
    if (isReturning) {
      setIsLoading(false);
      window.setTimeout(() => {
        containerRef.current?.scrollTo({
          left: window.innerWidth,
          top: 0,
          behavior: "auto",
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

    let loadingTimer: number | undefined;

    if (!isReturning) {
      loadingTimer = window.setTimeout(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      }, 1500);
    }

    return () => {
      isMounted = false;
      if (loadingTimer !== undefined) window.clearTimeout(loadingTimer);
      window.clearTimeout(maxWaitTimer);
    };
  }, [pathname]);

  useEffect(() => {
    // 必须使用 "Owner/Repo" 的格式，请将 YifeiGan 替换为实际拥有该仓库的组织或用户名
    const pinnedRepoPaths = [
      "No-RAGrets-Research/baseline-model",
      "No-RAGrets-Research/llm_paper_reviewer",
      "No-RAGrets-Research/llm_to_knowledge_graph"
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

  const photoMotionTransition = {
    type: "spring" as const,
    stiffness: 320,
    damping: 32,
    mass: 0.65,
  };

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
          className="pointer-events-none fixed top-0 left-0 z-0 flex h-screen w-screen items-center justify-center"
        >
          <div className="flex h-full w-full max-md:-translate-y-[6vh] items-center justify-center md:translate-y-0">
            {/* Layer 1 (底) */}
            <motion.div
              style={{ opacity: nameOpacity, visibility: nameVisibility }}
              className="absolute z-20 flex max-w-[calc(100vw-2rem)] flex-col items-start md:max-w-none md:items-end
              left-4 top-1/2 -translate-y-1/2
              md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
            >
              <h1
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontWeight: 700,
                  backgroundImage: "url('/clouds.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                className="order-1 bg-clip-text text-transparent text-9xl md:text-[25rem] select-none leading-none md:whitespace-nowrap
                flex flex-col items-start text-left md:order-2 md:block md:text-right"
              >
                <span className="block md:inline">Gan</span>
                <span className="hidden md:inline"> </span>
                <span className="block md:inline">Yifei</span>
              </h1>

              <span className="order-2 -mt-2 max-w-[min(18rem,calc(100vw-2rem))] text-left text-[11px] leading-snug text-white/70 
            tracking-tight md:order-1 md:mt-0 md:max-w-none md:text-right md:text-xl md:text-white/80 md:tracking-tight 
            md:font-light md:mb-[-4rem] md:pr-[1vw] md:-translate-y-[2rem] pointer-events-none translate-x-3">
                欢迎来到干意非的缓冲区
              </span>
            </motion.div>

            {/* Layer 2: 蓝色天空色块 (伪边界盒子) - Z-10 */}
            {/* <motion.div
          style={{ scaleY: skyboxScaleY, opacity: skyboxOpacity }}
          className="absolute w-full h-[40vh] bg-[#4a6b8c] shadow-inner origin-center"
        /> */}
          </div>
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
          className="pointer-events-none fixed top-0 left-0 z-50 flex h-screen w-screen items-center justify-center"
        >
          <div className="flex h-full w-full max-md:-translate-y-[6vh] items-center justify-center md:translate-y-0">
            <div className="flex w-full translate-y-[14vh] justify-center md:translate-y-0">
              <motion.img
                src="/tern.png"
                alt="Arctic Tern"
                style={{
                  scale: birdScale,
                  x: birdX,
                  y: birdY_X,
                  opacity: birdOpacityX,
                }}
                className="w-[58%] md:w-[50%] h-auto origin-center"
              />
            </div>
          </div>
        </motion.div>


        {/* ==================== 2D 滚动内容画布 ( Z-20 ) - 滚动吸附点 ==================== */}
        <div className="relative w-[200vw] h-[200vh] pointer-events-none">

          {/* 1. 首页占位符 ( 0, 0 ) - 起始点，提供滚动吸附点和提示 */}
          <div className="pointer-events-auto absolute top-0 left-0 h-screen w-screen max-md:-translate-y-[6vh] snap-center md:translate-y-0">
            {/* 右滑提示 (指向摄影页) */}
            <div
              onClick={scrollToPhotography}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400 animate-pulse cursor-pointer z-50 hover:text-white transition-colors md:right-10"
            >
              <p className="mr-1 text-[9px] font-medium tracking-[0.18em] uppercase md:mr-2 md:text-xs md:tracking-widest">
                Photography
              </p>
              <ChevronRight className="h-4 w-4 shrink-0 md:h-6 md:w-6" strokeWidth={2} aria-hidden />
            </div>
            {/* 下滑提示 (指向代码页) */}
            <div
              onClick={scrollToCode}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-gray-400 animate-pulse cursor-pointer z-50 hover:text-white transition-colors"
            >
              <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] md:text-xs md:tracking-widest">
                Code
              </p>
              <ChevronDown
                className="h-4 w-4 shrink-0 md:h-6 md:w-6"
                strokeWidth={2}
                aria-hidden
              />
            </div>
          </div>

          {/* 2. 摄影作品集 - 右滑到达：全屏蓝色调布局 */}
          <div className="pointer-events-auto absolute top-0 left-[100vw] h-screen w-screen snap-center overflow-x-hidden overflow-y-auto md:overflow-hidden">
            {/* 背景图 + 模糊 */}
            <div
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/photo_bg.jpg')" }}
            />
            <div className="absolute inset-0 z-[1] bg-black/20 backdrop-blur-2xl backdrop-saturate-150" />

            {/* 返回首页按钮 */}
            <div
              onClick={scrollToHome}
              className="absolute left-10 top-1/2 z-[60] flex -translate-y-1/2 cursor-pointer items-center text-gray-400 animate-pulse transition-colors hover:text-white max-md:top-[calc(50%-6vh)]"
            >
              <ChevronLeft
                className="h-4 w-4 shrink-0 md:h-6 md:w-6"
                strokeWidth={2}
                aria-hidden
              />
              <p className="ml-2 text-[9px] font-medium uppercase tracking-[0.18em] md:text-xs md:tracking-widest">
                Home
              </p>
            </div>

            {/* 角落装饰 Logo */}
            <div className="pointer-events-none absolute left-3 top-16 z-[5] w-[min(32vw,9rem)] md:left-10 md:top-7 md:w-70">
              <Image
                src="/photo_page_logo1_black.png"
                alt=""
                width={320}
                height={320}
                className="h-auto w-full object-contain opacity-90"
              />
            </div>
            {/* <div className="pointer-events-none absolute right-3 bottom-4 z-[5] w-[min(36vw,10rem)] md:right-6 md:bottom-6 md:w-50">
              <Image
                src="/photo_page_logo2_black.png"
                alt=""
                width={320}
                height={320}
                className="h-auto w-full object-contain opacity-90"
              />
            </div> */}

            {/* 三张原比例照片，绝对定位叠压，hover 时弹开 */}
            <div
              className="relative h-full w-full"
              onMouseLeave={() => setPhotoHover(null)}
            >
              {/* Birds — 中间偏上 1/3 */}
              <motion.button
                type="button"
                onClick={() => router.push("/photography/birds")}
                onMouseEnter={() => setPhotoHover("birds")}
                onMouseLeave={() => setPhotoHover(null)}
                animate={
                  photoHover === "birds"
                    ? { x: "-50%", y: "-50%", scale: 1.06, zIndex: 55 }
                    : { x: "-50%", y: "-50%", scale: 1, zIndex: 20 }
                }
                transition={photoMotionTransition}
                className="group absolute left-[42%] top-[33%] cursor-pointer border-0 bg-transparent p-0 shadow-none outline-none focus-visible:ring-2 focus-visible:ring-white/45"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-2xl md:rounded-3xl">
                  {covers.find((c) => c.category === "birds")?.url && (
                    <img
                      src={covers.find((c) => c.category === "birds")!.url}
                      alt="Birds"
                      className="block h-[28vh] w-auto md:h-[42vh]"
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-[#425567]/50 transition-opacity duration-500 ease-out group-hover:opacity-0" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-out group-hover:opacity-0">
                    <span className="text-xl font-light uppercase tracking-[0.3em] text-white drop-shadow-lg md:text-3xl">
                      Birds
                    </span>
                  </div>
                </div>
              </motion.button>

              {/* Street — 中间偏下 1/3 */}
              <motion.button
                type="button"
                onClick={() => router.push("/photography/street")}
                onMouseEnter={() => setPhotoHover("street")}
                onMouseLeave={() => setPhotoHover(null)}
                animate={
                  photoHover === "street"
                    ? { x: "-50%", y: "-50%", scale: 1.06, zIndex: 55 }
                    : { x: "-50%", y: "-50%", scale: 1, zIndex: 15 }
                }
                transition={photoMotionTransition}
                className="group absolute left-[51%] top-[70%] cursor-pointer border-0 bg-transparent p-0 shadow-none outline-none focus-visible:ring-2 focus-visible:ring-white/45"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-2xl md:rounded-3xl">
                  {covers.find((c) => c.category === "street")?.url && (
                    <img
                      src={covers.find((c) => c.category === "street")!.url}
                      alt="Street"
                      className="block h-[28vh] w-auto md:h-[48vh]"
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-[#425567]/50 transition-opacity duration-500 ease-out group-hover:opacity-0" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-out group-hover:opacity-0">
                    <span className="text-xl font-light uppercase tracking-[0.3em] text-white drop-shadow-lg md:text-3xl">
                      Street
                    </span>
                  </div>
                </div>
              </motion.button>

              {/* Landscape — 右侧 2/3 位置 */}
              <motion.button
                type="button"
                onClick={() => router.push("/photography/landscape")}
                onMouseEnter={() => setPhotoHover("landscape")}
                onMouseLeave={() => setPhotoHover(null)}
                animate={
                  photoHover === "landscape"
                    ? { x: "-50%", y: "-50%", scale: 1.06, zIndex: 55 }
                    : { x: "-50%", y: "-50%", scale: 1, zIndex: 25 }
                }
                transition={photoMotionTransition}
                className="group absolute left-[76%] top-[48%] cursor-pointer border-0 bg-transparent p-0 shadow-none outline-none focus-visible:ring-2 focus-visible:ring-white/45"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-2xl md:rounded-3xl">
                  {covers.find((c) => c.category === "landscape")?.url && (
                    <img
                      src={covers.find((c) => c.category === "landscape")!.url}
                      alt="Landscape"
                      className="block h-[32vh] w-auto md:h-[61vh]"
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-[#425567]/50 transition-opacity duration-500 ease-out group-hover:opacity-0" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-out group-hover:opacity-0">
                    <span className="text-xl font-light uppercase tracking-[0.35em] text-white drop-shadow-lg md:text-2xl">
                      Landscape
                    </span>
                  </div>
                </div>
              </motion.button>
            </div>

          </div>

          {/* 3. 代码部分 ( 0, 100vh ) - 下滑到达 ( Section 2 ) */}
          <div className="absolute top-[100vh] left-0 w-screen h-screen bg-[#2a3542] text-white flex flex-col items-center pt-24 pb-10 snap-center pointer-events-auto z-20 overflow-hidden">
            <img
              src="/bird_logo_dark.png"
              alt=""
              aria-hidden="true"
              className="absolute z-0 left-[-14vw] bottom-[-8vh] w-[72vw] max-w-[920px] min-w-[420px] pointer-events-none select-none"
            />

            <div className="relative z-10 w-full h-full flex flex-col items-center">
              {/* 返回首页按钮 */}
              <div
                onClick={scrollToHome}
                className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center text-gray-500 animate-pulse cursor-pointer z-50 hover:text-white transition-colors"
              >
                <ChevronUp
                  className="h-4 w-4 shrink-0 md:h-6 md:w-6"
                  strokeWidth={2}
                  aria-hidden
                />
                <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.18em] md:text-xs md:tracking-widest">
                  Home
                </p>
              </div>

              {/* <h2 className="text-4xl md:text-5xl font-mono tracking-tighter text-gray-400 mb-10 flex items-center gap-4">
              <GithubIcon size={40} />
              {"<Code />"}
            </h2> */}

              {/* 内部滚动容器：项目较多时可以在此处上下滑动 */}
              <div className="w-full max-w-6xl px-6 md:px-12 pt-16 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                <section className="w-full pb-20">
                  <div className="max-w-6xl mx-auto">

                    <div className="w-full max-w-5xl mx-auto mb-8 rounded-2xl border border-gray-700/60 bg-[#11161d] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                      <img
                        src="/Carbonbridge%20Poster%20Team%202.jpg"
                        alt="Carbonbridge poster"
                        className="block w-full h-auto"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                </section>

              </div>
            </div>
          </div>

          {/* ⚠️ 限制死角滚动：不放置 (100vw, 100vh) 的页面单元格，确保用户只能在这三个单元格之间移动 */}
        </div>
      </main>
    </>
  );
}