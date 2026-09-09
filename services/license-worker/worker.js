/**
 * Cloudflare Worker 边缘核销服务
 * 
 * 依赖：Cloudflare Workers KV 命名空间绑定为 REDEEMED_KEYS
 * 环境变量：GIST_RAW_URL (GitHub Gist 上 valid_hashes.json 的 Raw 访问链接)
 */

// 默认 Gist RAW URL，可在 wrangler.toml 或 Cloudflare 仪表盘环境变量中配置 GIST_RAW_URL 覆盖
const DEFAULT_GIST_RAW_URL = 'https://gist.githubusercontent.com/qinxuanlong/8910a3bc5996b388a4757230a6ddd889/raw/valid_hashes';

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { app_id, hash, device_id } = await request.json();

      if (!app_id || !hash || !device_id) {
        return new Response(JSON.stringify({ valid: false, message: '请求参数缺失 (需要 app_id, hash, device_id)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 1. 读取全局哈希表（通过 Cloudflare 边缘缓存 1 小时）
      const gistUrl = env?.GIST_RAW_URL || DEFAULT_GIST_RAW_URL;
      const configRes = await fetch(gistUrl, { cf: { cacheTtl: 3600 } });
      
      if (!configRes.ok) {
        return new Response(
          JSON.stringify({ valid: false, message: `无法拉取远端哈希库 (HTTP ${configRes.status})，请检查 Gist 配置` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const hashDatabase = await configRes.json();

      const appPool = Array.isArray(hashDatabase[app_id]) ? hashDatabase[app_id] : [];
      const bundlePool = Array.isArray(hashDatabase['all_access_bundle']) ? hashDatabase['all_access_bundle'] : [];

      // 校验该哈希是否属于该应用或全家桶
      if (!appPool.includes(hash) && !bundlePool.includes(hash)) {
        return new Response(JSON.stringify({ valid: false, message: '无效的卡密或卡密不适用于当前应用' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 2. 隔离查询 KV 数据：键名为 "app_id:hash"
      if (!env.REDEEMED_KEYS) {
        return new Response(
          JSON.stringify({ valid: false, message: '服务端 KV 未正确绑定 (REDEEMED_KEYS)' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const kvKey = `${app_id}:${hash}`;
      let record = await env.REDEEMED_KEYS.get(kvKey, { type: 'json' });

      // 首次激活：记录设备与时间
      if (!record) {
        const newRecord = {
          devices: [device_id],
          max_devices: 1, // 可按需修改设备限制
          first_used_at: new Date().toISOString(),
        };
        await env.REDEEMED_KEYS.put(kvKey, JSON.stringify(newRecord));

        return new Response(JSON.stringify({ valid: true, message: '激活成功' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 已被当前设备激活：直接放行
      if (record.devices.includes(device_id)) {
        return new Response(JSON.stringify({ valid: true, message: '当前设备已激活' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 设备上限校验
      if (record.devices.length >= (record.max_devices || 1)) {
        return new Response(JSON.stringify({ valid: false, message: '该卡密已绑定至其他设备' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 仍有可用额度：追加当前设备
      record.devices.push(device_id);
      await env.REDEEMED_KEYS.put(kvKey, JSON.stringify(record));

      return new Response(JSON.stringify({ valid: true, message: '激活成功' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '未知异常';
      return new Response(JSON.stringify({ valid: false, message: `鉴权服务暂时不可用: ${errorMsg}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
