# 与智能体对话

## 新建智能体

在 `聊天` 页面左侧栏右上角，点 `+` 按钮，弹出添加智能体对话框。

目前 Enjoy 的智能体支持两种类别：

- GPT
- TTS

GPT 智能体可以通过设定不同的提示语，扮演不同的角色，与用户进行文本对话。

TTS 智能体可以将用户输入的文本转换为语音，可以设定不同的语言和音色。

### GPT 智能体

当选择 GPT 类别时，Enjoy 内置了部分提示语的模板，可以从 `模板` 中选择。

![chat-gpt-select-template](/images/enjoy/chat-gpt-select-template.png)

选择任意模板后，智能体名称、描述、提示语会自动填充，也可以根据具体需求进行修改。

点 `保存` 按钮，智能体即创建成功。

### TTS 智能体

当选择 TTS 类别时，除了名称和描述，还需要对 TTS 进行配置。

- 语音引擎： 如果想使用自备 OpenAI 密钥，可以选择 `OpenAI`，否则选择 `EnjoyAI`。
- 语音模型： 当使用 `EnjoyAI` 时，支持 OpenAI 的两个模型，以及 `Azure/Speech`，后者支持更多语言和口音；
- TTS 语言： 仅对 `Azure/Speech` 有效，支持更多语言和口音；
- 语音音色： 当使用 `Azure/Speech` 时，不用语言对应多种音色，选择即可。

![chat-tts-config](/images/enjoy/chat-tts-agent.png)

点 `保存` 按钮，智能体即创建成功。

## 新建聊天

选择任意智能体，在左侧栏下点击 `新聊天` 按钮，即可开始对话。

GPT 智能体会根据**提示语的设定**回答用户的**任何问题**。

![chat-new-chat-gpt](/images/enjoy/chat-new-chat-gpt.png)

TTS 智能体会把用户输入的任意文本转换为语音。

![chat-new-chat-tts](/images/enjoy/chat-new-chat-tts.png)

## 聊天设置

在聊天中，点击右上角齿轮图标，可以对聊天、当前聊天成员进行详细设置。

![chat-settings](/images/enjoy/chat-settings.png)

![chat-member-settings](/images/enjoy/chat-member-settings.png)
