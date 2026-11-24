# 全站访问统计

两个 GitHub Pages 项目共用 `/assets/site-visits.js` 和同一个 Cloudflare Worker。主页、中文版以及 Market 的 HTML 页面将页面浏览计入同一个总数。访问以首次成功记录的时间为起点，每次加载页面或通过浏览器返回该页面计一次。禁用脚本、阻止统计请求或被识别为爬虫的访问可能漏计。

Cloudflare 提供请求所属国家或地区的两字母代码。D1 只保存每个代码的累计次数和首次访问时间，其中 `XX` 表示未知。脚本不使用 Cookie，也不发送访问页面路径。主页使用新加坡时间显示统计起点。

主页地图的陆地来自 [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) 的公共领域数据，沿用 [Market 地图底图](https://yunzhegao.github.io/market/assets/world-globe.svg) 的轮廓。圆点采用 [Google Developers countries.csv](https://developers.google.com/public-data/docs/canonical/countries_csv?hl=en) 的地区代表坐标，经四舍五入并补充部分地区，使用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可。显示直径按访问量对数缩放，范围为 9 到 12 像素，最大值固定为 12 像素。没有坐标的访问也保留在地区列表和总数里。

## 发布

1. 在 Cloudflare 账户创建名为 `yunzhegao-site-visits` 的 D1 数据库。将数据库 ID 写入 `wrangler.toml`。
2. 在此目录运行：

   ```sh
   npx wrangler d1 migrations apply yunzhegao-site-visits --remote
   npx wrangler deploy
   ```

3. 将部署返回的 Worker 公共地址加上 `/visits`，写入主页仓库 `assets/site-visits.js` 中的 `endpoint`。发布主页仓库。接入前脚本保持休眠，页脚隐藏统计区。
4. 在 `yunzhegao/market` 仓库应用 `market-pages.patch` 到现有的 `.github/workflows/pages.yml`，再发布。该步骤会为每次发布的 `dist` 下所有完整 HTML 页面添加同一脚本。
5. 打开英文主页、中文版和一个 Market 子页，检查它们向同一个 `/visits` 地址发送请求。验证主页页脚总次数增加并能展开地区分布。主页仓库后续新增的独立 HTML 页面也应引用此脚本。
