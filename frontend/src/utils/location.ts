const AMAP_KEY = "b1a40664369a4428b1b37f3a96360014";

export async function getAddress(latitude: number, longitude: number): Promise<string> {
  // ---------------------------------------------------------
  // 1. 优先尝试高德地图 (AMap)
  // ---------------------------------------------------------
  try {
    const amapUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${longitude},${latitude}`;
    const response = await fetch(amapUrl);
    const data = await response.json();

    // 关键判断：
    // 高德状态为 '1' 且 formatted_address 存在且不是空数组或空字符串
    // 注意：有时候高德在国外会返回 [] 作为地址，所以要检查长度
    if (
      data.status === "1" && 
      data.regeocode?.formatted_address && 
      data.regeocode.formatted_address.length > 0 &&
      typeof data.regeocode.formatted_address === 'string'
    ) {
      return data.regeocode.formatted_address;
    }
    
    // 如果代码走到这里，说明高德返回了 200 OK，但是地址是空的（比如身在国外）
    console.warn("高德地图未返回有效地址，切换至备用方案...");
  } catch (error) {
    // 网络错误也切换
    console.warn("高德地图请求失败，切换至备用方案:", error);
  }

  // ---------------------------------------------------------
  // 2. 备用方案：OpenStreetMap (Nominatim)
  // ---------------------------------------------------------
  // 适合：国外位置、无信用卡、免费
  try {
    return await getOsmAddress(latitude, longitude);
  } catch (backupError) {
    console.error("备用地图解析也失败:", backupError);
    return "未知位置";
  }
}

/**
 * OpenStreetMap (Nominatim) 逆地理编码
 * 优点：完全免费，无需Key，全球数据详细
 * 缺点：QPS限制（每秒1次请求），必须带 User-Agent
 */
async function getOsmAddress(lat: number, lon: number): Promise<string> {
  // accept-language=zh-CN,zh;q=0.9 确保返回中文地址（例如：日本 -> 日本）
  // zoom=18 确保获取详细街道级别
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=zh-CN,zh;q=0.9&zoom=18`;

  const response = await fetch(url, {
    headers: {
      // 必须设置 User-Agent，否则 OSM 会拦截请求 (HTTP 403)
      // 建议格式：AppName/Version (contact@email.com)
      'User-Agent': 'MyLocationApp/1.0 (test@example.com)' 
    }
  });

  if (!response.ok) {
    throw new Error(`OSM HTTP Error: ${response.status}`);
  }

  const data = await response.json();

  // OSM 返回的字段通常是 display_name
  if (data && data.display_name) {
    return data.display_name;
  }
  
  throw new Error("OSM returned empty address");
}