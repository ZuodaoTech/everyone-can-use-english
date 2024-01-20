# 这篇文章会教你如何配置 Enjoy APP



Enjoy APP 的下载和安装请参考[这里](find-compatible-software-version.md)



在开始配置 Enjoy APP 之前，需要提前做好下列准备工作：

- 通畅的国际网络环境
- OpenAI API （拿到 API key） 
- Mixin Messenger APP  请提前注册登陆：
  - [Android APK 安装包](https://newbie.zeromesh.net/mixin-android.apk)
  - [iOS 用户需要外区 Apple ID 下载](https://messenger.mixin.one/zh/download?platform=iOS)


## 1、登陆及环境配置

点击 Mixin Messenger

<img src="enjoy-software-setup-guide-IMG/setup-1.png" alt="img" style="zoom:50%;" />

使用 Mixin Messenger 扫码登录，此时打开你的手机里的 Mixin Messenger APP 扫码

<img src="enjoy-software-setup-guide-IMG/setup-2.png" alt="img" style="zoom:50%;" />

下一步

<img src="enjoy-software-setup-guide-IMG/setup-3.png" alt="img" style="zoom:50%;" />

下一步

<img src="enjoy-software-setup-guide-IMG/setup-4.png" alt="img" style="zoom:50%;" />

模型的大小主要是影响的识别效果，根据自己的情况按需下载（觉得效果不好后面也能改），下载完之后，就可以点击下一步了

> **下载模型需要通畅的网络环境**，请自己研究。

<img src="enjoy-software-setup-guide-IMG/setup-5.png" alt="img" style="zoom:50%;" />

点击Download FFmpeg ，然后等待安装完成

<img src="enjoy-software-setup-guide-IMG/setup-6.png" alt="img" style="zoom:50%;" />

安装完毕后，进行下一步

<img src="enjoy-software-setup-guide-IMG/setup-7.png" alt="img" style="zoom:50%;" />

完成

<img src="enjoy-software-setup-guide-IMG/setup-8.png" alt="img" style="zoom:50%;" />

## 2、软件设置

### 设置语言

左下角有个设置的图标，点一下，设置语言，选择简体中文

![img](enjoy-software-setup-guide-IMG/20240118143442246.png)

![img](enjoy-software-setup-guide-IMG/20240118143442645.png)

### 配置“智能助手”相关设定

#### 1、设置 OpenAI 的 API key

![img](enjoy-software-setup-guide-IMG/20240118143442275.png)

**在哪里获取 OpenAI key ？**

1、在 [OpenAI API](https://platform.openai.com/) 官方网站注册账号并付款购买：需要有 OpenAI 支持国家的信用卡，如果你在 OpenAI 不支持的地区使用 OpenAI API，还得使用支持地区的魔法上网工具。

2、使用第三方提供的中转 OpenAI API ：使用价格稍贵，通信内容可能被监听，服务商有跑路风险，这里不做推荐，请自行判断风险后使用。

#### 2、设置智能助手调用的 AI 模型

点击智能助手，点击新对话（我使用过了，所以有历史）

![img](enjoy-software-setup-guide-IMG/20240118143442338.png)

点击右上角设置

![img](enjoy-software-setup-guide-IMG/20240118143445541.png)

如果你有 API key 有 GPT-4.0 的使用权限，选择 gpt-4 开头的模型，框框里的都可以

![img](enjoy-software-setup-guide-IMG/20240118143446466.png)

如果你的 API key 只有 GPT-3.5 的使用权限，选择 gpt-3.5 的模型，框框里的都可以

![img](enjoy-software-setup-guide-IMG/20240118143443033.png)

#### 3、设置地址

向下拉到最下面，在下面两个**请求地址**里填上：OpenAI API 的调用地址

例如：https://api.openai.com/ 这个是 OpenAI 官方的API 调用地址。

也就是说，请求地址填什么，需要找你的 API 供应商索取，如果调用地址错误，肯定是无法使用智能助手的。

![img](enjoy-software-setup-guide-IMG/20240118143442962.png)

## 3、开始使用

1、编辑好你今天要练习的口语材料，发给智能助手，稍等片刻，智能助手会回复你对应的英文

2、点击文字转语音（等待生成语音，需要花一点时间）

![img](enjoy-software-setup-guide-IMG/20240118143444166.png)

第三步：点击跟读训练

![img](enjoy-software-setup-guide-IMG/20240118143443795.png)

4、开始大声朗读

要达到效果每天**至少3个小时！！！**

![img](enjoy-software-setup-guide-IMG/20240118143444301.png)

其他的功能自己琢磨下吧，不难的哈，相信你可以的！

## Q&A

### 1、提示 401 无效的令牌：

![img](enjoy-software-setup-guide-IMG/20240119000348669.png)

出现这种错误，只有一种可能性：你的 OpenAI API Key **输入错误**或**没有配置**，[点击这里查看如何配置OpenAI API Key](#‘1、设置 OpenAI 的 API key’)

### 2、提示 “ connetion error ” ：

![img](enjoy-software-setup-guide-IMG/20240119001134952.png)

这说明你输入的请求地址**无法链接**：

1、首先检查请求地址**是否输入正确**；

2、如果你用的是 OpenAI 官方直连的 API 请求地址，请检查你的网络环境**是否支持直连**；

3、如果你用的第三方中转 API 请联系服务提供商**确认准确的请求地址**。

请求地址[在这里设置](#'3、设置地址')



### 3、点击 “ 语音转文本 ” 一直转圈，没有文本输出

![img](enjoy-software-setup-guide-IMG/20240119001749133.png)

由于 “语音转文本” 的模型是**在本地计算机上运行**的，对本地的硬件（如：GPU）性能**有一定要求**，如果长时间没有输出，可以按下面方法操作**切换较小的模型尝试**：

![img](enjoy-software-setup-guide-IMG/20240119002100968.png)

![img](enjoy-software-setup-guide-IMG/20240119002059956.png)

![img](enjoy-software-setup-guide-IMG/20240119002117220.png)

如果小模型依然无法输出文本，那你需要考虑升级一台 GPU 性能较为主流的计算机了……

### 4、重试大法

如果在学习过程中出现转圈或卡死等无响应的情况：

![img](enjoy-software-setup-guide-IMG/20240119003120029.png)

切换到其他页面，再切回来重试即可解决部分问题。

## 总结

经过这两天，大家给我的反馈，总结一下，大家安装过程中遇到的坑。

> 我是 Windows 电脑哈，Mac 电脑的同学也可以参考。

首先，最大的问题就是 OpenAI API key 不对，导致一系列错误；

其次，没有 Mixin Messenger APP ，下载软件后无法登录。

只要你能解决这两个问题，同时电脑性能还够用，按照我的方法来操作，基本上不会出问题。

最后，祝大家都可以用上自己的 AI 英语教练~