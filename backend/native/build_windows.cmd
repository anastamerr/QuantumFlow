@echo off
setlocal

set "PYTHON_EXE=%~1"
if not defined PYTHON_EXE set "PYTHON_EXE=%~dp0..\.venv\Scripts\python.exe"

set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
if not exist "%VSWHERE%" (
  echo Visual Studio Installer vswhere.exe was not found.
  exit /b 1
)

for /f "usebackq tokens=*" %%i in (`"%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do set "VS_INSTALL=%%i"
if not defined VS_INSTALL (
  echo Visual Studio C++ Build Tools were not found.
  exit /b 1
)

call "%VS_INSTALL%\Common7\Tools\VsDevCmd.bat" -arch=x64
if errorlevel 1 exit /b %errorlevel%

cmake -S "%~dp0." -B "%~dp0build" -G Ninja -DCMAKE_BUILD_TYPE=Release -DPython3_EXECUTABLE="%PYTHON_EXE%"
if errorlevel 1 exit /b %errorlevel%

cmake --build "%~dp0build"
exit /b %errorlevel%
