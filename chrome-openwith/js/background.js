// 存储用户配置
let userConfig = {
  command: 'start msedge {url}',  // 默认命令
  defaultOpen: false,             // 默认是否直接用外部命令打开
  shortcutKey: {                  // 快捷键配置
    ctrl: true,
    shift: true,
    alt: false
  },
  urlFilters: []                  // URL过滤规则
};

// 从存储中加载用户配置
function loadUserConfig() {
  chrome.storage.sync.get({
    command: 'start msedge {url}',
    defaultOpen: false,
    shortcutKey: {
      ctrl: true,
      shift: true,
      alt: false
    },
    urlFilters: []
  }, function(items) {
    userConfig = items;
    console.log('配置已加载:', userConfig);
    
    // 更新右键菜单
    updateContextMenu();
  });
}

// 初始化时加载配置
loadUserConfig();

// 监听存储变化，实时更新配置
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync') {
    if (changes.command) {
      userConfig.command = changes.command.newValue;
    }
    if (changes.defaultOpen) {
      userConfig.defaultOpen = changes.defaultOpen.newValue;
    }
    if (changes.shortcutKey) {
      userConfig.shortcutKey = changes.shortcutKey.newValue;
    }
    if (changes.urlFilters) {
      userConfig.urlFilters = changes.urlFilters.newValue;
    }
    console.log('配置已更新:', userConfig);
    
    // 更新右键菜单
    updateContextMenu();
  }
});

// 创建或更新右键菜单
function updateContextMenu() {
  // 先移除所有现有菜单
  chrome.contextMenus.removeAll();
  
  // 创建新的右键菜单
  chrome.contextMenus.create({
    id: 'openWithExternalProgram',
    title: '使用外部程序打开链接',
    contexts: ['link'],
    onclick: function(info, tab) {
      if (info.linkUrl) {
        openWithExternalProgram(info.linkUrl);
      }
    }
  });
}

// 使用外部程序打开链接
function openWithExternalProgram(url) {
  console.log('使用外部程序打开链接:', url);
  
  // 替换命令中的{url}占位符
  const command = userConfig.command.replace('{url}', url);
  
  // 尝试使用Native Messaging与本地应用程序通信
  try {
    chrome.runtime.sendNativeMessage(
      'com.example.openwith',  // 本地应用程序的ID
      { command: command, url: url },
      function(response) {
        console.log('收到本地应用程序的响应:', response);
        
        if (response && response.success) {
          console.log('命令执行成功');
          // 可以在这里添加成功执行的提示
        } else {
          console.error('命令执行失败:', response ? response.error : '未知错误');
          // 如果Native Messaging失败，回退到显示命令页面
          fallbackToCommandPage(command, url);
        }
      }
    );
  } catch (e) {
    console.error('Native Messaging错误:', e);
    // 如果出现错误，回退到显示命令页面
    fallbackToCommandPage(command, url);
  }
}

// 回退到显示命令页面
function fallbackToCommandPage(command, url) {
  console.log('回退到显示命令页面');
  chrome.tabs.create({
    url: 'command.html?command=' + encodeURIComponent(command) + '&url=' + encodeURIComponent(url)
  });
}

// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('收到消息:', request);
  
  if (request.action === 'openWithExternalProgram' && request.url) {
    openWithExternalProgram(request.url);
    sendResponse({ success: true });
  } else {
    sendResponse({ success: false, error: '无效的请求' });
  }
  
  return true; // 保持消息通道开放，以便异步响应
});

// 初始化
function init() {
  // 加载配置
  loadUserConfig();
  
  // 创建右键菜单
  updateContextMenu();
}

// 插件安装或更新时执行初始化
chrome.runtime.onInstalled.addListener(function() {
  init();
});
