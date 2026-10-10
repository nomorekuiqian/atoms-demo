# Google 登录

2026-10-10：登录/注册页支持通过 InsForge Google OAuth 登录。

- 使用现有 InsForge Google provider；当前为共享 OAuth 应用，Google 授权页显示 `InstaCloud`。自有品牌需在 InsForge 控制台配置自己的 Google OAuth 应用。
- Server Action 发起 PKCE，回调地址为当前应用 origin 下的 `/api/auth/callback`，Origin 由 Next.js Server Action 同源检查保护。
- verifier 和登录后目标保存在 10 分钟有效的 HttpOnly、SameSite=Lax cookie；HTTPS 下启用 Secure。
- 回调在服务端交换授权码，由 InsForge SSR SDK 写入会话 cookie；成功/失败均清除临时 cookie。
- 返回登录前的站内页面；取消、过期和交换失败时回到登录页并提供重试提示。
- 当前后端已启用 Google，线上和 localhost 授权初始化均成功，无需新增前端或服务端 Google 密钥。没有修改后端 auth 配置。

验证：本地 `npm run test` 98 项通过，`npm run build` 通过；浏览器按钮跳转到 Google 登录页成功。回调单测覆盖成功、拒绝授权、缺少 verifier、网络/交换失败及外部跳转拦截。真实 Google 账号授权后的完整登录仍需账号所有者验收。
