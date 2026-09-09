const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * 批量生成指定应用的卡密明文并计算不可逆 SHA-256 哈希值
 *
 * @param {string} appId - 应用唯一标识 (如 'pagebox', 'tree_reader', 'all_access_bundle')
 * @param {number} count - 生成卡密数量
 * @param {string} prefix - 卡密前缀
 */
function generateKeyBatch(appId = 'pagebox', count = 100, prefix = 'PB') {
  const rawKeys = [];
  const hashes = [];

  for (let i = 0; i < count; i++) {
    const rand = () => crypto.randomBytes(2).toString('hex').toUpperCase();
    const key = `${prefix}-${rand()}-${rand()}-${rand()}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    rawKeys.push(key);
    hashes.push(hash);
  }

  // 1. 导出供发卡平台（如面包多）使用的明文
  const txtFileName = `keys_${appId}_${Date.now()}.txt`;
  fs.writeFileSync(path.join(__dirname, txtFileName), rawKeys.join('\n'), 'utf8');

  // 2. 读取或初始化 valid_hashes.json
  const jsonPath = path.join(__dirname, 'valid_hashes.json');
  let data = {};
  if (fs.existsSync(jsonPath)) {
    try {
      data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch {
      data = {};
    }
  }

  if (!data[appId]) {
    data[appId] = [];
  }
  // 去重合并
  data[appId] = Array.from(new Set([...data[appId], ...hashes]));

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

  console.log(`[成功] 已生成 ${count} 个 [${appId}] 卡密`);
  console.log(`- 明文文件（用于导入面包多等平台）: ${txtFileName}`);
  console.log(`- 哈希库文件（用于上传/同步至 GitHub Gist）: valid_hashes.json`);
}

// 支持从命令行传递参数：node generate_keys.js [appId] [count] [prefix]
const args = process.argv.slice(2);
const targetAppId = args[0] || 'pagebox';
const targetCount = Number(args[1]) || 100;
const targetPrefix = args[2] || (targetAppId === 'pagebox' ? 'PB' : targetAppId.slice(0, 3).toUpperCase());

generateKeyBatch(targetAppId, targetCount, targetPrefix);
