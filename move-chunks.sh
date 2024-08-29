#!/bin/bash

sourceDir="dist"
destDir="dist/chunks"

# 如果目标目录不存在则创建
if [ ! -d "$destDir" ]; then
    mkdir -p "$destDir"
fi

# 移动文件
for file in "$sourceDir/vendors"*; do
    mv "$file" "$destDir/"
done

for file in "$sourceDir/addon"*; do
    mv "$file" "$destDir/"
done

# 重命名文件
cd dist
mv "extension worker.js" "extension-worker.js"
mv "extension worker.js.map" "extension-worker.js.map"
cd ..

echo "文件移动完成。"
