# CCT / QKI 查询与模拟工具

这是 GitHub Pages 使用的网页发布文件。发布后的访问地址为：

**https://bu-qi.github.io/cct-qki-tools/**

## 页面功能

- CCT 全网剩余算力、地址排名及算力占比。
- CCT 总供应量、累计销毁量，以及产出、燃烧后的整体数据模拟。
- GAS LpVault 项目累计 QKI 买入、历史赎回、净 LP 持仓与占比。
- 每个地址全部退出可得 QKI、已核验净投入、历史赎回及累计盈亏。
- 自定义多个地址按输入顺序清仓，重算每一步回款和剩余地址的退出收益。
- 地址搜索、排序、历史快照及 CSV 导出。

页面使用公开链上数据，所有查询和模拟均为只读，无需连接钱包。内置快照带有区块和时间；实时刷新通过以下两个公开 QKI RPC 读取同一规范区块并核对结果：

- https://rpc1.qkiscan.io/
- https://hz.rpc.qkiscan.cn/

节点不可用或核验失败时，页面会显示状态，不会把历史快照标成实时结果。模拟中的清仓范围为本项目 Vault 内的 LP；报价随池子状态和退出顺序变化，模型假设及盈亏口径见页面说明。

## 发布文件

本仓库提供构建后的 HTML、CSS、JavaScript、图标、公开链上快照数据及发布校验清单。JavaScript 包含浏览器运行所需的查询和模拟逻辑，访问者可以下载这些文件。

GitHub Pages 使用 `main` 分支根目录发布，保留 `.nojekyll`。`release-manifest.json` 记录每个网页文件的 SHA-256，可用于确认部署版本。

## 合约

- [CCT](https://scan.qki.dev/token/0xE8377eCb0F32f0C16025d5cF360D6C9e2EA66Adf?tab=contract)
- [GAS LpVault](https://scan.qki.dev/address/0x31A136840AD7d477D95913d520bB53e05C679Ba5?tab=read_write_contract)
