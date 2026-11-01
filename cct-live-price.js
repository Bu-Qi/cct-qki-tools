(() => {
  'use strict';

  const widget = document.getElementById('cct-live-price');
  if (!widget) return;
  const usdtValue = document.getElementById('cct-price-usdt');
  const qkiValue = document.getElementById('cct-price-qki');
  const status = document.getElementById('cct-price-status');
  const refreshButton = document.getElementById('cct-price-refresh');
  const endpoints = ['https://rpc1.qkiscan.io/', 'https://hz.rpc.qkiscan.cn/'];
  const cct = '0xe8377ecb0f32f0c16025d5cf360d6c9e2ea66adf';
  const markets = [
    { pair: '0x10985efd0765636fc9b40185e721e9bbc1275c3d', quote: '0xdf0e293cc3c7ba051763ff6b026da0853d446e38', decimals: 6 },
    { pair: '0x670b2d0fc710a5c1fc9c00c3cede4bdc5ae22119', quote: '0x835f6df988b6f51c9477d49e96adbbc644ba97a2', decimals: 18 },
  ];
  const intervalMs = 30000;
  const maxBlockAge = 180;
  const clock = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  let busy = false;
  let lastQuote = null;
  let timer;

  function quantity(value) {
    if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) throw new Error('节点数据格式错误');
    return BigInt(value);
  }

  function word(value) {
    if (typeof value !== 'string' || !/^0x[0-9a-f]{64}$/i.test(value)) throw new Error('合约数据格式错误');
    return BigInt(value);
  }

  function address(value) {
    word(value);
    if (!/^0x0{24}[0-9a-f]{40}$/i.test(value)) throw new Error('代币地址格式错误');
    return ('0x' + value.slice(-40)).toLowerCase();
  }

  async function batch(url, calls, signal) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(calls.map((call, index) => ({ jsonrpc: '2.0', id: index + 1, ...call }))),
      credentials: 'omit', cache: 'no-store', signal,
    });
    if (!response.ok) throw new Error('节点暂时不可用');
    const data = await response.json();
    if (!Array.isArray(data) || data.length !== calls.length) throw new Error('节点数据不完整');
    const results = new Map();
    for (const item of data) {
      if (!item || !Number.isInteger(item.id) || item.id < 1 || item.id > calls.length || results.has(item.id) || item.error || item.result == null) throw new Error('节点返回错误');
      results.set(item.id, item.result);
    }
    return calls.map((_, index) => results.get(index + 1));
  }

  function formatRatio(quoteReserve, baseReserve, quoteDecimals) {
    if (baseReserve <= 0n || quoteReserve <= 0n) throw new Error('交易池流动性不足');
    // Integer arithmetic preserves CCT's 8 decimals and the quote token's precision.
    const scale = 10n ** 12n;
    const scaled = (quoteReserve * 10n ** 8n * scale) / (baseReserve * 10n ** BigInt(quoteDecimals));
    if (scaled === 0n) return '<0.000000000001';
    const integer = scaled / scale;
    const fraction = (scaled % scale).toString().padStart(12, '0');
    let digits = 6;
    if (integer === 0n) digits = Math.min(12, Math.max(6, fraction.search(/[1-9]/) + 4));
    return integer.toString() + '.' + fraction.slice(0, digits);
  }

  async function readQuote(url, signal) {
    const [chain, block] = await batch(url, [
      { method: 'eth_chainId', params: [] },
      { method: 'eth_getBlockByNumber', params: ['latest', false] },
    ], signal);
    if (quantity(chain) !== 20181205n) throw new Error('节点不在 QKI 网络');
    if (!block || !/^0x[0-9a-f]{64}$/i.test(block.hash)) throw new Error('区块数据不完整');
    const timestamp = Number(quantity(block.timestamp));
    const blockNumber = Number(quantity(block.number));
    const age = Date.now() / 1000 - timestamp;
    if (!Number.isSafeInteger(timestamp) || !Number.isSafeInteger(blockNumber) || age < -60 || age > maxBlockAge) throw new Error('节点区块已过期');
    if (lastQuote && blockNumber < lastQuote.blockNumber) throw new Error('节点数据落后');
    const atBlock = { blockHash: block.hash, requireCanonical: true };
    const call = (to, data) => ({ method: 'eth_call', params: [{ to, data }, atBlock] });
    const calls = [call(cct, '0x313ce567')];
    for (const market of markets) {
      calls.push(call(market.quote, '0x313ce567'), call(market.pair, '0x0dfe1681'), call(market.pair, '0xd21220a7'), call(market.pair, '0x0902f1ac'));
    }
    const values = await batch(url, calls, signal);
    if (word(values[0]) !== 8n) throw new Error('CCT 精度已变化');
    const prices = markets.map((market, index) => {
      const offset = 1 + index * 4;
      if (word(values[offset]) !== BigInt(market.decimals)) throw new Error('计价币精度已变化');
      const token0 = address(values[offset + 1]);
      const token1 = address(values[offset + 2]);
      const baseIs0 = token0 === cct && token1 === market.quote;
      if (!baseIs0 && !(token1 === cct && token0 === market.quote)) throw new Error('交易池代币不匹配');
      const data = values[offset + 3];
      if (typeof data !== 'string' || !/^0x[0-9a-f]{192}$/i.test(data)) throw new Error('池子储备格式错误');
      const reserve0 = BigInt('0x' + data.slice(2, 66));
      const reserve1 = BigInt('0x' + data.slice(66, 130));
      if (reserve0 >= 2n ** 112n || reserve1 >= 2n ** 112n) throw new Error('池子储备超出范围');
      return formatRatio(baseIs0 ? reserve1 : reserve0, baseIs0 ? reserve0 : reserve1, market.decimals);
    });
    if (Date.now() / 1000 - timestamp > maxBlockAge) throw new Error('区块数据已过期');
    return { prices, blockNumber, timestamp, fetchedAt: Date.now(), url };
  }

  async function refresh() {
    if (busy) return;
    clearTimeout(timer);
    busy = true;
    refreshButton.disabled = true;
    widget.setAttribute('aria-busy', 'true');
    status.textContent = lastQuote ? '正在更新 · 上次 ' + clock.format(lastQuote.fetchedAt) : '正在读取链上价格…';
    const controllers = endpoints.map(() => new AbortController());
    const timeout = setTimeout(() => controllers.forEach(controller => controller.abort()), 12000);
    try {
      // Either verified public node can answer; cancel the other request after success.
      const quote = await Promise.any(endpoints.map((url, index) => readQuote(url, controllers[index].signal)));
      lastQuote = quote;
      usdtValue.textContent = quote.prices[0];
      qkiValue.textContent = quote.prices[1];
      widget.dataset.state = 'live';
      status.textContent = '1 CCT · ' + clock.format(quote.fetchedAt) + ' 更新';
      widget.title = 'Qkswap CCT/USDT 与 CCT/WQKI 直接池储备现价；1 CCT 的计价，不含交易费、转账税及滑点。区块 #' + quote.blockNumber + ' · 北京时间 ' + clock.format(quote.timestamp * 1000);
    } catch (_) {
      widget.dataset.state = lastQuote ? 'stale' : 'error';
      status.textContent = lastQuote ? '更新失败 · 上次 ' + clock.format(lastQuote.fetchedAt) : '价格暂不可用 · 点击 ↻ 重试';
      if (!lastQuote) { usdtValue.textContent = '—'; qkiValue.textContent = '—'; }
    } finally {
      clearTimeout(timeout);
      controllers.forEach(controller => controller.abort());
      busy = false;
      refreshButton.disabled = false;
      widget.setAttribute('aria-busy', 'false');
      if (!document.hidden) timer = setTimeout(refresh, intervalMs);
    }
  }

  refreshButton.addEventListener('click', refresh);
  document.addEventListener('visibilitychange', () => {
    clearTimeout(timer);
    if (document.hidden) return;
    if (lastQuote && Date.now() / 1000 - lastQuote.timestamp > maxBlockAge) widget.dataset.state = 'stale';
    refresh();
  });
  refresh();
})();
