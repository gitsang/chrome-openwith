# Open With External Program - Native Host

这个目录包含了实现Chrome扩展与本地应用程序通信所需的文件，使用Chrome的Native Messaging API。

## 文件说明

- `native-host.py`: Python实现的本地应用程序
- `native-host.js`: Node.js实现的本地应用程序（二选一）
- `com.example.openwith.json`: 本地应用程序的清单文件
- `register_windows.bat`: Windows系统的注册脚本
- `register_unix.sh`: macOS和Linux系统的注册脚本

## 安装步骤

### 前提条件

- 已安装Chrome浏览器
- 已安装Open With External Program扩展
- 已安装Python（3.6+）或Node.js（10+）

### 1. 修改Chrome扩展

首先，需要修改Chrome扩展的manifest.json文件，添加nativeMessaging权限：

```json
{
  "permissions": [
    "nativeMessaging"
  ]
}
```

### 2. 获取扩展ID

1. 打开Chrome浏览器
2. 访问`chrome://extensions/`
3. 开启"开发者模式"（右上角）
4. 找到"Open With External Program"扩展
5. 记下扩展ID（类似于`abcdefghijklmnopqrstuvwxyzabcdef`）

### 3. 注册本地应用程序

#### Windows系统

1. 右键点击`register_windows.bat`
2. 选择"以管理员身份运行"
3. 在提示时输入扩展ID
4. 等待注册完成
5. 重启Chrome浏览器

#### macOS和Linux系统

1. 打开终端
2. 进入本目录
3. 执行以下命令：
   ```bash
   chmod +x register_unix.sh
   ./register_unix.sh
   ```
4. 在提示时输入扩展ID
5. 等待注册完成
6. 重启Chrome浏览器

## 选择Python或Node.js

默认情况下，注册脚本使用Python版本的本地应用程序。如果你想使用Node.js版本，请按照以下步骤修改注册脚本：

### Windows系统

编辑`register_windows.bat`文件，注释掉Python相关行，取消注释Node.js相关行：

```batch
:: 设置Python脚本路径（根据需要修改）
:: set PYTHON_PATH=%CURRENT_DIR%\native-host.py
:: 或者使用Node.js脚本
set NODE_PATH=%CURRENT_DIR%\native-host.js

:: 创建启动脚本
echo @echo off > "%CURRENT_DIR%\launcher.bat"
:: echo python "%PYTHON_PATH%" %%* >> "%CURRENT_DIR%\launcher.bat"
:: 或者使用Node.js
echo node "%NODE_PATH%" %%* >> "%CURRENT_DIR%\launcher.bat"
```

### macOS和Linux系统

编辑`register_unix.sh`文件，注释掉Python相关行，取消注释Node.js相关行：

```bash
# 设置Python脚本路径（根据需要修改）
# PYTHON_PATH="$CURRENT_DIR/native-host.py"
# 或者使用Node.js脚本
NODE_PATH="$CURRENT_DIR/native-host.js"

# 创建启动脚本
echo '#!/bin/bash' > "$CURRENT_DIR/launcher.sh"
# echo "python \"$PYTHON_PATH\" \"\$@\"" >> "$CURRENT_DIR/launcher.sh"
# 或者使用Node.js
echo "node \"$NODE_PATH\" \"\$@\"" >> "$CURRENT_DIR/launcher.sh"

# 设置执行权限
chmod +x "$CURRENT_DIR/launcher.sh"
# chmod +x "$PYTHON_PATH"
# 或者设置Node.js脚本的执行权限
chmod +x "$NODE_PATH"
```

## 测试

安装完成后，你可以通过以下步骤测试Native Messaging是否正常工作：

1. 打开Chrome浏览器
2. 访问任意网页
3. 右键点击链接，选择"使用外部程序打开链接"
4. 如果一切正常，链接应该会通过配置的外部程序打开，而不是显示命令页面

## 日志

本地应用程序会在同一目录下创建一个日志文件`native-host.log`，记录所有通信和命令执行的详细信息。如果遇到问题，可以查看此日志文件进行调试。

## 安全注意事项

1. 本地应用程序可以执行系统命令，因此存在安全风险。确保只执行可信的命令。
2. 清单文件中的`allowed_origins`字段限制了哪些扩展可以与本地应用程序通信，确保只有你的扩展可以访问。
3. 确保本地应用程序和清单文件的权限设置正确，防止未授权访问。

## 故障排除

如果Native Messaging不工作，请检查以下几点：

1. 确认扩展ID是否正确
2. 检查清单文件路径是否正确
3. 确认本地应用程序有执行权限
4. 查看`native-host.log`日志文件
5. 在Chrome的控制台中查看错误信息（打开开发者工具，切换到"控制台"标签）
