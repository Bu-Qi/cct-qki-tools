# CCT 免费算力与产出工具

这是 GitHub Pages 使用的网页发布文件。发布后的访问地址为：

**https://bu-qi.github.io/cct-qki-tools/**

## 免费页面功能

- CCT 全网剩余算力、地址排名及算力占比。
- CCT 总供应量、累计销毁量，以及产出、燃烧后的整体数据模拟。
- 地址搜索、排序、历史快照及 CSV 导出。

以上 CCT 功能继续免费使用，不需要会员或连接钱包。页面使用公开链上数据；内置 CCT 快照带有区块和时间，刷新通过以下两个公开 QKI RPC 读取规范区块并核对地址算力与全网总量：

- https://rpc1.qkiscan.io/
- https://hz.rpc.qkiscan.cn/

节点不可用或核验失败时，页面会显示状态，不会把历史快照标成实时结果。产出与燃烧模拟的规则及假设见页面说明。

## QKI 会员工具

QKI 净持仓排行、赎回盈亏和多地址清仓分析已移至独立会员站：

**https://cct-qki-tools.mofei1-9304.chatgpt.site/**

[查看会员与套餐](https://cct-qki-tools.mofei1-9304.chatgpt.site/membership)。账号登录、会员核验和付款流程均在该站完成。本 Pages 发布包只保留前往会员站的链接，不包含 QKI 完整账本、项目种子数据、QKI 查询接口或清仓模拟模块。

## 发布文件

本仓库提供 CCT 免费页面构建后的 HTML、CSS、JavaScript、图标、CCT 公开链上快照及发布校验清单。JavaScript 包含 CCT 查询与产出、燃烧模拟所需的逻辑。

GitHub Pages 使用 `main` 分支根目录发布，保留 `.nojekyll`。`release-manifest.json` 标记 `cct-free-only` 发布范围，并记录每个网页文件的 SHA-256，可用于确认部署版本。

## 合约

- [CCT](https://scan.qki.dev/token/0xE8377eCb0F32f0C16025d5cF360D6C9e2EA66Adf?tab=contract)
