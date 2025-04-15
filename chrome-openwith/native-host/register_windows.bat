@echo off
:: 注册Chrome Native Messaging Host
:: 此脚本需要以管理员权限运行

echo 注册 Open With External Program Native Host...

:: 获取当前目录的绝对路径
set CURRENT_DIR=%~dp0
set CURRENT_DIR=%CURRENT_DIR:~0,-1%

:: 设置Python脚本路径（根据需要修改）
set PYTHON_PATH=%CURRENT_DIR%\native-host.py
:: 或者使用Node.js脚本
:: set NODE_PATH=%CURRENT_DIR%\native-host.js

:: 创建启动脚本
echo @echo off > "%CURRENT_DIR%\launcher.bat"
echo python "%PYTHON_PATH%" %%* >> "%CURRENT_DIR%\launcher.bat"
:: 或者使用Node.js
:: echo node "%NODE_PATH%" %%* >> "%CURRENT_DIR%\launcher.bat"

:: 更新清单文件中的路径
set MANIFEST_PATH=%CURRENT_DIR%\com.example.openwith.json
set TEMP_FILE=%CURRENT_DIR%\temp.json

:: 使用PowerShell更新JSON文件
powershell -Command "(Get-Content '%MANIFEST_PATH%') -replace 'REPLACE_WITH_ABSOLUTE_PATH', '%CURRENT_DIR:\=\\%\\launcher.bat' | Set-Content '%TEMP_FILE%'"
move /y "%TEMP_FILE%" "%MANIFEST_PATH%" > nul

:: 获取扩展ID（如果已知）
set /p EXTENSION_ID=请输入Chrome扩展ID（在chrome://extensions/中查看）: 

:: 更新清单文件中的扩展ID
powershell -Command "(Get-Content '%MANIFEST_PATH%') -replace 'REPLACE_WITH_EXTENSION_ID', '%EXTENSION_ID%' | Set-Content '%TEMP_FILE%'"
move /y "%TEMP_FILE%" "%MANIFEST_PATH%" > nul

:: 注册到注册表
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.example.openwith" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f

echo.
echo 注册完成！
echo 清单文件路径: %MANIFEST_PATH%
echo.
echo 请重启Chrome浏览器以使更改生效。
echo.

pause
