# 常见问题

## 为什么本地语音转文本服务无法使用？

Enjoy 集成了 [whipser.cpp](https://github.com/ggerganov/whisper.cpp) 作为本地的语音转文本（STT）服务，但是由于兼容性的问题，某些配置较低或者操作系统版本较低的电脑无法使用。

如果您遇到这种情况，Enjoy 提供了其他 STT 的云服务，可以前往 [软件设置](./settings#语音转文本服务) 进行配置。推荐优先使用 Azure AI。

## 403 Insufficient balance

遇到这个报错，说明您正在使用 Enjoy 的付费功能，但是账户余额不足了。

Enjoy 内有很多功能都由 AI 驱动，比如[智能助手](./ai-assistant)、智能翻译、句子分析等。如果您在 [软件设置](./settings#默认-ai-引擎) 中的配置了 `OpenAI` 作为默认 AI 引擎，在使用这些功能时候，会使用您配置的 OpenAI 信息进行实现，不会涉及 Enjoy 的扣费。

（需要注意的是，[智能助手](./ai-assistant) 的对话一旦创建，AI 引擎无法修改。如果需要切换，比如由 Enjoy AI 换成 Open AI，则需要新建一个对话）

另外，[发音评估](./audios#发音评估) 是收费功能，并非 OpenAI 提供，所以无论 [默认 AI 引擎](./settings#默认-ai-引擎) 选了什么，使用发音评估时，总是会在 Enjoy 账户中扣费。

如果需要充值，请参考[充值](./settings#充值)。

## 如何下载音频、录音

Enjoy 提供了音频、视频、录音的下载功能，以便可以在其他设备使用。
