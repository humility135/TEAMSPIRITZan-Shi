// List of HK 18 Districts
export const hkDistricts = [
  "中西區", "灣仔區", "東區", "南區", 
  "油尖旺區", "深水埗區", "九龍城區", "黃大仙區", "觀塘區", 
  "葵青區", "荃灣區", "屯門區", "元朗區", "北區", "大埔區", "沙田區", "西貢區", "離島區"
];

export const detectDistrict = (text: string): string => {
  if (!text) return '其他';
  
  // 1. 先嘗試正規表達式直接擷取 18 區關鍵字 (例如使用者輸入 "旺角 (油尖旺區)")
  const districtMatch = text.match(/(中西|灣仔|東|南|油尖旺|深水埗|九龍城|黃大仙|觀塘|葵青|荃灣|屯門|元朗|北|大埔|沙田|西貢|離島)區/);
  if (districtMatch) return districtMatch[0];

  const t = text.toLowerCase();
  
  // 2. 擴充關鍵字庫 (覆蓋香港絕大部份地區、街道、屋邨及球場)
  // 香港島
  if (
    t.includes('中環') || t.includes('上環') || t.includes('西環') || 
    t.includes('西營盤') || t.includes('堅尼地城') || t.includes('半山') || t.includes('山頂') || 
    t.includes('金鐘') || t.includes('添馬') || t.includes('薄扶林') || t.includes('摩星嶺') || 
    t.includes('中山紀念') || t.includes('卜公') || t.includes('香港公園') || t.includes('中西')
  ) return '中西區';

  if (
    t.includes('銅鑼灣') || t.includes('跑馬地') || t.includes('大坑') || 
    t.includes('渣甸山') || t.includes('掃桿埔') || t.includes('肇輝臺') || t.includes('修頓') || 
    t.includes('維園') || t.includes('維多利亞公園') || t.includes('香港大球場') || t.includes('灣仔') || t.includes('軒尼詩')
  ) return '灣仔區';

  if (
    t.includes('天后') || t.includes('寶馬山') || t.includes('北角') || 
    t.includes('鰂魚涌') || t.includes('炮台山') || t.includes('太古') || t.includes('康山') || 
    t.includes('西灣河') || t.includes('筲箕灣') || t.includes('愛秩序灣') || t.includes('柴灣') || 
    t.includes('杏花邨') || t.includes('小西灣') || t.includes('鰂魚涌公園') || t.includes('東區')
  ) return '東區';

  if (
    t.includes('鋼綫灣') || t.includes('數碼港') || t.includes('瀑布灣') || 
    t.includes('香港仔') || t.includes('鴨脷洲') || t.includes('黃竹坑') || t.includes('深水灣') || 
    t.includes('淺水灣') || t.includes('赤柱') || t.includes('大潭') || t.includes('石澳') || t.includes('南區') || t.includes('海怡')
  ) return '南區';

  // 九龍
  if (
    t.includes('尖沙咀') || t.includes('油麻地') || t.includes('旺角') || 
    t.includes('大角咀') || t.includes('京士柏') || t.includes('佐敦') || t.includes('麥花臣') || 
    t.includes('界限街') || t.includes('櫻桃街') || t.includes('晏架街') || t.includes('九龍公園') ||
    t.includes('油尖旺') || t.includes('太子') || t.includes('柯士甸')
  ) return '油尖旺區';

  if (
    t.includes('荔枝角') || t.includes('長沙灣') || t.includes('石硤尾') || 
    t.includes('昂船洲') || t.includes('興華街') || t.includes('保安道') || t.includes('楓樹街') || 
    t.includes('深水埗') || t.includes('大坑東') || t.includes('歌和老街') || t.includes('南昌') || t.includes('美孚')
  ) return '深水埗區';

  if (
    t.includes('何文田') || t.includes('紅磡') || t.includes('土瓜灣') || 
    t.includes('馬頭圍') || t.includes('馬頭角') || t.includes('啟德') || t.includes('九龍塘') || 
    t.includes('黃埔') || t.includes('九龍仔') || t.includes('樂富') || t.includes('天光道') || 
    t.includes('巴富街') || t.includes('賈炳達道') || t.includes('馬頭圍配水庫') || t.includes('九龍城') || t.includes('九龍仔公園')
  ) return '九龍城區';

  if (
    t.includes('新蒲崗') || t.includes('橫頭磡') || t.includes('鑽石山') || 
    t.includes('慈雲山') || t.includes('牛池灣') || t.includes('摩士') || t.includes('蒲崗村道') || 
    t.includes('斧山道') || t.includes('東頭村') || t.includes('樂富遊樂場') || t.includes('彩虹') || t.includes('黃大仙')
  ) return '黃大仙區';

  if (
    t.includes('牛頭角') || t.includes('九龍灣') || t.includes('秀茂坪') || 
    t.includes('藍田') || t.includes('油塘') || t.includes('鯉魚門') || t.includes('四順') || 
    t.includes('九龍灣公園') || t.includes('順利邨') || t.includes('康寧道') || t.includes('曉光街') ||
    t.includes('秀雅道') || t.includes('坪石') || t.includes('觀塘') || t.includes('佐敦谷')
  ) return '觀塘區';

  // 新界
  if (
    t.includes('葵涌') || t.includes('青衣') || t.includes('大窩口') || 
    t.includes('葵涌運動場') || t.includes('興芳路') || t.includes('青衣運動場') || t.includes('青衣東北') ||
    t.includes('荔景') || t.includes('葵青') || t.includes('葵芳') || t.includes('石籬') || t.includes('石蔭')
  ) return '葵青區';

  if (
    t.includes('深井') || t.includes('青龍頭') || t.includes('馬灣') || 
    t.includes('城門谷') || t.includes('沙咀道') || t.includes('荃灣公園') || t.includes('海安路') || t.includes('荃灣')
  ) return '荃灣區';

  if (
    t.includes('掃管笏') || t.includes('大欖') || t.includes('小欖') || 
    t.includes('兆麟') || t.includes('湖山') || t.includes('蝴蝶灣') || t.includes('屯門鄧肇堅') || 
    t.includes('屯門西北') || t.includes('屯門') || t.includes('良景') || t.includes('建生') || t.includes('友愛')
  ) return '屯門區';

  if (
    t.includes('天水圍') || t.includes('屏山') || t.includes('洪水橋') || 
    t.includes('錦田') || t.includes('流浮山') || t.includes('十八鄉') || t.includes('八鄉') || 
    t.includes('元朗大球場') || t.includes('天水圍公園') || t.includes('天水圍運動場') || t.includes('朗屏') ||
    t.includes('元朗') || t.includes('新田') || t.includes('落馬洲')
  ) return '元朗區';

  if (
    t.includes('粉嶺') || t.includes('上水') || t.includes('沙頭角') || 
    t.includes('打鼓嶺') || t.includes('聯和墟') || t.includes('北區運動場') || t.includes('百和路') || 
    t.includes('粉嶺遊樂場') || t.includes('北區') || t.includes('古洞')
  ) return '北區';

  if (
    t.includes('大尾篤') || t.includes('林村') || t.includes('科學園') || 
    t.includes('白石角') || t.includes('大埔運動場') || t.includes('廣福') || t.includes('大埔海濱') || 
    t.includes('富亨') || t.includes('太和') || t.includes('大埔')
  ) return '大埔區';

  if (
    t.includes('大圍') || t.includes('馬鞍山') || t.includes('火炭') || 
    t.includes('小瀝源') || t.includes('沙田運動場') || t.includes('馬鞍山運動場') || t.includes('馬鞍山遊樂場') || 
    t.includes('曾大屋') || t.includes('顯田') || t.includes('圓洲角') || t.includes('沙田') || t.includes('城門河')
  ) return '沙田區';

  if (
    t.includes('將軍澳') || t.includes('坑口') || t.includes('調景嶺') || 
    t.includes('寶琳') || t.includes('清水灣') || t.includes('康城') || t.includes('西貢鄧肇堅') || 
    t.includes('將軍澳運動場') || t.includes('寶林') || t.includes('翠林') || t.includes('賽馬會香港足球總會足球訓練中心') ||
    t.includes('西貢')
  ) return '西貢區';

  if (
    t.includes('大嶼山') || t.includes('東涌') || t.includes('長洲') || 
    t.includes('坪洲') || t.includes('南丫島') || t.includes('梅窩') || t.includes('愉景灣') || 
    t.includes('東涌北') || t.includes('長洲公園') || t.includes('離島') || t.includes('赤鱲角') || t.includes('大澳')
  ) return '離島區';

  return '其他';
};