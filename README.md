# 人人都能用英语

## 目录

- [简介](./book/README.md)
- [第一章：起点](./book/chapter1.md)
- [第二章：口语](./book/chapter2.md)
- [第三章：语音](./book/chapter3.md)
- [第四章：朗读](./book/chapter4.md)
- [第五章：词典](./book/chapter5.md)
- [第六章：语法](./book/chapter6.md)
- [第七章：精读](./book/chapter7.md)
- [第八章：叮嘱](./book/chapter8.md)
- [后记](./book/end.md)

## 应用

- [Enjoy App](./enjoy/README.md)

## * 开发者

### 本地启动

```bash
yarn install
yarn start:enjoy
```

### 编译

```bash
yarn make:enjoy
```

## * 普通小白用户

方法一：这是**最直接简单的方法**是去 [releases 页面](https://github.com/xiaolai/everyone-can-use-english/tags)下载相应的安装文件。

方法二：如果想要随时**试用更新版本**的话，请按一下步骤操作。

### MacOS 用户

1. 打开命令行工具 Terminal
2. 安装 Homebrew（请参阅这篇文章：《[从 Terminal 开始…](https://github.com/xiaolai/apple-computer-literacy/blob/main/start-from-terminal.md)》）
3. 安装 `nodejs` 以及 `yarn`：

   ```bash
   brew install nvm
   nvm install 20.5.1 
   brew install yarn
   ```
4. 克隆此仓库至本地，而后安装、启动：

   ```bash
   cd ~
   mkdir github
   cd github
   git clone https://github.com/xiaolai/everyone-can-use-english
   cd everyone-can-use-english
   yarn install
   yarn start:enjoy
   ```

### Windows 用户

系统要求：Windows 10 22H2 以上版本、 [Windows PowerShell 5.1](https://aka.ms/wmf5download) 以上版本、互联网网络连接正常。

1. 将鼠标移至任务栏的 “Windows 徽标” 上单击右键，选择 “PowerShell”

   > tips 1 ：在最新的 Windows 11 上，你看不到 “PowerShell” 选项，只有 “终端”
   >
   > tips 2 ：不能用管理员权限运行 PowerShell ，否则会导致 Scoop 安装失败
   >
2. 在弹出的 PowerShell 窗口中依次执行运行以下命令，安装Scoop：

   ```powershell
   # 设置 PowerShell 执行策略
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   # 下载安装脚本
   irm get.scoop.sh -outfile 'install.ps1'
   # 执行安装, --ScoopDir 参数指定 Scoop 安装路径
   .\install.ps1 -ScoopDir 'C:\Scoop'
   ```

   如果出现下面的错误：

   > `<span style="color:red">`irm : 未能解析此远程名称: 'raw.githubusercontent.com'
   >

   说明你的**网络连接**有问题，请自行研究解决：
3. 安装 Nodejs 和 yarn 以及其他依赖环境 ：

   ```powershell
   scoop install nodejs
   scoop install git
   npm install yarn -D
   ```
4. 克隆此仓库至本地，而后安装 Enjoy APP：

   ```powershell
   cd ~
   mkdir github
   cd github
   git clone https://github.com/xiaolai/everyone-can-use-english
   cd everyone-can-use-english
   cd enjoy
   yarn install
   yarn start:enjoy
   ```

   出现 `Completed in XXXXXXXXXX` 类似字样说明安装成功！
5. 运行 Enjoy APP ，在终端执行下列命令：

   ```powershell
   yarn start:enjoy
   ```

## 更新Enjoy

更新并使用最新版本的Enjoy：

1. 将仓库最新内容拉取到本地，在命令行工具中执行：

   ```bash
   git pull
   ```
   结果显示为：

   ```shell
   Already up to date.
   ```

   若非如此，那么意味着代码有所更新，那么就要运行以下命令：

   ```bash
   yarn install
   ```

2. 运行Enjoy APP：

   ```shell
   yarn start:enjoy
   ```
