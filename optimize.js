const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// 获取命令行传入的第一个参数作为输入路径
const inputPath = process.argv[2];

if (!inputPath) {
    console.error("❌ 请提供文件夹路径！\n用法: node optimize.js /你的/照片/路径");
    process.exit(1);
}

// 转换成绝对路径并计算输出路径
const absoluteInputPath = path.resolve(inputPath);
const outputDir = absoluteInputPath + "_optimized";

// 支持的格式
const SUPPORTED_EXTS = [".jpg", ".jpeg", ".png", ".tiff", ".webp"];

async function optimizeImages() {
    if (!fs.existsSync(absoluteInputPath)) {
        console.error(`❌ 找不到文件夹: ${absoluteInputPath}`);
        return;
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        const files = fs.readdirSync(absoluteInputPath);
        const tasks = files
            .filter(file => SUPPORTED_EXTS.includes(path.extname(file).toLowerCase()))
            .map(async (file) => {
                const inputFilePath = path.join(absoluteInputPath, file);
                const fileName = path.parse(file).name;
                const outputPath = path.join(outputDir, `${fileName}.webp`);

                return sharp(inputFilePath)
                    .resize({ width: 2000, withoutEnlargement: true })
                    .webp({ quality: 75, effort: 6, smartSubsample: true })
                    .toFile(outputPath)
                    .then(() => console.log(`✅ 已优化: ${file} -> ${path.basename(outputPath)}`));
            });

        await Promise.all(tasks);
        console.log(`\n🎉 全部处理完成！\n输出目录: ${outputDir}`);
    } catch (error) {
        console.error("处理过程中出错:", error);
    }
}

optimizeImages();