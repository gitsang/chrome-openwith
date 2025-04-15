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
  
  // 在这里，我们只能模拟执行外部命令
  // 实际上，Chrome扩展无法直接执行系统命令
  // 需要使用Native Messaging与本地应用程序通信
  // 或者使用其他方式，如自定义协议处理程序
  
  // 这里我们只是打开一个新标签页，显示要执行的命令
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
