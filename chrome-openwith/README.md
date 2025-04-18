# Open With External Program - Chrome扩展

这是一个Chrome扩展，允许用户通过外部程序打开链接。

## 功能特点

- 使用外部命令打开链接（例如：`start msedge {url}`）
- 支持用户配置外部命令
- 支持配置是否默认点击就用外部命令打开，或者需要使用右键菜单打开
- 支持配置快捷键打开（如Ctrl+Shift+左键点击）
- 支持配置URL过滤规则（使用正则表达式）

## 安装方法

### 从Chrome网上应用店安装

*（尚未发布到Chrome网上应用店）*

### 手动安装

1. 下载或克隆此仓库到本地
2. 打开Chrome浏览器，进入扩展程序页面（chrome://extensions/）
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本仓库中的`chrome-openwith`目录
6. 创建图标文件（可选）：
   - 打开`icon-generator.html`文件
   - 按照页面上的说明创建图标文件

## 使用方法

### 基本使用

1. 安装扩展后，点击Chrome工具栏中的扩展图标，可以查看当前配置
2. 右键点击任意链接，选择"使用外部程序打开链接"
3. 在弹出的页面中，复制命令并在系统命令行中执行

### 配置选项

点击扩展图标，然后点击"打开选项"，或者在Chrome扩展管理页面中点击"选项"，可以进行以下配置：

1. **外部命令配置**：
   - 设置用于打开链接的外部命令，使用`{url}`作为链接地址的占位符
   - 例如：`start msedge {url}`（Windows）或`open -a "Google Chrome" {url}`（macOS）

2. **打开方式**：
   - 选择是否默认点击链接时就使用外部程序打开
   - 如果不勾选，则需要使用右键菜单或快捷键打开

3. **快捷键配置**：
   - 设置按住哪些按键（Ctrl、Shift、Alt）点击链接时，使用外部程序打开

4. **URL过滤规则**：
   - 添加正则表达式规则，只有匹配规则的URL才会被处理
   - 如果不添加任何规则，则处理所有URL

## 注意事项

- Chrome扩展无法直接执行系统命令，因此本扩展默认只能显示要执行的命令，需要用户手动复制并执行
- 如果需要自动执行命令，可以使用Native Messaging与本地应用程序通信，详见下文

## 使用Native Messaging自动执行命令

如果你希望扩展能够直接执行系统命令，而不需要手动复制粘贴，可以使用Chrome的Native Messaging功能。

### 什么是Native Messaging？

Native Messaging允许Chrome扩展与本地安装的应用程序进行通信。通过这种方式，扩展可以发送消息给本地应用程序，本地应用程序执行系统命令后，再将结果返回给扩展。

### 如何实现？

我们提供了详细的实现指南：[Native Messaging 实现指南](native-messaging-guide.md)

简要步骤：

1. 修改Chrome扩展，添加Native Messaging权限
2. 创建一个本地应用程序（可以用Python、Node.js等语言编写）
3. 创建一个清单文件，告诉Chrome如何与本地应用程序通信
4. 注册本地应用程序
5. 重启Chrome浏览器

完成这些步骤后，当你点击链接时，扩展将自动通过本地应用程序执行命令，无需手动操作。

## 技术说明

本扩展使用以下技术：

- JavaScript
- Chrome Extension API
- HTML/CSS

## 许可证

MIT
