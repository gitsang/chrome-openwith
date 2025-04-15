#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置日志
const logFile = path.join(__dirname, 'native-host.log');

/**
 * 记录消息到日志文件
 * @param {string} message 要记录的消息
 */
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${message}\n`;
  fs.appendFileSync(logFile, logEntry);
}

/**
 * 从标准输入读取消息
 * @returns {Promise<object>} 解析后的消息对象
 */
function getMessage() {
  return new Promise((resolve) => {
    logMessage("等待消息...");
    
    // 前4个字节表示消息长度
    const header = Buffer.alloc(4);
    
    fs.read(0, header, 0, 4, null, (err, bytesRead) => {
      if (bytesRead < 4) {
        logMessage("没有接收到消息长度");
        resolve(null);
        return;
      }
      
      const messageLength = header.readUInt32LE(0);
      logMessage(`消息长度: ${messageLength}`);
      
      const buffer = Buffer.alloc(messageLength);
      
      fs.read(0, buffer, 0, messageLength, null, (err, bytesRead) => {
        if (bytesRead < messageLength) {
          logMessage("消息不完整");
          resolve(null);
          return;
        }
        
        const messageStr = buffer.toString();
        logMessage(`接收到消息: ${messageStr}`);
        
        try {
          const message = JSON.parse(messageStr);
          resolve(message);
        } catch (e) {
          logMessage(`解析消息失败: ${e.message}`);
          resolve(null);
        }
      });
    });
  });
}

/**
 * 向标准输出发送消息
 * @param {object} message 要发送的消息对象
 */
function sendMessage(message) {
  logMessage(`发送消息: ${JSON.stringify(message)}`);
  
  const buffer = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);
  
  fs.write(1, header, 0, 4, null, () => {
    fs.write(1, buffer, 0, buffer.length, null, () => {
      logMessage("消息已发送");
    });
  });
}

/**
 * 主函数
 */
async function main() {
  logMessage("Native Host 启动");
  
  try {
    // 接收来自Chrome扩展的消息
    const message = await getMessage();
    
    if (message && message.command) {
      const command = message.command;
      const url = message.url || '';
      
      logMessage(`执行命令: ${command}`);
      logMessage(`URL: ${url}`);
      
      try {
        // 执行命令
        const process = spawn(command, { shell: true });
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          logMessage(`命令输出: ${output}`);
        });
        
        process.stderr.on('data', (data) => {
          const error = data.toString();
          stderr += error;
          logMessage(`命令错误: ${error}`);
        });
        
        process.on('close', (code) => {
          logMessage(`命令执行完成，退出码: ${code}`);
          
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
        logMessage(`执行命令时出错: ${e.message}`);
        sendMessage({
          success: false,
          error: e.message
        });
      }
    } else {
      logMessage("无效的消息格式");
      sendMessage({
        success: false,
        error: 'Invalid message format'
      });
    }
  } catch (e) {
    logMessage(`处理消息时出错: ${e.message}`);
    sendMessage({
      success: false,
      error: e.message
    });
  }
}

// 启动程序
main().catch(error => {
  logMessage(`未捕获的错误: ${error.message}`);
  sendMessage({
    success: false,
    error: `Uncaught error: ${error.message}`
  });
});
