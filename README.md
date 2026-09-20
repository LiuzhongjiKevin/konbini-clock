# 雨町 · 深夜便利店（独立部署版）

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

一个可以自己部署的 Three.js 便利店小场景。

页面会按照北京时间自动切换早上、中午、黄昏和夜晚，并通过服务端调用高德天气 API，把北京市实时天气映射为晴天、雨天或雪天。你也可以关闭“自动”开关，用页面右上角的滑块手动切换场景。

## 用 Codex、Claude Code 等智能体部署

在 Codex、Claude Code、Cursor 等编码智能体中打开一个用于存放项目的工作目录，然后直接复制下面这段话发送给智能体。提示词包含完整的 GitHub 地址，因此不需要提前下载本项目：

```text
请帮我部署这个项目：

https://github.com/LiuzhongjiKevin/konbini-clock

请先把仓库克隆到一个新的 konbini-clock 目录；如果同名目录已经存在，不要覆盖，先检查它是否为该项目并告诉我。

然后阅读 README.md 和 .env.example，检查 Docker 与 Docker Compose 是否可用。如果 .env 不存在，请复制 .env.example 创建 .env。

不要读取、显示、提交或上传我的真实 AMAP_WEATHER_KEY。只提示我在本地编辑 .env，并等待我确认已经填写完成。

确认后运行 docker compose up -d --build，检查 docker compose ps、/healthz 和 /api/weather，最后告诉我正确的访问地址和检查结果。

未经我明确同意，不要删除或覆盖现有目录、容器、镜像或其他文件。
```

智能体提示你填写 Key 时，请只在本地 `.env` 文件中填写，不要把真实 Key 发送到聊天窗口。项目已经通过 `.gitignore` 和 `.dockerignore` 排除 `.env`，但仍应在每次提交前确认它没有进入 Git。

## 场景预览

### 夜晚 · 雨天

![夜晚雨天便利店场景](docs/images/scene-night-rain.png)

### 黄昏 · 雪天

![黄昏雪天便利店场景](docs/images/scene-dusk-snow.png)

### 早上 · 晴天

![早上晴天便利店场景](docs/images/scene-morning-clear.png)

## 一、开始前需要准备什么

你需要准备：

- 一台安装了 Docker 的电脑或服务器。
- Docker Compose。现在的 Docker Desktop 和新版 Docker Engine 通常已经自带。
- 一个高德开放平台的 **Web 服务 Key**。
- 一个没有被其他程序占用的端口，默认使用 `8080`。

先确认 Docker 可以正常工作：

```bash
docker --version
docker compose version
```

两条命令都能显示版本号，就可以继续。

## 二、申请高德天气 Key

1. 登录高德开放平台控制台。
2. 创建一个应用，例如命名为“雨町便利店”。
3. 在应用中添加 Key。
4. “服务平台”必须选择 **Web 服务**，不要选择“Web 端（JS API）”。
5. 保存生成的 Key，下一步会用到。

项目从服务器调用高德接口，Key 不会发送给访问网页的浏览器。

## 三、配置项目

进入项目目录：

```bash
cd ame-konbini-selfhost
```

复制环境变量示例文件。

Windows PowerShell：

```powershell
Copy-Item .env.example .env
notepad .env
```

Linux 或 macOS：

```bash
cp .env.example .env
nano .env
```

把 `.env` 修改成下面这样：

```dotenv
AMAP_WEATHER_KEY=这里替换成你的高德Web服务Key
PORT=8080
HOST=0.0.0.0
```

参数说明：

- `AMAP_WEATHER_KEY`：高德 Web 服务 Key。
- `PORT`：浏览器访问本机服务时使用的端口。
- `HOST`：保持 `0.0.0.0`，容器外部才能访问服务。

如果 `8080` 已被占用，可以改成其他端口，例如：

```dotenv
PORT=6920
```

此时访问地址也要改成 `http://127.0.0.1:6920`。

## 四、构建并启动

在项目目录执行：

```bash
docker compose up -d --build
```

第一次运行需要下载 Node.js 基础镜像，可能会等待几分钟。命令结束后检查容器状态：

```bash
docker compose ps
```

看到 `healthy` 或 `Up` 表示服务已经启动。

如果 `.env` 中使用默认端口 `8080`，浏览器打开：

```text
http://127.0.0.1:8080
```

如果填写的是 `PORT=6920`，则打开：

```text
http://127.0.0.1:6920
```

## 五、确认实时天气是否连接成功

浏览器打开下面的地址：

```text
http://127.0.0.1:8080/api/weather
```

端口不是 `8080` 时，请替换成你在 `.env` 中设置的端口。

连接成功时会看到类似内容：

```json
{
  "weather": "clear",
  "description": "多云",
  "temperature": 26,
  "source": "高德天气",
  "city": "北京"
}
```

也可以在命令行检查：

```bash
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/api/weather
```

健康检查应返回：

```json
{"ok":true}
```

## 六、自动切换规则

页面打开时会立即请求一次天气。之后在“自动”模式开启且页面可见时：

- 浏览器每 **30 分钟**请求一次本站的 `/api/weather`。
- 服务端成功获取高德天气后缓存 **30 分钟**。
- 多个浏览器同时访问时，会共同使用服务端缓存，避免重复消耗高德 API 额度。
- 高德接口失败后，服务端至少等待 60 秒才允许再次尝试。
- 页面被隐藏或关闭“自动”模式时，不会定时刷新天气。

北京时间与场景的对应关系：

| 北京时间 | 场景时间 |
| --- | --- |
| 06:00–10:59 | 早上 |
| 11:00–15:59 | 中午 |
| 16:00–18:59 | 黄昏 |
| 19:00–次日 05:59 | 夜晚 |

高德天气与场景的对应关系：

| 高德天气 | 场景天气 |
| --- | --- |
| 各类雨、雷阵雨 | 雨天 |
| 各类雪、雨夹雪、冰粒 | 雪天 |
| 晴、多云、阴、雾、霾、风、沙尘 | 晴天 |

因此，高德返回“阴”或“多云”时，页面显示晴天场景是正常设计。

## 七、修改配置后如何重新启动

只执行 `docker compose restart` 不一定会把新的环境变量写入已有容器。

修改 `.env` 后建议执行：

```bash
docker compose up -d --force-recreate
```

修改了代码后执行：

```bash
docker compose up -d --build --force-recreate
```

查看运行日志：

```bash
docker compose logs -f
```

停止并删除容器：

```bash
docker compose down
```

## 八、构建并推送到镜像仓库

下面以 `registry.example.com/yourname/ame-konbini:1.0.0` 为示例，请替换为你自己的镜像仓库地址和用户名。

构建镜像：

```bash
docker build -t registry.example.com/yourname/ame-konbini:1.0.0 .
```

登录并推送：

```bash
docker login registry.example.com
docker push registry.example.com/yourname/ame-konbini:1.0.0
```

在另一台机器拉取镜像：

```bash
docker pull registry.example.com/yourname/ame-konbini:1.0.0
```

直接运行仓库中的镜像：

```bash
docker run -d \
  --name amemachi \
  --restart unless-stopped \
  --env-file .env \
  -e HOST=0.0.0.0 \
  -e PORT=8080 \
  -p 8080:8080 \
  registry.example.com/yourname/ame-konbini:1.0.0
```

这里的 `-e PORT=8080` 表示容器内部始终监听 `8080`。如果希望浏览器通过本机 `6920` 端口访问，只改端口映射左侧：

```bash
-p 6920:8080
```

访问地址就是 `http://127.0.0.1:6920`。

> `.env` 不会被复制进镜像。部署到云平台时，必须在平台的环境变量或 Secrets 设置中添加 `AMAP_WEATHER_KEY`，然后重新部署容器。

## 九、不使用 Docker 启动

需要 Node.js `22.12.0` 或更高版本。项目没有第三方 npm 运行依赖，因此不需要执行 `npm install`。

```bash
cp .env.example .env
# 编辑 .env 并填写 AMAP_WEATHER_KEY
npm start
```

然后访问 `.env` 中 `PORT` 对应的地址。

## 十、常见问题

### 页面打不开

先运行：

```bash
docker compose ps
```

确认容器正在运行，并确认浏览器使用的是 `.env` 中的 `PORT`，而不是固定访问 `8080`。

### 页面一直显示“正在连接天气”

打开 `/api/weather` 查看错误：

- `KEY_MISSING`：运行中的容器没有收到 `AMAP_WEATHER_KEY`。
- `UPSTREAM_UNAVAILABLE`：Key 类型错误、Key 无权限、额度不足，或者服务器无法访问高德接口。
- `404` 或返回网页 HTML：只部署了静态文件，Node 服务没有运行，或者反向代理没有转发 `/api/weather`。

### 已经修改 `.env`，但还是旧配置

重新创建容器：

```bash
docker compose up -d --force-recreate
```

### 天气看起来没有变化

检查以下项目：

1. 页面右上角“自动”是否开启。
2. `/api/weather` 是否返回正常 JSON。
3. 当前天气是否为晴、阴、多云、雾等；这些天气都会使用晴天场景。
4. 浏览器是否打开了旧页面；可以按 `Ctrl + F5` 强制刷新。

## 十一、Nginx 反向代理示例

需要通过域名访问时，可以把 Nginx 转发到本机容器端口：

```nginx
server {
    listen 80;
    server_name scene.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

正式对公网开放时，建议配置 HTTPS。

## 十二、安全提醒

- 不要把真实高德 Key 写进 `Dockerfile`、前端 JavaScript 或公开仓库。
- `.env` 已经被 `.gitignore` 和 `.dockerignore` 排除。
- 如果 Key 曾经公开，请立即到高德控制台重新生成，并按需设置调用限制。

## 许可证

本项目采用 [MIT License](LICENSE)。该许可证允许他人使用、复制、修改、分发和销售本软件，但必须保留版权声明与许可证文本。

软件按“原样”提供，不附带任何明示或默示担保；完整的免责声明以 [`LICENSE`](LICENSE) 中的英文条款为准。MIT 的免责声明有助于限制责任，但不代表在所有司法辖区都能绝对免责；如项目用于高风险或商业场景，请咨询专业律师。

## 项目结构

```text
dist/                 浏览器页面、场景代码和本地 Three.js 文件
server/               静态服务器与高德天气代理
tests/                自动化测试
docs/images/          README 使用的场景截图
Dockerfile            镜像构建文件
compose.yaml          Docker Compose 启动配置
.env.example          环境变量示例
```

## 运行测试

```bash
npm test
```
