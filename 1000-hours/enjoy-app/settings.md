# 软件设置

Enjoy 只需要登录后即可直接使用，**无需其他设置**。但是，你仍然可以根据需要做个性化的设置。

打开 Enjoy 软件，点击左侧栏最下面的齿轮按钮，即可打开 `软件设置`。

## 基本设置

### 母语

请选择您的母语，默认为`简体中文`。

请注意，此设定关系到学习过程中的翻译内容、分析等，并不影响软件的界面语言。

### 学习语言

请选择您要学习的语言，默认为 `English(United States)`。

### 语音转文本服务

::: info 设置路径
软件设置 -> 基本设置 -> 语音转文本服务
:::

语音转文本（即 STT，Speech to Text）服务是 Enjoy 提供的核心功能之一，也是 [跟读训练](./audios.md#跟读音频) 的前提条件。

此处设置为默认值，在语音转文本时仍可选择不同服务。

<details>
<summary>
本地(whisper)
</summary>

该设置默认项为 `本地`，即利用 Enjoy 集成的 whisper 组件，完全利用本地计算机的算力提供 STT 服务，该服务完全免费。

Enjoy 默认选择 whisper 模型 `tiny.en`，如果电脑配置较高，可以选用更大的模型以提高语音转文本的准确度。

::: tip 关于 whisper 模型的选择
首次使用时，程序会自动下载模型，选择的模型越大，下载所需要的时间也越长。推荐一般使用 `medium` 以下模型即可。

理论上，模型越大，识别的准确度也更高，但是运行得越慢，甚至在一些配置不高的电脑中无法运行。

凡是以 `.en` 结尾的模型均只支持英文，识别英文准确性也更高，例如 `base.en`；而不以 `.en` 结尾的模型则可以支持多种语言，例如 `base`。
:::

::: warning 检查本地 whisper 服务
有些电脑或者系统（例如 macOS 11）可能会因为兼容性问题（或其他未知问题）无法使用本地的 whisper 服务。点击 `检查` 按钮即可检查 whisper 服务在本地计算机是否工作正常。如果提示无法正常工作，可以选用其他服务。
:::
</details>

<details>
<summary>
Azure AI STT
</summary>

利用微软 Azure AI 的语音识别 API 服务提供的 STT，该服务为**收费服务**，每次使用均会在 Enjoy 账户余额中扣费，，余额不足则需要 [充值](#充值) 后才可继续使用。
</details>

<details>
<summary>
Cloudflare AI STT
</summary>

利用 Cloudflare 提供的 whisper 云服务，该服务目前免费。经实测，对于一些时长较短的音频，识别会有较大误差。
</details>

<details>
<summary>
OpenAI STT
</summary>

利用 OpenAI 提供的 whipser 云服务，该服务需要[配置自己的 OpenAI 密钥](#openai-配置)。
</details>

### 文字转语音服务

::: info 设置路径
软件设置 -> 基本设置 -> 文字转语音服务
:::

文字转语音（即 TTS，Text to Speech）可以将文本合成为语音，以便于跟读训练。此处设置为默认值，在文字转语音时仍可选择不同服务。

EnjoyAI 除了提供 OpenAI 的 TTS 服务，还集成了 Azure 的 TTS 服务，语音模型选择 `azure/speech` 即可。 Azure TTS 提供了更丰富的音色供选择。

### 默认 AI 引擎

::: info 设置路径
软件设置 -> 基本设置 -> 默认 AI 引擎
:::

Enjoy 中提供了很多方便的功能。

默认值为 `Enjoy AI`，由 Enjoy 提供该服务，每次使用均会在账户余额中扣费，余额不足则需要 [充值](#充值) 后才可继续使用。EnjoyAI 提供了除 OpenAI 以外，目前流行的热门模型，用户可以灵活选用。

如果您配备了可用的 [OpenAI 密钥](#openai-配置)，也可以将 **默认 AI 引擎** 选为 `OpenAI`。

在默认模型，您还可以对不同的服务选用不同的模型。

## 词典设置

### 词典导入

::: info 设置路径
软件设置 -> 词典设置 -> 词典导入
:::

#### 导入 Enjoy 适配过的词典

| 词典名称 | 语言 | 支持发音 | 文件名 | 大小 |
| -------- | ---- | -------- | ------ | ------ |
| Longman Dictionary of Contemporary English | 英-英 / 英-中 | 是 | ldocd5.zip | 1.63GB |
| Collins COBUILD Advanced British EN-CN Dictionary | 英-中 | 否 | ccalecd.zip | 13.879MB |
| Collins COBUILD Advanced British English Learners Dictionary | 英-英 | 是 | ccabeld.zip | 485.6MB |
| Oxford Dictionary of English | 英-英 | 否 | oxford_en_mac.zip | 33.6MB |
| Korean English Dictionary | 韩-英 | 否 | koen_mac.zip | 52.1MB |
| Japanese English Dictionary | 日-英 | 否 | jaen_mac.zip | 39.8MB |
| German English Dictionary | 德-英 | 否 | deen_mac.zip | 32.1MB |
| Russian English Dictionary | 俄-英 | 否 | ruen_mac.zip | 18.1MB |

::: tip 下载词典
网盘下载： [链接](https://pan.baidu.com/share/init?surl=zK-dHs40HpfYNUEdoYxZUw)
提取码: 7975
:::

下载 `zip` 格式的词典文件后，点击 `导入词典` 按钮，即可导入词典。

#### 导入 mdx 词典

mdx 词典是 mdict 格式的词典文件。

如果下载的 mdict 词典只有一个 `.mdx` 文件，则可以直接导入。如果下载的 mdict 词典包含有多个文件，导入时应该选择所有文件，包括 `.mdx` `.mdd` `.js` 等文件。

## 高级设置

### API 设置

设置 Enjoy 服务的 API 地址。默认为 `https://enjoy.bot`。

### 代理设置

为 Enjoy App 设置代理服务。

### 网络状态

检查 Enjoy 客户端与服务端之间的网络状态。

### OpenAI 配置

::: info 设置路径
软件设置 -> 基本设置 -> OpenAI
:::

配置 OpenAI API 密钥，可以在 [官网](https://platform.openai.com/api-keys) 申请。配置好的 OpenAI 服务可以在 [聊天](./chat.md)等服务中使用。

- 密钥：OpenAI API 密钥
- 模型：默认使用的模型
- 接口地址：如果使用的是官方申请的密钥，则不需要填；否则请根据密钥提供方的信息填写。

::: warning 接口地址
由于 OpenAI 在某些地区不提供服务，有些用户会使用第三方提供的中转服务。请务必根据服务提供方的信息填写好 **接口地址**。如果使用时出现报错，可能需要在接口地址结尾加上 `/v1`。
:::

### 重置设置选项

退出登录并将 Enjoy App 的所有设置重置为默认值。

### 重置所有

将退出登录，并删除所有个人数据。

## 账户设置

### 资源库保存路径

::: info 设置路径
软件设置 -> 基本设置 -> 资源库保存路径
:::

Enjoy 采用 **本地优先** 的设计原则，大部分数据均保存在本地，即 **资源库保存路径** 下。
所谓资源库是一个名为 `EnjoyLibrary` 的文件夹，默认放置在 `My Documents` （即 `我的文档`）下。

随着 Enjoy 的使用时间增长，资源库文件夹里可能会产生比较大的缓存文件，导致占用空间较大。根据具体需要，你也可以修改资源库的路径，例如从 _C 盘_ 改到空间更大的 _D 盘_。

如果已经产生了数据，修改时，可以先把原来的 `EnjoyLibrary` 文件夹复制到目标路径下，再在 Enjoy 软件中点`修改`按钮，选中目标路径，然后重启软件，即可完成修改。

::: tip 资源库里都有什么
打开 `EnjoyLibrary` 文件夹，你能看到类似以下的目录结构

```
.
├── 2400xxxx
│   ├── audios
│   │   ├── 0687ae31c4178bbf0466503e56d887f8.mp3
│   │   └── ...
│   ├── enjoy_database.sqlite
│   ├── recordings
│   │   ├── 025542894635903d5ea6f2395cb404c0.wav
│   │   └── ...
│   ├── speeches
│   │   ├── 0687ae31c4178bbf0466503e56d887f8.mp3
│   │   └── ...
│   └── videos
│       ├── 23876d46305bae2e049c691872dd3cde.mkv
│       └── ...
├── cache
│   ├── 0687ae31c4178bbf0466503e56d887f8.json
│   └── ...
├── logs
│   ├── main.log
│   └── main.old.log
├── waveforms
│   ├── 0687ae31c4178bbf0466503e56d887f8.waveform.json
│   └── ...
└── whisper
│   ├── models
│   │   ├── tiny.en.bin
│   │   └── ...
```

- `/2400xxxx/`: 登录的 Enjoy 帐号 ID，该文件夹下的数据均是你使用产生的个人数据
  - `/2400xxxx/audios/`: 添加的音频文件
  - `/2400xxxx/speeches/`: TTS 生成的语音文件
  - `/2400xxxx/videos/`: 添加的视频文件
  - `/2400xxxx/recordings/`: 录音文件
  - `/2400xxxx/enjoy_database.sqlite`: 个人数据库文件
- `/cache/`: 使用过程中产生的缓存文件，如果占用空间过大，可以安全地删除
- `/logs/`: 保存软件运行的日志，用于帮助开发人员排除故障
- `/waveforms/`: 音视频解码后的波形数据缓存
- `/whisper/models`: 语音转文字服务软件 whisper 的模型文件

:::

::: danger 个人数据安全
`EnjoyLibrary/2400xxxx/` 文件夹下保存的均为使用 Enjoy 过程中产生的个人数据，请务必**不要删改**该文件夹下的任何文件，否则可能会导致数据丢失，或者使得 Enjoy 软件无法正常运行。

如前文所说，Enjoy 采用本地优先的设计原则，绝大部分数据并没有上传云服务器，请妥善保管好自己的个人数据。
:::

### 磁盘使用情况

点击 `详情` 可查看当前 Enjoy App 资源库的磁盘使用情况。

点击 `释放磁盘` 可以批量删除录音文件，释放磁盘空间。

### 充值

::: info 设置路径
软件设置 -> 账户设置 -> 余额
:::

Enjoy 提供了部分收费的 AI 服务，均为 **按使用量收费**，每次使用会在余额中扣除相应的费用，直到余额不足，则停止提供该服务。

如果需要继续使用，请点击 `充值` 按钮进行充值。

::: danger 充值前须知
需要特别注意的是，充值成功后将在 Enjoy 账户的余额体现，所有余额仅可作为支付 Enjoy 收费服务使用，**不支持退款**，**不支持提现**。

请谨慎考虑，按需充值。
:::

## 快捷键

Enjoy App 可用的快捷键，点击键位可以修改。

## 外观

可修改主题和界面语言。

## 关于

当前版本和更新链接。
