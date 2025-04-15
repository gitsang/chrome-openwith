# Native Messaging 实现指南

本指南将说明如何使用Chrome的Native Messaging功能，让Chrome扩展能够与本地应用程序通信，从而实现直接执行系统命令打开链接的功能。

## 概述

Native Messaging允许Chrome扩展与本地安装的应用程序进行通信。基本流程如下：

1. Chrome扩展发送消息给本地应用程序
2. 本地应用程序接收消息，执行相应操作（如执行系统命令）
3. 本地应用程序可以发送响应回Chrome扩展

## 实现步骤

### 1. 修改Chrome扩展

#### 1.1 更新manifest.json

首先，需要在manifest.json中添加nativeMessaging权限，并指定可以与之通信的本地应用程序的ID：

```json
{
  "permissions": [
    "nativeMessaging"
  ],
  "key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "externally_connectable": {
    "ids": ["your_extension_id"]
  }
}
```

注意：`key`字段是可选的，但如果你想在不同的机器上使用相同的扩展ID，则需要提供这个字段。

#### 1.2 更新background.js

修改background.js，使用Native Messaging发送消息：

```javascript
// 使用外部程序打开链接
function openWithExternalProgram(url) {
  console.log('使用外部程序打开链接:', url);
  
  // 替换命令中的{url}占位符
  const command = userConfig.command.replace('{url}', url);
  
  // 使用Native Messaging发送消息给本地应用程序
  chrome.runtime.sendNativeMessage('com.example.openwith',
    { command: command, url: url },
    function(response) {
      console.log('收到本地应用程序的响应:', response);
      if (response && response.success) {
        console.log('命令执行成功');
      } else {
        console.error('命令执行失败:', response ? response.error : '未知错误');
        // 如果失败，回退到显示命令页面
        chrome.tabs.create({
          url: 'command.html?command=' + encodeURIComponent(command) + '&url=' + encodeURIComponent(url)
        });
      }
    }
  );
}
```

### 2. 创建本地应用程序

本地应用程序可以使用任何编程语言编写，只要它能够按照Chrome的Native Messaging协议进行通信。以下是几种常见语言的实现示例：

#### 2.1 使用Python实现

创建一个名为`native-host.py`的Python脚本：

```python
#!/usr/bin/env python3

import sys
import json
import struct
import subprocess
import os

# 辅助函数：从标准输入读取消息
def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        return None
    message_length = struct.unpack('=I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)

# 辅助函数：向标准输出写入消息
def send_message(message):
    encoded_message = json.dumps(message).encode('utf-8')
    encoded_length = struct.pack('=I', len(encoded_message))
    sys.stdout.buffer.write(encoded_length)
    sys.stdout.buffer.write(encoded_message)
    sys.stdout.buffer.flush()

# 主函数
def main():
    # 接收来自Chrome扩展的消息
    message = get_message()
    
    if message and 'command' in message:
        try:
            # 执行命令
            process = subprocess.Popen(
                message['command'],
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = process.communicate()
            
            # 发送响应
            if process.returncode == 0:
                send_message({
                    'success': True,
                    'stdout': stdout.decode('utf-8', errors='replace')
                })
            else:
                send_message({
                    'success': False,
                    'error': stderr.decode('utf-8', errors='replace')
                })
        except Exception as e:
            send_message({
                'success': False,
                'error': str(e)
            })
    else:
        send_message({
            'success': False,
            'error': 'Invalid message format'
        })

if __name__ == '__main__':
    main()
```

#### 2.2 使用Node.js实现

创建一个名为`native-host.js`的Node.js脚本：

```javascript
#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

// 辅助函数：从标准输入读取消息
function getMessage() {
  return new Promise((resolve) => {
    // 前4个字节表示消息长度
    const header = Buffer.alloc(4);
    fs.read(0, header, 0, 4, null, (err, bytesRead) => {
      if (bytesRead < 4) {
        resolve(null);
        return;
      }
      
      const messageLength = header.readUInt32LE(0);
      const buffer = Buffer.alloc(messageLength);
      
      fs.read(0, buffer, 0, messageLength, null, (err, bytesRead) => {
        if (bytesRead < messageLength) {
          resolve(null);
          return;
        }
        
        const message = JSON.parse(buffer.toString());
        resolve(message);
      });
    });
  });
}

// 辅助函数：向标准输出写入消息
function sendMessage(message) {
  const buffer = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);
  
  fs.write(1, header, 0, 4, null, () => {
    fs.write(1, buffer, 0, buffer.length, null, () => {});
  });
}

// 主函数
async function main() {
  try {
    // 接收来自Chrome扩展的消息
    const message = await getMessage();
    
    if (message && message.command) {
      try {
        // 执行命令
        const process = spawn(message.command, { shell: true });
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        process.on('close', (code) => {
          if (code === 0) {
            sendMessage({
              success: true,
              stdout: stdout
            });
          } else {
            sendMessage({
              success: false,
              error: stderr
            });
          }
        });
      } catch (e) {
        sendMessage({
          success: false,
          error: e.message
        });
      }
    } else {
      sendMessage({
        success: false,
        error: 'Invalid message format'
      });
    }
  } catch (e) {
    sendMessage({
      success: false,
      error: e.message
    });
  }
}

main();
```

### 3. 创建本地应用程序的清单文件

创建一个名为`com.example.openwith.json`的清单文件，用于告诉Chrome如何与本地应用程序通信：

#### 3.1 Windows版本

```json
{
  "name": "com.example.openwith",
  "description": "Open With External Program Native Host",
  "path": "C:\\Path\\To\\native-host.bat",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://your_extension_id/"
  ]
}
```

注意：在Windows上，你可能需要创建一个批处理文件（.bat）来启动Python或Node.js脚本：

```batch
@echo off
python "C:\Path\To\native-host.py" %*
```

或者：

```batch
@echo off
node "C:\Path\To\native-host.js" %*
```

#### 3.2 macOS和Linux版本

```json
{
  "name": "com.example.openwith",
  "description": "Open With External Program Native Host",
  "path": "/path/to/native-host.py",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://your_extension_id/"
  ]
}
```

### 4. 注册本地应用程序

#### 4.1 Windows

创建一个注册表脚本`register.reg`：

```reg
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.example.openwith]
@="C:\\Path\\To\\com.example.openwith.json"
```

运行这个脚本，或者手动添加注册表项。

#### 4.2 macOS

将清单文件放在以下位置：

```
~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.example.openwith.json
```

#### 4.3 Linux

将清单文件放在以下位置：

```
~/.config/google-chrome/NativeMessagingHosts/com.example.openwith.json
```

### 5. 安装和使用

1. 安装Chrome扩展
2. 安装本地应用程序（Python或Node.js脚本）
3. 注册本地应用程序（使用注册表脚本或将清单文件放在指定位置）
4. 重启Chrome浏览器
5. 使用扩展打开链接，现在应该可以直接执行系统命令了

## 安全注意事项

1. 本地应用程序可以执行系统命令，因此存在安全风险。确保验证来自Chrome扩展的消息，并限制可执行的命令。
2. 在清单文件中，使用`allowed_origins`字段限制哪些扩展可以与本地应用程序通信。
3. 确保本地应用程序和清单文件的权限设置正确，防止未授权访问。

## 调试技巧

1. 在本地应用程序中添加日志记录，将日志写入文件：

```python
def log_message(message):
    with open('/path/to/logfile.log', 'a') as f:
        f.write(json.dumps(message) + '\n')
```

2. 在Chrome中，访问`chrome://extensions`，开启开发者模式，然后点击"背景页"查看控制台输出。

3. 如果Native Messaging不工作，检查以下几点：
   - 清单文件路径是否正确
   - 本地应用程序是否有执行权限
   - 扩展ID是否与清单文件中的`allowed_origins`匹配
   - 本地应用程序是否正确处理消息格式（包括4字节长度头）

## 完整示例

完整的示例代码和详细说明可以在Chrome开发者文档中找到：
https://developer.chrome.com/docs/extensions/mv3/nativeMessaging/

通过实现Native Messaging，你的Chrome扩展就可以直接执行系统命令，无需用户手动复制和执行命令。
