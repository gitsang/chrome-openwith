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

// 当前过滤规则列表
let currentFilters = [];

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
  // 加载保存的配置
  loadSavedConfig();
  
  // 添加过滤规则按钮事件
  document.getElementById('add-filter').addEventListener('click', addFilter);
  
  // 保存按钮事件
  document.getElementById('save').addEventListener('click', saveOptions);
  
  // 回车键添加过滤规则
  document.getElementById('url-filter').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addFilter();
    }
  });
});

// 加载保存的配置
function loadSavedConfig() {
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
    
    // 更新UI
    document.getElementById('command').value = userConfig.command;
    document.getElementById('default-open').checked = userConfig.defaultOpen;
    document.getElementById('ctrl-key').checked = userConfig.shortcutKey.ctrl;
    document.getElementById('shift-key').checked = userConfig.shortcutKey.shift;
    document.getElementById('alt-key').checked = userConfig.shortcutKey.alt;
    
    // 更新过滤规则列表
    currentFilters = userConfig.urlFilters.slice();
    updateFilterList();
  });
}

// 添加过滤规则
function addFilter() {
  const filterInput = document.getElementById('url-filter');
  const filterText = filterInput.value.trim();
  
  if (filterText) {
    // 验证正则表达式是否有效
    try {
      new RegExp(filterText);
      
      // 添加到列表
      if (currentFilters.indexOf(filterText) === -1) {
        currentFilters.push(filterText);
        updateFilterList();
        filterInput.value = '';
      } else {
        showStatus('该规则已存在', false);
      }
    } catch (e) {
      showStatus('无效的正则表达式: ' + e.message, false);
    }
  }
}

// 移除过滤规则
function removeFilter(index) {
  currentFilters.splice(index, 1);
  updateFilterList();
}

// 更新过滤规则列表UI
function updateFilterList() {
  const filterList = document.getElementById('filter-list');
  filterList.innerHTML = '';
  
  if (currentFilters.length === 0) {
    filterList.innerHTML = '<div class="filter-item">没有过滤规则，将处理所有URL</div>';
    return;
  }
  
  currentFilters.forEach(function(filter, index) {
    const filterItem = document.createElement('div');
    filterItem.className = 'filter-item';
    
    const filterText = document.createElement('div');
    filterText.className = 'filter-text';
    filterText.textContent = filter;
    filterItem.appendChild(filterText);
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-filter';
    removeButton.textContent = '删除';
    removeButton.addEventListener('click', function() {
      removeFilter(index);
    });
    filterItem.appendChild(removeButton);
    
    filterList.appendChild(filterItem);
  });
}

// 保存选项
function saveOptions() {
  const command = document.getElementById('command').value.trim();
  const defaultOpen = document.getElementById('default-open').checked;
  const ctrlKey = document.getElementById('ctrl-key').checked;
  const shiftKey = document.getElementById('shift-key').checked;
  const altKey = document.getElementById('alt-key').checked;
  
  // 验证命令
  if (!command) {
    showStatus('请输入有效的命令', false);
    return;
  }
  
  // 验证命令中是否包含{url}占位符
  if (command.indexOf('{url}') === -1) {
    showStatus('命令必须包含{url}占位符', false);
    return;
  }
  
  // 保存配置
  chrome.storage.sync.set({
    command: command,
    defaultOpen: defaultOpen,
    shortcutKey: {
      ctrl: ctrlKey,
      shift: shiftKey,
      alt: altKey
    },
    urlFilters: currentFilters
  }, function() {
    showStatus('设置已保存', true);
  });
}

// 显示状态消息
function showStatus(message, success) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + (success ? 'success' : 'error');
  status.style.display = 'block';
  
  setTimeout(function() {
    status.style.display = 'none';
  }, 3000);
}
