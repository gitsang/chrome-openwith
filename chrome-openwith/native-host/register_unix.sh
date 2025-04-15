#!/bin/bash
# 注册Chrome Native Messaging Host
# 此脚本用于macOS和Linux系统

echo "注册 Open With External Program Native Host..."

# 获取当前目录的绝对路径
CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 设置Python脚本路径（根据需要修改）
PYTHON_PATH="$CURRENT_DIR/native-host.py"
# 或者使用Node.js脚本
# NODE_PATH="$CURRENT_DIR/native-host.js"

# 创建启动脚本
echo '#!/bin/bash' > "$CURRENT_DIR/launcher.sh"
echo "python \"$PYTHON_PATH\" \"\$@\"" >> "$CURRENT_DIR/launcher.sh"
# 或者使用Node.js
# echo "node \"$NODE_PATH\" \"\$@\"" >> "$CURRENT_DIR/launcher.sh"

# 设置执行权限
chmod +x "$CURRENT_DIR/launcher.sh"
chmod +x "$PYTHON_PATH"
# 或者设置Node.js脚本的执行权限
# chmod +x "$NODE_PATH"

# 更新清单文件中的路径
MANIFEST_PATH="$CURRENT_DIR/com.example.openwith.json"
TEMP_FILE="$CURRENT_DIR/temp.json"

# 使用sed更新JSON文件中的路径
sed "s|REPLACE_WITH_ABSOLUTE_PATH|$CURRENT_DIR/launcher.sh|g" "$MANIFEST_PATH" > "$TEMP_FILE"
mv "$TEMP_FILE" "$MANIFEST_PATH"

# 获取扩展ID（如果已知）
read -p "请输入Chrome扩展ID（在chrome://extensions/中查看）: " EXTENSION_ID

# 更新清单文件中的扩展ID
sed "s|REPLACE_WITH_EXTENSION_ID|$EXTENSION_ID|g" "$MANIFEST_PATH" > "$TEMP_FILE"
mv "$TEMP_FILE" "$MANIFEST_PATH"

# 确定操作系统类型
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    TARGET_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
    # 如果使用Chromium或其他基于Chromium的浏览器，可能需要修改路径
    # TARGET_DIR="$HOME/Library/Application Support/Chromium/NativeMessagingHosts"
else
    # Linux
    TARGET_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
    # 如果使用Chromium或其他基于Chromium的浏览器，可能需要修改路径
    # TARGET_DIR="$HOME/.config/chromium/NativeMessagingHosts"
fi

# 创建目标目录（如果不存在）
mkdir -p "$TARGET_DIR"

# 复制清单文件到目标目录
cp "$MANIFEST_PATH" "$TARGET_DIR/"

echo ""
echo "注册完成！"
echo "清单文件路径: $TARGET_DIR/com.example.openwith.json"
echo ""
echo "请重启Chrome浏览器以使更改生效。"
echo ""

read -p "按Enter键继续..."
