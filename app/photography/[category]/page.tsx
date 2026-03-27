// app/photography/[category]/page.tsx
import GalleryClient from "./GalleryClient";

// 在 build 的时候生成这三个静态页面
export function generateStaticParams() {
    return [
        { category: "birds" },
        { category: "street" },
        { category: "landscape" },
    ];
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const resolvedParams = await params;
    return <GalleryClient category={resolvedParams.category} />;
}