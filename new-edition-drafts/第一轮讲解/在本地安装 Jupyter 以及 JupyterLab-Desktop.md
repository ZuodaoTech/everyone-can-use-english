## 在本地安装 Jupyter 以及 JupyterLab-Desktop

[Windows 用户安装方法点这里](#Windows用户)

### macOS 用户

macOS 系统自带的 Python 版本是 2.7，路径（path）通常是 `/usr/local/bin/python`；想要使用更高版本的 Python，必须自己动手安装。

### 1. 安装 Homebrew

先在 Terminal 里安装 `Homebrew`，以便将来用 `brew` 命令安装更多的软件：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. 安装 Miniconda

随后，就去可以用 `brew` 安装 Miniconda 了，它是一个小型的 Python 管理工具。

```bash
brew install miniconda
```

安装完成之后，还要在 Terminal 执行以下命令：

```bash
conda init "$(basename "${SHELL}")"
```

这一步很重要，这个命令会更改一些必要的系统文件，以便 `conda` 能够正常使用。在我的机器上，以上的命令更改了我的 `~/.zshrc` 文件，添加了以下内容（你也可以手动添加）：

```bash
# conda init "$(basename "${SHELL}")"
# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
__conda_setup="$('/opt/homebrew/Caskroom/miniconda/base/bin/conda' 'shell.zsh' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__conda_setup"
else
    if [ -f "/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh" ]; then
        . "/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh"
    else
        export PATH="/opt/homebrew/Caskroom/miniconda/base/bin:$PATH"
    fi
fi
unset __conda_setup
# <<< conda initialize <<<
```

随后，可以检查一下当前的 `conda` 状态：

```bash
which conda
conda --version
```

### 3. 确认 Python 版本

```bash
which -a python
# 应该可以看到至少两个 Python 的位置
# 将来用 JupyterLab-Desktop 安装的 Python 版本（目前默认是 v3.8.17）不会被检索到
# ~/Library/jupyterlab-desktop/jlab_server/bin/python
python --version
# 应该给出的是 Miniconda 安装的版本，比如，Python 3.11.5
```

在一台机器上，可以安装很多个 Python 版本，本质上来看，只不过是 “把某个版本及其相关的组件都放到同一个 ‘文件夹’（或者 ‘目录’）之下”，而后，处于该目录下的 ptyhon 解释器会调用该目录下的各种组件。

例如，`/opt/homebrew/Caskroom/miniconda/base/bin/python` 这个 python 解释器，调用的就是 `/opt/homebrew/Caskroom/miniconda/base/` 这个目录下的 Python 组件，而这个 “环境” 的名称就是 `base`，可以用 `conda activate base` 启用。

### 4. 安装 Jupyterlab Module

```bash
python -m pip install jupyterlab
```

### 5. 安装 JupyterLab-Desktop

```bash
brew install --cask jupyterlab
```

在 macOS 上，由于系统权限设置，Jupyterlab-Desktop 自带的命令行工具 `jlab` 需要手动安装：

```bash
sudo chmod 755 /Applications/JupyterLab.app/Contents/Resources/app/jlab
sudo ln -s /Applications/JupyterLab.app/Contents/Resources/app/jlab /usr/local/bin/jlab
```

可以选择使用 Jupyterlab-Desktop 自带的 “Bundled Python environment”，不过，它的 Python 版本是 3.8.17。这个 “Bundle” 中，Python 解释器是 `~/Library/jupyterlab-desktop/jlab_server/bin/python`；所有相关组件安装在 `~/Library/jupyterlab-desktop/jlab_server/` 文件夹之内。

![](../images/jld-3.8.png)

想要使用更高版本的 Python 及其环境，比如，Python 3.11.5，就得用我们自己在系统上使用 `conda` 安装的 Python 环境。

打开 JupyterLab-Desktop 之后，右上角会显示当前使用的 Python 环境名称，比如，最初的时候，默认是 `conda: jlab_server`…… 点击这个字符串，会跳出一个带有输入框的下拉菜单：

![](../images/jld-change-env.png)

在输入框里输入我们用 `conda` 安装的 Python 路径而后按 `Enter` 键即可：

```bash
# 用以下命令获取当前系统默认 Python 的路径：
which python
# 输出是：/opt/homebrew/Caskroom/miniconda/base/bin/python
# 把 "/opt/homebrew/Caskroom/miniconda/base/bin/python" 拷贝粘贴到输入框里
```

而后我们就可以在 JupyterLab-Destop 里面使用自己选择的 Python 版本了：

![](../images/jld-3.11.5.png)

有必要的话，可以在 JupyterLab-Desktop 的 `Settings > Server` 对话框里，把某个 Python 环境设置成 “默认”：

![](../images/jld-default-env.png)

### 6. jlab 命令使用

在 Terminal 里，使用以下命令 “以当前路径为工作路径打开 JupyterLab Desktop”（注意末尾的 `&`）：

```bash
jlab . &
```

如果忽略了末尾的 `&`，那么在使用 JupyterLab-Desktop 的时候，Terminal 就得一直打开着。

使用以下命令 “用 JupyterLab Desktop 打开某个 `.ipynb` 文件”，比如：

```bash
jlab sample.ipynb &
```

### 7. 使用 JupyterLab-Desktop 图形界面

当然，普通用户最适应的是 “图形界面”，JupyterLab-Desktop 的图形界面相对比较直观，很快就可以学会。最基础的，无非是几个最常用操作：

* `Shift+Enter`：执行某个单元格的代码；
* 连续按 `d` 两次：删除某个单元格；
* 指针拖拽：可以移动某个单元格，改变代码执行顺序；
* ……

### 8. 关于 Python 的基本使用

可以参照《[自学是门手艺](https://github.com/selfteaching/the-craft-of-selfteaching)》，也可以参照 [Python Cheatshee in Jupyter Notebookst](https://github.com/xiaolai/Python-Cheatsheets-in-Jupyter-Notebooks)。

### Windows用户

准备工作：网络通信正常

### 1、下载安装文件

1.[下载 Anaconda Python 环境管理器](https://www.anaconda.com/download#downloads)

点击 Windows 图标下面的 `64-Bit Graphical Installer ......` 下载文件

2.[下载 JupyterLab Desktop](https://github.com/jupyterlab/jupyterlab-desktop/releases)

点击  `...... Setup-Windows.exe` 下载文件

### 2、安装 Anaconda

找到下载的文件 `Anaconda3 ...... .exe` 双击运行安装向导，需要注意的是**下面这几个地方不要选错**：

![installJL-2](../images/win-installJL-2.png)

![installJL-3](../images/win-installJL-3.png)

确认无误再点击 Install 安装：

![installJL-4](../images/win-installJL-4.png)

> 在安装过程的最后一小段，电脑反应可能会变慢，感觉好像是卡住了，无需紧张，静静等待就好，因为安装过程中会执行各种解压、下载和安装命令。

当出现 Completed 字样，说明安装成功，我们 Next ：

![installJL-6](../images/win-installJL-5.png)

最后 Finish 的时候记得取消这个对勾：

![installJL-6](../images/win-installJL-6.png)

点击 Finish

### 3、配置 Anaconda Python 环境

安装完成后，系统会自动启动 Anaconda Navigator：

![installJL-7](../images/win-installJL-7.png)

Anaconda Navigator 提示有新版本，点击 No, remind me later 暂不升级：

![installJL-8](../images/win-installJL-8.png)

> 如果你对你的网络很有信心，你也可以现在升级，无论你是否升级，都不影响后续操作

点击窗口左侧的 Environments 进入环境配置：

![installJL-9](../images/win-installJL-9.png)

点击屏幕左下部分的 Create 按钮，新建一个新的 Python 环境，专门用于英语训练：

![installJL-10](../images/win-installJL-10.png)

> 尽可能不要破坏系统的 Python 环境，以防其他使用Python 的 APP 出问题

在弹出的对话框中，在 Name 这一行输入这个虚拟环境的名称  EnTrainEVM ：

![installJL-11](../images/win-installJL-11.png)

> 这个名称随便填啥都可以，只要自己看着顺眼即可；只是**不能**整成**中文或者纯数字**
>

在 Packages 选择 **Python 3.11.7**

点击 Create 创建环境

![installJL-12](../images/win-installJL-12.png)

这个时候你会看到右下角的进度条在蠕动，说明你创建的 Python 环境正在创建中

> 需要注意的是，整个创建过程中都需要通畅的网络链接，如果创建失败，99.9999% 都是网的问题。

看到下面这样的画面，说明环境创建成功！

![installJL-13](../images/win-installJL-13.png)

> 如果一开始你没有更新 Anaconda Navigator 可能会弹出新版本提示，我们同样点击 No, remind me later 暂不升级
>
> ![installJL-8](../images/win-installJL-8.png)

点击窗口左边的 Home 进入主页，往下滑，找到 Jupyter Lab 点击 Install 安装：

![installJL-17](../images/win-installJL-17.png)

![installJL-18](../images/win-installJL-19.png)

等右下角的进度条走完，说明安装成功！可以关闭 Anaconda Navigator 程序了。

此时，你用于英语训练的 Python 环境就**配置完成啦！**

### 4、安装 JupyterLab Desktop

找到下载目录，双击 `JupyterLab-Setup-Windows` 运行安装向导，此时系统会提示安装程序需要管理员权限，我们点 `是` 授权运行：

![installJL-15](../images/win-installJL-15.png)

点击我同意，安装立即开始

![installJL-14](../images/win-installJL-14.png)

安装完成，点击完成

### 5、配置 JupyterLab Desktop

系统会自动运行 JupyterLab Desktop 程序：

![installJL-16](../images/win-installJL-16.png)

我们点击 Open Folder 打开文件夹，找到存放学习资料的地方，点击 Open：

![installJL-21](../images/win-installJL-21.png)

在窗口的右上方，有一个蓝色的图标，点一下：

![installJL-23](../images/win-installJL-23.png)

在弹出的菜单里，选择我们刚才创建的 EnTrainEVM 英语练习环境：

![installJL-24](../images/win-installJL-24.png)

看到这个画面需要稍微等一下：

![installJL-25](../images/win-installJL-25.png)

当你看到这个画面，说明 JupyterLab Desktop 已经安装成功啦！

![installJL-26](../images/win-installJL-26.png)

### 6. jlab 命令使用

在 PowerShell 里，使用以下命令 “以当前路径为工作路径打开 JupyterLab Desktop” ：

```bash
jlab .
```

注意，用 PowerShell 里用 `jlab` 命令打开 JupyterLab-Desktop 的时候，PowerShell 窗口不能关闭（可以最小化）。

使用以下命令 “用 JupyterLab Desktop 打开某个 `.ipynb` 文件”，比如：

```bash
jlab sample.ipynb
```

### 7. 使用 JupyterLab-Desktop 图形界面

当然，普通用户最适应的是 “图形界面”，JupyterLab-Desktop 的图形界面相对比较直观，很快就可以学会。最基础的，无非是几个最常用操作：

* `Shift+Enter`：执行某个单元格的代码；
* 连续按 `d` 两次：删除某个单元格；
* 指针拖拽：可以移动某个单元格，改变代码执行顺序；
* ……

### 8. 关于 Python 的基本使用

可以参照《[自学是门手艺](https://github.com/selfteaching/the-craft-of-selfteaching)》，也可以参照 [Python Cheatshee in Jupyter Notebookst](https://github.com/xiaolai/Python-Cheatsheets-in-Jupyter-Notebooks)。
