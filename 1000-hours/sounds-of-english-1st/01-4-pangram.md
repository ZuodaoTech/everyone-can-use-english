# 1.1.4. 示例

以下是一个 *English Phonetic Pangram*[^1]，52 个词的篇幅里包含了所有**元音**和**辅音**。

> Jane, a dramatic young girl, loves to read  books at leisure in rooms or play on a sunny day outdoor here and there under the trees with boys. She vowed to buy a red ear dog. She thought it was unique, for sure. Now she feeds it dough, nuts, and cheese bar.
>
> <span class="pho alt">dʒeɪn, ə drəˈmætɪk jʌŋ gəː(r)l, lʌvz tuː riːd bʊks æt ˈliːʒə(r) ɪn rumz ɔː(r) pleɪ ɒŋ ə ˈsʌni deɪ ˈaʊtˌdɔr hiə(r) ənd ðeə ˈʌndə(r) ðə triz wɪθ bɔɪz. ʃiː vaʊd tʊ baɪ ə red ɪə(r) dɒg. ʃiː θɒt ɪt wɒz juˈniːk, fə(r) ʃʊə(r). naʊ ʃiː fiːdz ɪt dəʊ, nʌts, ənd tʃiːz bɑː(r).</span>

Voice: Alloy (US Male)

> <audio controls><source src="/audios/phonetic-pangram-alloy.mp3" type="audio/mpeg">Your browser does not support the audio element.</source></audio>

Voice: Nova (US Female)

> <audio controls><source src="/audios/phonetic-pangram-nova.mp3" type="audio/mpeg">Your browser does not support the audio element.</source></audio>

注意，以上的 *Pangram* 也包括 <span class="pho">tr</span>、<span class="pho">dr</span>、<span class="pho">ts</span> 和 <span class="pho">dz</span>。


::: info
以上两条语音，Alloy 和 Nova，使用 OpenAI 的 TTS 引擎生成。而教程中其它的词汇音频，大多数使用 Microsoft 的 [EdgeTTS](https://github.com/rany2/edge-tts) 生成。
:::
-----

::: tip
音素在自然语流中经常会有变化，比如，*on a sunny day* 中的 *on* <span class="pho alt">ɒŋ</span>，由于后面紧跟着一个元音，所以，会被读成 <span class="pho alt">ɒn</span> —— 也就是说，<span class="pho">ŋ</span> 变成了 <span class="pho">n</span>（[2.2.3](15-mn)）……
:::

[^1]: 所谓 *pangram*，指的是一个尽可能短的包含所有字母的句子。*The quick brown fox jumps over the lazy dog.* 就是大家练打字的时候都用过的经典 *pangram*。
