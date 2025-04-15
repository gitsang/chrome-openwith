// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
  // 加载配置并更新UI
  loadConfig();
  
  // 打开选项页面按钮事件
  document.getElementById('open-options').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
});

// 加载配置
function loadConfig() {
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
    // 更新命令
    document.getElementById('current-command').textContent = items.command;
    
    // 更新默认打开设置
    document.getElementById('default-open').textContent = items.defaultOpen ? '是' : '否';
    
    // 更新快捷键
    updateShortcutKeys(items.shortcutKey);
    
    // 更新过滤规则
    updateFilterList(items.urlFilters);
  });
}

// 更新快捷键显示
function updateShortcutKeys(shortcutKey) {
  const shortcutKeysElement = document.getElementById('shortcut-keys');
  shortcutKeysElement.innerHTML = '';
  
  const keys = [];
  if (shortcutKey.ctrl) keys.push('Ctrl');
  if (shortcutKey.shift) keys.push('Shift');
  if (shortcutKey.alt) keys.push('Alt');
  
  if (keys.length === 0) {
    shortcutKeysElement.textContent = '无';
    return;
  }
  
  keys.forEach(function(key) {
    const keyElement = document.createElement('span');
    keyElement.className = 'key';
    keyElement.textContent = key;
    shortcutKeysElement.appendChild(keyElement);
  });
  
  shortcutKeysElement.appendChild(document.createTextNode(' + 点击链接'));
}

// 更新过滤规则列表
function updateFilterList(filters) {
  const filterCountElement = document.getElementById('filter-count');
  const filterListElement = document.getElementById('filter-list');
  
  // 更新过滤规则数量
  if (filters.length === 0) {
    filterCountElement.textContent = '无（处理所有URL）';
    filterListElement.innerHTML = '<div class="no-filters">没有设置过滤规则</div>';
    return;
  } else {
    filterCountElement.textContent = `${filters.length}个规则`;
  }
  
  // 更新过滤规则列表
  filterListElement.innerHTML = '';
  filters.forEach(function(filter) {
    const filterItem = document.createElement('div');
    filterItem.className = 'filter-item';
    filterItem.textContent = filter;
    filterListElement.appendChild(filterItem);
  });
}
