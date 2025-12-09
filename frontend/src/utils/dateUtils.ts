export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return '';

  // 1. 兼容性处理 (核心修复点)
  // 将 "2023-10-01 12:00:00" 转换为 "2023/10/01 12:00:00"
  // 这种 "yyyy/MM/dd HH:mm:ss" 格式在所有浏览器(包括 Safari)中都支持
 let safeDateString = dateString
      .replace('T', ' ')      // 把 T 换成 空格
      .replace(/-/g, '/');
  
 
  // 2. 解析时间
  const date = new Date(safeDateString);
  const past = date.getTime();

  // 3. 安全检查：如果解析失败，直接显示原始字符串，防止 NaN-NaN-NaN
  if (isNaN(past)) {
    console.warn("日期解析失败:", dateString);
    return dateString; 
  }

  const now = new Date().getTime();
  const diff = now - past;

  // 如果时间差是负数（本地时间比服务器慢），视为“刚刚”
  if (diff < 0) return '刚刚';

  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const year = day * 365;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < 24 * hour) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < 2 * day) {
    return '昨天';
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`;
  } else if (diff < year) {
    // 今年内，显示 "10-24"
    // 注意：getMonth() 从 0 开始，所以要 +1
    return `${date.getMonth() + 1}-${date.getDate()}`;
  } else {
    // 跨年，显示 "2023-10-24"
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
}