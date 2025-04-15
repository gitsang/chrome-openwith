#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import struct
import subprocess
import os
import logging
from datetime import datetime

# 配置日志
log_dir = os.path.dirname(os.path.abspath(__file__))
log_file = os.path.join(log_dir, 'native-host.log')
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def log_message(message):
    """记录消息到日志文件"""
    logging.info(message)

def get_message():
    """从标准输入读取消息"""
    log_message("等待消息...")
    
    # 读取消息长度（前4个字节）
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        log_message("没有接收到消息长度")
        return None
    
    # 解析消息长度
    message_length = struct.unpack('=I', raw_length)[0]
    log_message(f"消息长度: {message_length}")
    
    # 读取消息内容
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    log_message(f"接收到消息: {message}")
    
    return json.loads(message)

def send_message(message):
    """向标准输出发送消息"""
    log_message(f"发送消息: {json.dumps(message)}")
    
    # 编码消息
    encoded_message = json.dumps(message).encode('utf-8')
    
    # 写入消息长度（前4个字节）
    encoded_length = struct.pack('=I', len(encoded_message))
    sys.stdout.buffer.write(encoded_length)
    
    # 写入消息内容
    sys.stdout.buffer.write(encoded_message)
    sys.stdout.buffer.flush()

def main():
    """主函数"""
    log_message("Native Host 启动")
    
    try:
        # 接收消息
        message = get_message()
        
        if message and 'command' in message:
            command = message['command']
            url = message.get('url', '')
            
            log_message(f"执行命令: {command}")
            log_message(f"URL: {url}")
            
            try:
                # 执行命令
                process = subprocess.Popen(
                    command,
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                stdout, stderr = process.communicate()
                
                # 发送响应
                if process.returncode == 0:
                    log_message("命令执行成功")
                    send_message({
                        'success': True,
                        'stdout': stdout.decode('utf-8', errors='replace')
                    })
                else:
                    log_message(f"命令执行失败: {stderr.decode('utf-8', errors='replace')}")
                    send_message({
                        'success': False,
                        'error': stderr.decode('utf-8', errors='replace')
                    })
            except Exception as e:
                log_message(f"执行命令时出错: {str(e)}")
                send_message({
                    'success': False,
                    'error': str(e)
                })
        else:
            log_message("无效的消息格式")
            send_message({
                'success': False,
                'error': 'Invalid message format'
            })
    except Exception as e:
        log_message(f"处理消息时出错: {str(e)}")
        send_message({
            'success': False,
            'error': str(e)
        })
    
    log_message("Native Host 结束")

if __name__ == '__main__':
    main()
