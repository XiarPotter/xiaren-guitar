# 第三方资源说明

## MediaPipe Tasks Vision 0.10.21

- 上游项目：https://github.com/google-ai-edge/mediapipe
- npm 包：https://www.npmjs.com/package/@mediapipe/tasks-vision/v/0.10.21
- 文件：`vendor/vision_bundle.mjs`、`vendor/wasm/*`
- 许可：Apache License 2.0，副本见 `vendor/LICENSE.mediapipe`。
- 这些文件为上游分发文件，未修改。

## Hand Landmarker 模型

- 官方文档：https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
- 下载来源：https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
- 本地文件：`vendor/hand_landmarker.task`
- 模型为官方 MediaPipe 手部识别模型，未修改；使用及再分发请遵守上游适用条款和许可。

## Google Fonts

页面通过 Google Fonts 请求 DM Sans；未将字体文件打包到仓库，加载失败时使用系统字体。


## 吉他采样（tonejs-instruments）

- 维护者：Nicholaus P. Brosowsky / nbrosowsky。
- 来源：https://github.com/nbrosowsky/tonejs-instruments
- 采样许可：CC BY 3.0（https://creativecommons.org/licenses/by/3.0/），上游 README 明确区分采样许可与代码 MIT 许可。
- 木吉他上游来源：University of Iowa Musical Instrument Samples。
- 尼龙吉他上游来源：Freesound / quartertone / 11573 classicalguitar-multisampled。
- 文件：`samples/acoustic/*.mp3`、`samples/nylon/*.mp3`，选取原始 MP3 文件，未编辑；播放时会做音量归一化、移调和短淡入淡出。
- 上游许可声明及来源清单随附于 `samples/UPSTREAM-README.md`、`samples/UPSTREAM-LICENSE.md`、`samples/UPSTREAM-sample-source-info.txt`。其中 LICENSE.md 是代码的 MIT 许可，音频适用上文 CC BY 3.0。
