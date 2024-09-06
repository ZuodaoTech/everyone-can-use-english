import { t } from "i18next";

export const TTS_PROVIDERS: { [key: string]: any } = {
  enjoyai: {
    name: "EnjoyAI",
    models: ["openai/tts-1", "openai/tts-1-hd", "azure/speech"],
    voices: {
      openai: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
      azure: [
        {
          label: "Katja (Female)",
          value: "de-DE-KatjaNeural",
          language: "de-DE",
        },
        {
          label: "Conradl (Male)",
          value: "de-DE-ConradNeural",
          language: "de-DE",
        },
        {
          label: "Amala (Female)",
          value: "de-DE-AmalaNeural",
          language: "de-DE",
        },
        {
          label: "Bernd (Male)",
          value: "de-DE-BerndNeural",
          language: "de-DE",
        },
        {
          label: "Christoph (Male)",
          value: "de-DE-ChristophNeural",
          language: "de-DE",
        },
        {
          label: "Elke (Female)",
          value: "de-DE-ElkeNeural",
          language: "de-DE",
        },
        {
          label: "Gisela (Female, Child)",
          value: "de-DE-GiselaNeural",
          language: "de-DE",
        },
        {
          label: "Kasper (Male)",
          value: "de-DE-KasperNeural",
          language: "de-DE",
        },
        {
          label: "Killian (Male)",
          value: "de-DE-KillianNeural",
          language: "de-DE",
        },
        {
          label: "Klarissa (Female)",
          value: "de-DE-KlarissaNeural",
          language: "de-DE",
        },
        {
          label: "Klaus (Male)",
          value: "de-DE-KlausNeural",
          language: "de-DE",
        },
        {
          label: "Louisa (Female)",
          value: "de-DE-LouisaNeural",
          language: "de-DE",
        },
        {
          label: "Maja (Female)",
          value: "de-DE-MajaNeural",
          language: "de-DE",
        },
        { label: "Ralf (Male)", value: "de-DE-RalfNeural", language: "de-DE" },
        {
          label: "Tanja (Female)",
          value: "de-DE-TanjaNeural",
          language: "de-DE",
        },
        {
          label: "Sonia (Female)",
          value: "en-GB-SoniaNeural",
          language: "en-GB",
        },
        { label: "Ryan (Male)", value: "en-GB-RyanNeural", language: "en-GB" },
        {
          label: "Libby (Female)",
          value: "en-GB-LibbyNeural",
          language: "en-GB",
        },
        {
          label: "Abbi (Female)",
          value: "en-GB-AbbiNeural",
          language: "en-GB",
        },
        {
          label: "Alfie (Male)",
          value: "en-GB-AlfieNeural",
          language: "en-GB",
        },
        {
          label: "Bella (Female)",
          value: "en-GB-BellaNeural",
          language: "en-GB",
        },
        {
          label: "Elliot (Male)",
          value: "en-GB-ElliotNeural",
          language: "en-GB",
        },
        {
          label: "Ethan (Male)",
          value: "en-GB-EthanNeural",
          language: "en-GB",
        },
        {
          label: "Hollie (Female)",
          value: "en-GB-HollieNeural",
          language: "en-GB",
        },
        {
          label: "Maisie (Female, Child)",
          value: "en-GB-MaisieNeural",
          language: "en-GB",
        },
        { label: "Noah (Male)", value: "en-GB-NoahNeural", language: "en-GB" },
        {
          label: "Oliver (Male)",
          value: "en-GB-OliverNeural",
          language: "en-GB",
        },
        {
          label: "Olivia (Female)",
          value: "en-GB-OliviaNeural",
          language: "en-GB",
        },
        {
          label: "Thomas (Male)",
          value: "en-GB-ThomasNeural",
          language: "en-GB",
        },
        { label: "Ava (Female)", value: "en-US-AvaNeural", language: "en-US" },
        {
          label: "Andrew (Male)",
          value: "en-US-AndrewNeural",
          language: "en-US",
        },
        {
          label: "Emma (Female)",
          value: "en-US-EmmaNeural",
          language: "en-US",
        },
        {
          label: "Brian (Male)",
          value: "en-US-BrianNeural",
          language: "en-US",
        },
        {
          label: "Jenny (Female)",
          value: "en-US-JennyNeural",
          language: "en-US",
        },
        { label: "Guy (Male)", value: "en-US-GuyNeural", language: "en-US" },
        {
          label: "Aria (Female)",
          value: "en-US-AriaNeural",
          language: "en-US",
        },
        {
          label: "Davis (Male)",
          value: "en-US-DavisNeural",
          language: "en-US",
        },
        {
          label: "Jane (Female)",
          value: "en-US-JaneNeural",
          language: "en-US",
        },
        {
          label: "Jason (Male)",
          value: "en-US-JasonNeural",
          language: "en-US",
        },
        {
          label: "Sara (Female)",
          value: "en-US-SaraNeural",
          language: "en-US",
        },
        { label: "Tony (Male)", value: "en-US-TonyNeural", language: "en-US" },
        {
          label: "Nancy (Female)",
          value: "en-US-NancyNeural",
          language: "en-US",
        },
        {
          label: "Amber (Female)",
          value: "en-US-AmberNeural",
          language: "en-US",
        },
        {
          label: "Ana (Female, Child)",
          value: "en-US-AnaNeural",
          language: "en-US",
        },
        {
          label: "Ashley (Female)",
          value: "en-US-AshleyNeural",
          language: "en-US",
        },
        {
          label: "Brandon (Male)",
          value: "en-US-BrandonNeural",
          language: "en-US",
        },
        {
          label: "Christopher (Male)",
          value: "en-US-ChristopherNeural",
          language: "en-US",
        },
        {
          label: "Cora (Female)",
          value: "en-US-CoraNeural",
          language: "en-US",
        },
        {
          label: "Elizabeth (Female)",
          value: "en-US-ElizabethNeural",
          language: "en-US",
        },
        { label: "Eric (Male)", value: "en-US-EricNeural", language: "en-US" },
        {
          label: "Jacob (Male)",
          value: "en-US-JacobNeural",
          language: "en-US",
        },
        {
          label: "Michelle (Female)",
          value: "en-US-MichelleNeural",
          language: "en-US",
        },
        {
          label: "Monica (Female)",
          value: "en-US-MonicaNeural",
          language: "en-US",
        },
        {
          label: "Roger (Male)",
          value: "en-US-RogerNeural",
          language: "en-US",
        },
        {
          label: "Steffan (Male)",
          value: "en-US-SteffanNeural",
          language: "en-US",
        },
        {
          label: "AIGenerate1 (Male)",
          value: "en-US-AIGenerate1Neural",
          language: "en-US",
        },
        {
          label: "AIGenerate2 (Female)",
          value: "en-US-AIGenerate2Neural",
          language: "en-US",
        },
        {
          label: "Elvira (Female)",
          value: "es-ES-ElviraNeural",
          language: "es-ES",
        },
        {
          label: "Alvaro (Male)",
          value: "es-ES-AlvaroNeural",
          language: "es-ES",
        },
        {
          label: "Abril (Female)",
          value: "es-ES-AbrilNeural",
          language: "es-ES",
        },
        {
          label: "Arnau (Male)",
          value: "es-ES-ArnauNeural",
          language: "es-ES",
        },
        {
          label: "Dario (Male)",
          value: "es-ES-DarioNeural",
          language: "es-ES",
        },
        {
          label: "Elias (Male)",
          value: "es-ES-EliasNeural",
          language: "es-ES",
        },
        {
          label: "Estrella (Female)",
          value: "es-ES-EstrellaNeural",
          language: "es-ES",
        },
        {
          label: "Irene (Female)",
          value: "es-ES-IreneNeural",
          language: "es-ES",
        },
        {
          label: "Laia (Female)",
          value: "es-ES-LaiaNeural",
          language: "es-ES",
        },
        { label: "Lia (Female)", value: "es-ES-LiaNeural", language: "es-ES" },
        { label: "Nil (Male)", value: "es-ES-NilNeural", language: "es-ES" },
        { label: "Saul (Male)", value: "es-ES-SaulNeural", language: "es-ES" },
        { label: "Teo (Male)", value: "es-ES-TeoNeural", language: "es-ES" },
        {
          label: "Triana (Female)",
          value: "es-ES-TrianaNeural",
          language: "es-ES",
        },
        {
          label: "Vera (Female)",
          value: "es-ES-VeraNeural",
          language: "es-ES",
        },
        {
          label: "Ximena (Female)",
          value: "es-ES-XimenaNeural",
          language: "es-ES",
        },
        {
          label: "Denise (Female)",
          value: "fr-FR-DeniseNeural",
          language: "fr-FR",
        },
        {
          label: "Henri (Male)",
          value: "fr-FR-HenriNeural",
          language: "fr-FR",
        },
        {
          label: "Alain (Male)",
          value: "fr-FR-AlainNeural",
          language: "fr-FR",
        },
        {
          label: "Brigitte (Female)",
          value: "fr-FR-BrigitteNeural",
          language: "fr-FR",
        },
        {
          label: "Celeste (Female)",
          value: "fr-FR-CelesteNeural",
          language: "fr-FR",
        },
        {
          label: "Claude (Male)",
          value: "fr-FR-ClaudeNeural",
          language: "fr-FR",
        },
        {
          label: "Coralie (Female)",
          value: "fr-FR-CoralieNeural",
          language: "fr-FR",
        },
        {
          label: "Eloise (Female, Child)",
          value: "fr-FR-EloiseNeural",
          language: "fr-FR",
        },
        {
          label: "Jacqueline (Female)",
          value: "fr-FR-JacquelineNeural",
          language: "fr-FR",
        },
        {
          label: "Jerome (Male)",
          value: "fr-FR-JeromeNeural",
          language: "fr-FR",
        },
        {
          label: "Josephine (Female)",
          value: "fr-FR-JosephineNeural",
          language: "fr-FR",
        },
        {
          label: "Maurice (Male)",
          value: "fr-FR-MauriceNeural",
          language: "fr-FR",
        },
        { label: "Yves (Male)", value: "fr-FR-YvesNeural", language: "fr-FR" },
        {
          label: "Yvette (Female)",
          value: "fr-FR-YvetteNeural",
          language: "fr-FR",
        },
        {
          label: "Elsa (Female)",
          value: "it-IT-ElsaNeural",
          language: "it-IT",
        },
        {
          label: "Isabella (Female)",
          value: "it-IT-IsabellaNeural",
          language: "it-IT",
        },
        {
          label: "Diego (Male)",
          value: "it-IT-DiegoNeural",
          language: "it-IT",
        },
        {
          label: "Benigno (Male)",
          value: "it-IT-BenignoNeural",
          language: "it-IT",
        },
        {
          label: "Calimero (Male)",
          value: "it-IT-CalimeroNeural",
          language: "it-IT",
        },
        {
          label: "Cataldo (Male)",
          value: "it-IT-CataldoNeural",
          language: "it-IT",
        },
        {
          label: "Fabiola (Female)",
          value: "it-IT-FabiolaNeural",
          language: "it-IT",
        },
        {
          label: "Fiamma (Female)",
          value: "it-IT-FiammaNeural",
          language: "it-IT",
        },
        {
          label: "Gianni (Male)",
          value: "it-IT-GianniNeural",
          language: "it-IT",
        },
        {
          label: "Imelda (Female)",
          value: "it-IT-ImeldaNeural",
          language: "it-IT",
        },
        {
          label: "Irma (Female)",
          value: "it-IT-IrmaNeural",
          language: "it-IT",
        },
        {
          label: "Lisandro (Male)",
          value: "it-IT-LisandroNeural",
          language: "it-IT",
        },
        {
          label: "Palmira (Female)",
          value: "it-IT-PalmiraNeural",
          language: "it-IT",
        },
        {
          label: "Pierina (Female)",
          value: "it-IT-PierinaNeural",
          language: "it-IT",
        },
        {
          label: "Rinaldo (Male)",
          value: "it-IT-RinaldoNeural",
          language: "it-IT",
        },
        {
          label: "Giuseppe (Male)",
          value: "it-IT-GiuseppeNeural",
          language: "it-IT",
        },
        {
          label: "NanamiNeural (Female)",
          value: "ja-JP-NanamiNeural",
          language: "ja-JP",
        },
        {
          label: "KeitaNeural (Male)",
          value: "ja-JP-KeitaNeural",
          language: "ja-JP",
        },
        {
          label: "AoiNeural (Female)",
          value: "ja-JP-AoiNeural",
          language: "ja-JP",
        },
        {
          label: "DaichiNeural (Male)",
          value: "ja-JP-DaichiNeural",
          language: "ja-JP",
        },
        {
          label: "MayuNeural (Female)",
          value: "ja-JP-MayuNeural",
          language: "ja-JP",
        },
        {
          label: "NaokiNeural (Male)",
          value: "ja-JP-NaokiNeural",
          language: "ja-JP",
        },
        {
          label: "ShioriNeural (Female)",
          value: "ja-JP-ShioriNeural",
          language: "ja-JP",
        },
        {
          label: "SunHi (Female)",
          value: "ko-KR-SunHiNeural",
          language: "ko-KR",
        },
        {
          label: "InJoon (Male)",
          value: "ko-KR-InJoonNeural",
          language: "ko-KR",
        },
        {
          label: "BongJin (Male)",
          value: "ko-KR-BongJinNeural",
          language: "ko-KR",
        },
        {
          label: "GookMin (Male)",
          value: "ko-KR-GookMinNeural",
          language: "ko-KR",
        },
        {
          label: "JiMin (Female)",
          value: "ko-KR-JiMinNeural",
          language: "ko-KR",
        },
        {
          label: "SeoHyeon (Female)",
          value: "ko-KR-SeoHyeonNeural",
          language: "ko-KR",
        },
        {
          label: "SoonBok (Female)",
          value: "ko-KR-SoonBokNeural",
          language: "ko-KR",
        },
        {
          label: "YuJin (Female)",
          value: "ko-KR-YuJinNeural",
          language: "ko-KR",
        },
        {
          label: "Hyunsu (Male)",
          value: "ko-KR-HyunsuNeural1",
          language: "ko-KR",
        },
        {
          label: "Xiaoxiao (Female)",
          value: "zh-CN-XiaoxiaoNeural",
          language: "zh-CN",
        },
        {
          label: "Yunxi (Male)",
          value: "zh-CN-YunxiNeural",
          language: "zh-CN",
        },
        {
          label: "Yunjian (Male)",
          value: "zh-CN-YunjianNeural",
          language: "zh-CN",
        },
        {
          label: "Xiaoyi (Female)",
          value: "zh-CN-XiaoyiNeural",
          language: "zh-CN",
        },
        {
          label: "Yunyang (Male)",
          value: "zh-CN-YunyangNeural",
          language: "zh-CN",
        },
        {
          label: "Xiaochen (Female)",
          value: "zh-CN-XiaochenNeural",
          language: "zh-CN",
        },
        {
          label: "Xiaohan (Female)",
          value: "zh-CN-XiaohanNeural",
          language: "zh-CN",
        },
        {
          label: "Xiaomeng (Female)",
          value: "zh-CN-XiaomengNeural",
          language: "zh-CN",
        },
        {
          label: "Xiaomo (Female)",
          value: "zh-CN-XiaomoNeural",
          language: "zh-CN",
        },
        {
          label: "Xiaoqiu (Female)",
          value: "zh-CN-XiaoqiuNeural",
          language: "zh-CN",
        },
        {
          label: "Xiaorui (Female)",
          value: "zh-CN-XiaoruiNeural",
          language: "zh-CN",
        },
        {
          label: "Xiaoshuang (Female, Child)",
          value: "zh-CN-XiaoshuangNeural",
          language: "zh-CN",
        },
        {
          label: "Xiaoyan (Female)",
          value: "zh-CN-XiaoyanNeural",
          language: "zh-CN",
        },
        {
          label: "Xiaoyou (Female, Child)",
          value: "zh-CN-XiaoyouNeural",
          language: "zh-CN",
        },
        {
          label: "Xiaozhen (Female)",
          value: "zh-CN-XiaozhenNeural",
          language: "zh-CN",
        },
        {
          label: "Yunfeng (Male)",
          value: "zh-CN-YunfengNeural",
          language: "zh-CN",
        },
        {
          label: "Yunhao (Male)",
          value: "zh-CN-YunhaoNeural",
          language: "zh-CN",
        },
        {
          label: "Yunxia (Male)",
          value: "zh-CN-YunxiaNeural",
          language: "zh-CN",
        },
        {
          label: "Yunye (Male)",
          value: "zh-CN-YunyeNeural",
          language: "zh-CN",
        },
        {
          label: "Yunze (Male)",
          value: "zh-CN-YunzeNeural",
          language: "zh-CN",
        },
        {
          label: "Xiaorou (Female)",
          value: "zh-CN-XiaorouNeural",
          language: "zh-CN",
        },
        {
          label: "XiaoxiaoDialects (Female)",
          value: "zh-CN-XiaoxiaoDialectsNeural",
          language: "zh-CN",
        },
        {
          label: "Yunjie (Male)",
          value: "zh-CN-YunjieNeural",
          language: "zh-CN",
        },
        {
          label: "HiuMaan (Female)",
          value: "zh-HK-HiuMaanNeural",
          language: "zh-HK",
        },
        {
          label: "WanLung (Male)",
          value: "zh-HK-WanLungNeural",
          language: "zh-HK",
        },
        {
          label: "HiuGaai (Female)",
          value: "zh-HK-HiuGaaiNeural",
          language: "zh-HK",
        },
        {
          label: "Premwadee (Female)",
          value: "th-TH-PremwadeeNeural",
          language: "th-TH",
        },
        {
          label: "Niwat (Male)",
          value: "th-TH-NiwatNeural",
          language: "th-TH",
        },
        {
          label: "Achara (Male)",
          value: "th-TH-AcharaNeural",
          language: "th-TH",
        },
        {
          label: "An (Female)",
          value: "vi-VN-HoaiMyNeural",
          language: "vi-VN",
        },
        {
          label: "Hoai (Male)",
          value: "vi-VN-NamMinhNeural",
          language: "vi-VN",
        },
        {
          label: "Giang (Female)",
          value: "vi-VN-NgocHoaiGiangNeural",
          language: "vi-VN",
        },
        {
          label: "Linh (Female)",
          value: "vi-VN-ThanhLinhNeural",
          language: "vi-VN",
        },
        {
          label: "Mai (Female)",
          value: "vi-VN-HuuMaiNeural",
          language: "vi-VN",
        },
        {
          label: "Nam (Male)",
          value: "vi-VN-HoaiNamNeural",
          language: "vi-VN",
        },
      ],
    },
    configurable: ["model", "language", "voice"],
  },
  openai: {
    name: "OpenAI",
    description: t("youNeedToSetupApiKeyBeforeUsingOpenAI"),
    models: ["tts-1", "tts-1-hd"],
    voices: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
    configurable: ["model", "language", "voice", "baseUrl"],
  },
};
