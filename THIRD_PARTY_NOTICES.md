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
