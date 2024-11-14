# 4. 自然语流

**音素**是构成自然语流的最基础单位。随后：

> * 一个或者多个音素构成**音节**；
> * 一个或者多个音节构成**词汇**；
> * 一个或者多个词汇构成**意群**；
> * 一个或者多个词汇构成**句子**；
> * 一个或者多个词汇构成**对话**或者**篇章**；

—— 而这基本上就是**自然语流**的构成过程。

在**自然语流**中，每个**音素**都可能存在一定的变化。

任何一个音素都一样，实际上并不存在一个像音乐音符那样可以 100% 精确的标准。时时刻刻，每个**音素**（或其组合，**音节**）都可能有**长短**、**强弱**、**高低**、**起伏**、**轻重**、**缓急**等等各个维度上并不统一的变化。

不仅如此，说话的每个人又有着各自的特质，包括但不限于无法一致的音质、音域、音量、语速、腔调、情绪，等等等等…… 也正因如此，最终每个人的说话方式都各不相同 —— 实际上是没办法完全相同。其实，不仅英语如此，地球上的所有语言都是如此。

即便是相同的单词，在同一句话里都常常读法并不完全相同，也无法完全相同 —— 注意两个相同的词的每个音节的**音高**和**声调**的不同：

> * **communication** <span class="pho alt">kəˌmjuː.nəˈkeɪ.ʃən</span>: Her *communication* skills are excellent, but her *communication* of the project details needs work.<span class="speak-word-inline" data-audio-us-male="/audios/Her-communication-skills-are-excellent-but-her-communication-of-the-project-details-needs-work-alloy.mp3" data-audio-us-female="/audios/Her-communication-skills-are-excellent-but-her-communication-of-the-project-details-needs-work-nova.mp3"></span>
> * **explanation** <span class="pho alt">ˌek.spləˈneɪ.ʃən</span>: The *explanation* you gave was clear, but I need a more detailed *explanation*.<span class="speak-word-inline" data-audio-us-male="/audios/The-explanation-you-gave-was-clear-but-I-need-a-more-detailed-explanation-alloy.mp3" data-audio-us-female="/audios/The-explanation-you-gave-was-clear-but-I-need-a-more-detailed-explanation-nova.mp3"></span>

1974 年，美国密西根州立大学（Michigan State University）的人工语言实验室的研究人员曾经打电话用机器生成的语音订购一块披萨[^1]…… 以下是机器语音合成 50 年前后的对比：

> Text: Would you please phrase that question so that I can answer it with yes or no?
> * 1974
>   * Michigan State University <span class="speak-word-inline" data-audio-us-male="/audios/segment-donald-sherman-ordered-a-pizza.mp3"></span>
> * 2024
>   * OpenAI TTS (Alloy)<span class="speak-word-inline" data-audio-us-male="/audios/Would-you-please-phrase-that-question-so-that-I-can-answer-it-with-yes-or-no_openai.mp3"></span> 
>   * Microsoft Edge TTS (en-US-GuyNeural)<span class="speak-word-inline" data-audio-us-male="/audios/Would-you-please-phrase-that-question-so-that-I-can-answer-it-with-yes-or-no_msedge.mp3"></span>

显然，模拟真人的自然语流，并不只是 “把每个音素朗读标准” —— 除此之外需要考虑的因素实在是太多，而各个维度的不同再组合起来就是天文数字的量级…… 乃至于需要将近 50 年的时间，以计算机算力的提高、算法的改良进步为前提，而后还要配合着大规模神经网络以及基于大语言模型的人工智能才有了如此极其接近 “真实” 的效果。

我们用自己的嗓音说话也是如此。要做的事情，不仅仅是 “把每个音素” 读准读好，也不仅仅是 “把每个单词读得像词典里的真人发音一样”，我们需要从多个维度调整自己 —— 当然很麻烦，不过，事实证明，也的确是能做到做好的事情。

[^1]: https://www.youtube.com/watch?v=94d_h_t2QAA