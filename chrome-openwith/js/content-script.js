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
  }
});

// 检查URL是否匹配过滤规则
function matchUrlFilter(url) {
  if (!userConfig.urlFilters || userConfig.urlFilters.length === 0) {
    return true; // 没有过滤规则，所有URL都匹配
  }
  
  for (let filter of userConfig.urlFilters) {
    try {
      const regex = new RegExp(filter);
      if (regex.test(url)) {
        return true;
      }
    } catch (e) {
      console.error('无效的正则表达式:', filter, e);
    }
  }
  
  return false;
}

// 检查是否应该使用外部程序打开链接
function shouldOpenWithExternalProgram(event) {
  // 检查快捷键
  const shortcutMatch = (
    (!userConfig.shortcutKey.ctrl || event.ctrlKey) &&
    (!userConfig.shortcutKey.shift || event.shiftKey) &&
    (!userConfig.shortcutKey.alt || event.altKey)
  );
  
  // 如果配置了默认打开，或者快捷键匹配
  return userConfig.defaultOpen || shortcutMatch;
}

// 处理链接点击事件
document.addEventListener('click', function(event) {
  // 查找被点击的链接元素
  let linkElement = event.target;
  while (linkElement && linkElement.tagName !== 'A') {
    linkElement = linkElement.parentElement;
  }
  
  // 如果找到链接元素
  if (linkElement && linkElement.href) {
    const url = linkElement.href;
    
    // 检查URL是否匹配过滤规则
    if (!matchUrlFilter(url)) {
      return; // 不匹配过滤规则，使用默认行为
    }
    
    // 检查是否应该使用外部程序打开
    if (shouldOpenWithExternalProgram(event)) {
      event.preventDefault(); // 阻止默认行为
      
      // 发送消息给后台脚本，请求使用外部程序打开链接
      chrome.runtime.sendMessage({
        action: 'openWithExternalProgram',
        url: url
      }, function(response) {
        console.log('打开链接的响应:', response);
      });
    }
  }
}, true);

// 添加右键菜单项
document.addEventListener('contextmenu', function(event) {
  // 查找右键点击的链接元素
  let linkElement = event.target;
  while (linkElement && linkElement.tagName !== 'A') {
    linkElement = linkElement.parentElement;
  }
  
  // 如果找到链接元素
  if (linkElement && linkElement.href) {
    const url = linkElement.href;
    
    // 检查URL是否匹配过滤规则
    if (matchUrlFilter(url)) {
      // 将URL存储在自定义属性中，以便右键菜单处理程序使用
      document.body.setAttribute('data-openwith-url', url);
    }
  }
}, true);
