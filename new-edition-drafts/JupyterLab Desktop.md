# JupyterLab Desktop

JupyterLab 是一个主要为 Python 设计的交互式开发环境。它的重要特点之一是可以用 “单元格”（Cell）将程序划分为若干部分，而后可以 “逐格” 执行，大大降低了非专业程序员使用 Python 的难度，使得更多的学生、教师、科学家、研究人员能够利用 Python 提高各种类数据分析或者人工智能应用等工作的效率。

其实，很多的时候，即便不懂编程，也能 “使用用编程语言写出来的程序”，因为 “程序”，无非是 “一行又一行的代码”，所谓的 “使用程序”，在 JupyterLab 里其实不过是 “用快捷键 `Shift + Enter` 执行某个单元格内的代码片段“ 而已…… 这是 “能操作键盘的人” 都能做的事情。

Jupyter Notebook 文件的尾缀是 `.ipynb`，想要在本地运行，需要事先安装 `JupyterLab`（命令行环境安装）或者 `Jupyter Desktop`（图形界面安装）。比本地运行对新手来说更为方便的是直接使用 Google Colab（https://colab.research.google.com）。

登录 Colab 之后，`File` 菜单里有 `Upload` 命令，直接将以下文件上传之后打开即可。

注意，以下文件中的代码片段 `IPython.display.Audio(speech_file_path)` 在 Colab 中不会正常显示，但，程序生成的 `.mp3` 文件，可以通过点击界面左侧的文件夹图标看到，而其中的每个文件都可以点击下载。

![google-colab-audio-download](/Users/joker/Desktop/google-colab-audio-download.png)



JupyterLab Desktop 是 JupyterLab 的桌面版本，它是一个独立的基于 Electron  开发的跨平台应用程序，无需通过网络浏览器，这使它更加方便和高效。

* 第零阶段：直接用 Google Colaboratory。2023 年 11 月 1 日，`%%python --verision`，给出的版本是 `3.10.12`
* 第一阶段：用最快最野蛮的方式用上 JupyterLab，以及 Desktop 版本。
  * 熟悉 Jupyter Notebook 的基本操作。
  * 学习编程的最基础概念。
  * 而后直接开始使用各种程序。
* 第三阶段：本地安装多个 Python 版本，必要的时候切换；以及如何在 Jupyter Desktop 上切换不同的 Python 版本与环境。



### 安装 JupyterLab-Desktop

安装 JupyterLab-Desktop 在 macOS 和 Windows 上的步骤相似，但有一些细微的差别。

#### 在 macOS 上安装 JupyterLab-Desktop

1. 打开你的网络浏览器，访问 JupyterLab-Desktop 的 GitHub 中的 Release 页面：https://github.com/jupyterlab/jupyterlab-desktop/releases，在 `Assets` 中找到最新版本。
2. 根据你的操作系统选择对应的安装文件。对于 macOS，你应该选择 ".dmg" 文件。注意，如果你的 Mac 是基于 Silicon 芯片（M1/M2/M3），那么，你要下载的 `.dmg` 文件名应该是 `JupyterLab-Setup-macOS-arm64.dmg`。
3. 点击下载，等待下载完成。
4. 打开下载的 ".dmg" 文件，将 JupyterLab-Desktop 拖拽到你的 "Applications" 文件夹。
5. 打开 "Applications" 文件夹，找到 JupyterLab-Desktop，双击打开。

#### 在 Windows 上安装 JupyterLab-Desktop

1. 打开你的网络浏览器，访问 JupyterLab-Desktop 的 GitHub 中的 Release 页面：https://github.com/jupyterlab/jupyterlab-desktop/releases，在 `Assets` 中找到最新版本。

3. 根据你的操作系统选择对应的安装文件。对于 Windows，你应该选择 ".exe" 文件，其文件名是 `JupyterLab-Setup-Windows.exe`

4. 点击下载，等待下载完成。

5. 找到下载的 ".exe" 文件，双击打开。

6. 在打开的安装向导中，按照提示进行操作，完成安装。

7. 安装完成后，你可以在开始菜单或桌面找到 JupyterLab-Desktop 的快捷方式，双击打开。

### 安装 Python 最新版本

Windows 系统并未自带 Python，而 macOS 中系统自带的 Python 是 2.7.x 版本；而 JupyterLab Desktop 虽然自带 Python 环境，却并非最新版本；所以，无论如何，都需要自行手动安装 Python 的最新版本。

#### 在 macOS 上安装 

1. 首先安装 [Homebrew](https://brew.sh/)。打开 Terminal，拷贝粘贴以下命令而后执行：
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. 安装 `Miniconda`。在 Terminal 中拷贝粘贴以下命令而后执行：
   ```bash
   brew install miniconda
   ```

3. 检查 Python 版本。在 Terminal 中分别执行以下命令：
   ```bash
   python --version
   which python
   conda uninstall python
   conda install python=3.11.5
   ```

4. 安装 Jupyterlab。在 Terminal 中执行以下命令：
   ```bash
   pip install jupyterlab
   ```

#### 在 Windows 上安装 

1. 安装 Miniconda：

   - 打开你的网络浏览器，访问 Miniconda 的下载页面：https://docs.conda.io/en/latest/miniconda.html；根据你的操作系统选择对应的安装文件。对于 Windows，你应该选择 ".exe" 文件。

   - 点击下载，等待下载完成。

   - 找到下载的 ".exe" 文件，双击打开。

   - 在打开的安装向导中，按照提示进行操作，完成安装。

2. 安装 Python 3：

   - 打开 Command Prompt（命令提示符）。

   - 使用 conda（Miniconda 的包管理器）来安装 Python 3：

     ```bash
     conda install python=3
     ```

   - 安装完成后，你可以通过以下命令检查 Python 的版本：

     ```bash
     python --version
     ```

3. 安装 JupyterLab：

   - 在 Command Prompt 中，使用 conda 来安装 JupyterLab：

     ```bash
     pip install jupyterlab
     ```


关于 Python 的路径设置，当你安装 Miniconda 时，它会询问你是否要将 Python 添加到你的 PATH。你应该选择 "Yes"。如果你没有这样做，或者你需要修改 Python 的路径，你可以按照以下步骤操作：

1. 打开 Control Panel（控制面板）。

2. 点击 "System and Security"，然后点击 "System"。

3. 点击 "Advanced system settings"。

4. 在弹出的窗口中，点击 "Environment Variables"。

5. 在 "System variables" 部分，找到 "Path"，然后点击 "Edit"。

6. 在弹出的窗口中，点击 "New"，然后输入 Python 的路径。例如，如果你的 Python 安装在 "C:\Miniconda3"，你应该输入 "C:\Miniconda3" 和 "C:\Miniconda3\Scripts"。

7. 点击 "OK" 保存更改。

### 在 JupyterLab Desktop 中指定 Python 环境

