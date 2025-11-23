---
title: cloudflare使用wokers进行ip优选
published: 2025-11-13
description: '一份关于如何使用cf优选ip加速站点国内访问体验的教程'
image: 'https://cloud.guguwo.top/d/picture-bed/18f7e46bd5dd4c20aa1c39f73f8841a4.webp'
tags: ["cloudflare", "ip优选", "优化", "dns", "教程", "反代"]
category: '教程'
draft: false
---
:::note[提醒]
此方法可能失效。
:::

# 准备阶段
- 请确保您的域名被托管在了cloudflare

# 开始部署
1. 让我们来到[cf后台](https://dash.cloudflare.com)，找到侧边栏的DNS标签栏下的记录。
![](https://cloud.guguwo.top/d/picture-bed/20251113204556191.webp)
2. 将您原本的站域名解析名称修改并记住它，非原域名均可。:spoiler[CNAME解析与A解析均同理]
![](https://cloud.guguwo.top/d/picture-bed/20251113171417983.webp)
3. 接着找到侧边栏的Wokers和Pages，点击右上角创建应用程序
![](https://cloud.guguwo.top/d/picture-bed/20251113172850331.webp)
选中woker下的从 'Hello World! 开始' 的开始使用的按钮
![](https://cloud.guguwo.top/d/picture-bed/20251113212258799.webp)
接着创建
![](https://cloud.guguwo.top/d/picture-bed/20251113212618716.webp)
4. 点击右上角编辑代码以替换woker文件，请确保完整替换成下方文件内容
![](https://cloud.guguwo.top/d/picture-bed/20251113212857348.webp)
![](https://cloud.guguwo.top/d/picture-bed/20251113213010307.webp)
您需要自主替换domain_mappings的值
例：如您在上文中修改后的站域名为0721.moeku.org，您原本的域名为blog.moeku.org
则domain_mappings的值应修改为{'0721.moeku.org': 'blog.',}，其余您无需改动。
```js wrap
// 1. 修改这里的配置
const domain_mappings = {
  // 将 'blog.moeku.org' 设置为您的源站
    // 将 '0721.' 设置为您希望使用的访问前缀
      '0721.moeku.org': 'blog.',
      };

      // 2. 下面的代码无需修改
      addEventListener('fetch', event => {
        event.respondWith(handleRequest(event.request));
        });

        async function handleRequest(request) {
          const url = new URL(request.url);
            const current_host = url.host;

              if (url.protocol === 'http:') {
                  url.protocol = 'https:';
                      return Response.redirect(url.href, 301);
                        }

                          const host_prefix = getProxyPrefix(current_host);
                            if (!host_prefix) {
                                return new Response('Proxy prefix not matched', { status: 404 });
                                  }

                                    let target_host = null;
                                      for (const [origin_domain, prefix] of Object.entries(domain_mappings)) {
                                          if (host_prefix === prefix) {
                                                target_host = origin_domain;
                                                      break;
                                                          }
                                                            }

                                                              if (!target_host) {
                                                                  return new Response('No matching target host for prefix', { status: 404 });
                                                                    }

                                                                      const new_url = new URL(request.url);
                                                                        new_url.protocol = 'https:';
                                                                          new_url.host = target_host;

                                                                            const new_headers = new Headers(request.headers);
                                                                              new_headers.set('Host', target_host);
                                                                                new_headers.set('Referer', new_url.href);

                                                                                  try {
                                                                                      const response = await fetch(new_url.href, {
                                                                                            method: request.method,
                                                                                                  headers: new_headers,
                                                                                                        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
                                                                                                              redirect: 'manual'
                                                                                                                  });

                                                                                                                      const response_headers = new Headers(response.headers);
                                                                                                                          response_headers.set('access-control-allow-origin', '*');
                                                                                                                              response_headers.set('access-control-allow-credentials', 'true');
                                                                                                                                  response_headers.set('cache-control', 'public, max-age=600');
                                                                                                                                      response_headers.delete('content-security-policy');
                                                                                                                                          response_headers.delete('content-security-policy-report-only');

                                                                                                                                              return new Response(response.body, {
                                                                                                                                                    status: response.status,
                                                                                                                                                          statusText: response.statusText,
                                                                                                                                                                headers: response_headers
                                                                                                                                                                    });
                                                                                                                                                                      } catch (err) {
                                                                                                                                                                          return new Response(`Proxy Error: ${err.message}`, { status: 502 });
                                                                                                                                                                            }
                                                                                                                                                                            }

                                                                                                                                                                            function getProxyPrefix(hostname) {
                                                                                                                                                                              for (const prefix of Object.values(domain_mappings)) {
                                                                                                                                                                                  if (hostname.startsWith(prefix)) {
                                                                                                                                                                                        return prefix;
                                                                                                                                                                                            }
                                                                                                                                                                                              }
                                                                                                                                                                                                return null;
                                                                                                                                                                                                }
```
5. 右上角点击过蓝色部署后让我们回到dns解析记录界面，为我们的主域名反代一个cf优选ip(使用CNAME解析)，您可在[这个网站](https://cf.090227.xyz/)获取到优选ip。
![](https://cloud.guguwo.top/d/picture-bed/20251113172001810.webp)
![](https://cloud.guguwo.top/d/picture-bed/20251113172354968.webp)
6. 最后一步，为我们的主域名绑定刚刚创建woker
- 回到Workers 路由页面点击添加路由按钮
![](https://cloud.guguwo.top/d/picture-bed/20251113220126228.webp)
- 如图配置
![](https://cloud.guguwo.top/d/picture-bed/20251113220612988.webp)

# 大功告成！
您可以前往[ITDOG](https://www.itdog.cn/ping)对网站连接速度测试，如不出意外您获取的反馈会是青青草原
![](https://cloud.guguwo.top/d/picture-bed/20251113221129703.webp)
