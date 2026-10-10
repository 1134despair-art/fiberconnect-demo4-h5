import fusionSplicerImage from '@/assets/app/products/fusion-splicer-realistic.jpg'
import portableOtdrImage from '@/assets/app/products/portable-otdr-realistic.jpg'
import smartOtdrImage from '@/assets/app/products/smart-otdr-realistic.jpg'
import multiOpmImage from '@/assets/app/products/multi-opm-realistic.jpg'
import stableSourceImage from '@/assets/app/products/stable-light-source-realistic.png'
import { releasedProducts, releasedCategories } from './releasedContent'
const localCategories = [
  { id: 1, name: 'OTDR', count: 2 },
  { id: 2, name: '光纤熔接机', count: 15 },
  { id: 3, name: '光纤热剥钳', count: 3 },
  { id: 4, name: '光纤切割刀', count: 19 },
  { id: 5, name: '光功率计/一体机', count: 5 },
  { id: 6, name: '光纤剥线钳', count: 5 },
  { id: 7, name: '光纤冷接子', count: 9 },
  { id: 8, name: 'SC冷接子', count: 31 },
  { id: 9, name: '插片式分光器', count: 12 },
  { id: 10, name: '拉锥盒式分光器', count: 12 },
  { id: 11, name: '光纤红光笔', count: 5 },
  { id: 12, name: '光纤开缆刀', count: 9 },
  { id: 13, name: '光纤耦合器/法兰', count: 17 },
  { id: 14, name: '光纤转接头', count: 27 },
  { id: 15, name: '单模单芯跳线', count: 28 },
  { id: 16, name: '单模双芯跳线', count: 10 },
  { id: 17, name: '单模单头尾纤跳线', count: 4 },
  { id: 18, name: '熔接工具', count: 10 },
  { id: 19, name: '冷接工具', count: 1 },
  { id: 20, name: '作业工具', count: 21 },
  { id: 21, name: '清洁工具', count: 15 },
  { id: 22, name: '测试工具', count: 3 },
  { id: 23, name: '工具套装', count: 4 }
]
const localProducts = [
  {
    id: 1,
    categoryId: 1,
    name: 'OTDR光时域反射仪',
    model: 'S-900D',
    description: '双波长智能链路测试与事件分析',
    image: smartOtdrImage,
    details: ''
  },
  {
    id: 2,
    categoryId: 1,
    name: '寻障笔',
    model: 'OT-10',
    description: '便携式光纤故障定位与测量',
    image: portableOtdrImage,
    details: ''
  },
  {
    id: 3,
    categoryId: 2,
    name: '六马达光纤熔接机',
    model: 'FS-90S',
    description: '全自动熔接、加热及电极维护',
    image: fusionSplicerImage,
    details: ''
  },
  {
    id: 4,
    categoryId: 5,
    name: '手持式多功能光功率计',
    model: 'OPM-HNB',
    description: '光功率、光源、网线测试一体机',
    image: multiOpmImage,
    details: ''
  },
  {
    id: 5,
    categoryId: 5,
    name: '光功率计 PM-200',
    model: 'PM-200',
    description: '专业级光功率计，带数据存储功能',
    image: multiOpmImage,
    details: ''
  },
  {
    id: 6,
    categoryId: 11,
    name: '光纤红光笔 VFL-650',
    model: 'VFL-650',
    description: '650nm红光可视故障定位仪',
    image: stableSourceImage,
    details: ''
  },
  {
    id: 7,
    categoryId: 11,
    name: '光纤红光笔 VFL-650Pro',
    model: 'VFL-650Pro',
    description: '专业级红光可视故障定位仪',
    image: stableSourceImage,
    details: ''
  },
  {
    id: 8,
    categoryId: 22,
    name: '光纤链路测试仪 OTDR-700',
    model: 'OTDR-700',
    description: '便携式OTDR，支持多波长测试',
    image: portableOtdrImage,
    details: ''
  },
  {
    id: 9,
    categoryId: 18,
    name: '电极棒',
    model: 'Electrode-01',
    description: '熔接机专用电极棒',
    image: '',
    details: ''
  },
  {
    id: 10,
    categoryId: 18,
    name: '热缩管套装',
    model: 'HeatShrink-Kit',
    description: '各种规格热缩管套装',
    image: '',
    details: ''
  },
  {
    id: 11,
    categoryId: 6,
    name: '光纤剥线钳',
    model: 'Stripper-01',
    description: '专业光纤剥线工具',
    image: '',
    details: ''
  }
]
// Retain original detail content under unambiguous model identities.
const previousDetails = [
  {
    id: 1,
    name: {
      'zh-CN': '六马达熔接机 WM-6000',
      'zh-TW': '六馬達熔接機 WM-6000',
      'en': 'Six-Motor Fusion Splicer WM-6000'
    },
    model: 'WM-6000',
    description: {
      'zh-CN': '高精度六马达光纤熔接机，支持多种光纤类型',
      'zh-TW': '高精度六馬達光纖熔接機，支持多種光纖類型',
      'en': 'High-precision six-motor fiber fusion splicer, supports multiple fiber types'
    },
    details: {
      'zh-CN': '<p><strong>产品特点：</strong></p><ul><li>六马达自动对准系统</li><li>高精度熔接损耗</li><li>快速熔接时间</li><li>彩色LCD显示屏</li><li>蓝牙连接功能</li></ul><p><strong>技术参数：</strong></p><ul><li>适用光纤：SM/MM/DS/NZ-DS</li><li>熔接损耗：0.02dB</li><li>熔接时间：9秒</li><li>加热时间：25秒</li><li>电池容量：连续熔接约200次</li></ul>',
      'zh-TW': '<p><strong>產品特點：</strong></p><ul><li>六馬達自動對準系統</li><li>高精度熔接損耗</li><li>快速熔接時間</li><li>彩色LCD顯示屏</li><li>藍牙連接功能</li></ul><p><strong>技術參數：</strong></p><ul><li>適用光纖：SM/MM/DS/NZ-DS</li><li>熔接損耗：0.02dB</li><li>熔接時間：9秒</li><li>加熱時間：25秒</li><li>電池容量：連續熔接約200次</li></ul>',
      'en': '<p><strong>Features:</strong></p><ul><li>Six-motor core alignment system</li><li>High precision splicing loss</li><li>Fast splicing time</li><li>Color LCD display</li><li>Bluetooth connectivity</li></ul><p><strong>Specifications:</strong></p><ul><li>Applicable Fibers: SM/MM/DS/NZ-DS</li><li>Splice Loss: 0.02dB</li><li>Splicing Time: 9s</li><li>Heating Time: 25s</li><li>Battery: ~200 cycles</li></ul>'
    }
  },
  {
    id: 2,
    name: {
      'zh-CN': '四马达熔接机 WM-4000',
      'zh-TW': '四馬達熔接機 WM-4000',
      'en': 'Four-Motor Fusion Splicer WM-4000'
    },
    model: 'WM-4000',
    description: {
      'zh-CN': '经济型四马达光纤熔接机，性价比之选',
      'zh-TW': '經濟型四馬達光纖熔接機，性價比之選',
      'en': 'Economical four-motor fiber fusion splicer, value choice'
    },
    details: {
      'zh-CN': '<p><strong>产品特点：</strong></p><ul><li>四马达自动对准</li><li>稳定可靠的性能</li><li>简单易用的操作</li><li>长效电池续航</li></ul>',
      'zh-TW': '<p><strong>產品特點：</strong></p><ul><li>四馬達自動對準</li><li>穩定可靠的性能</li><li>簡單易用的操作</li><li>長效電池續航</li></ul>',
      'en': '<p><strong>Features:</strong></p><ul><li>Four-motor alignment</li><li>Stable performance</li><li>Easy operation</li><li>Long battery life</li></ul>'
    }
  },
  {
    id: 3,
    name: {
      'zh-CN': '便携式熔接机 WM-2000',
      'zh-TW': '便攜式熔接機 WM-2000',
      'en': 'Portable Fusion Splicer WM-2000'
    },
    model: 'WM-2000',
    description: {
      'zh-CN': '轻便便携，适合现场作业',
      'zh-TW': '輕便便攜，適合現場作業',
      'en': 'Lightweight and portable, suitable for field work'
    },
    details: {
      'zh-CN': '<p><strong>产品特点：</strong></p><ul><li>超轻便设计</li><li>内置电池</li><li>快速启动</li></ul>',
      'zh-TW': '<p><strong>產品特點：</strong></p><ul><li>超輕便設計</li><li>內置電池</li><li>快速啟動</li></ul>',
      'en': '<p><strong>Features:</strong></p><ul><li>Ultra-light design</li><li>Built-in battery</li><li>Fast startup</li></ul>'
    }
  },
  {
    id: 4,
    name: {
      'zh-CN': '光功率计 PM-100',
      'zh-TW': '光功率計 PM-100',
      'en': 'Optical Power Meter PM-100'
    },
    model: 'PM-100',
    description: {
      'zh-CN': '高精度光功率测量仪，支持多种波长',
      'zh-TW': '高精度光功率測量儀，支持多種波長',
      'en': 'High-precision optical power meter, supports multiple wavelengths'
    },
    details: {
      'zh-CN': '<p><strong>产品特点：</strong></p><ul><li>850nm-1650nm波长范围</li><li>高精度测量</li><li>便携设计</li></ul>',
      'zh-TW': '<p><strong>產品特點：</strong></p><ul><li>850nm-1650nm波長範圍</li><li>高精度測量</li><li>便攜設計</li></ul>',
      'en': '<p><strong>Features:</strong></p><ul><li>850nm-1650nm range</li><li>High precision</li><li>Portable design</li></ul>'
    }
  },
  {
    id: 5,
    name: {
      'zh-CN': '光功率计 PM-200',
      'zh-TW': '光功率計 PM-200',
      'en': 'Optical Power Meter PM-200'
    },
    model: 'PM-200',
    description: {
      'zh-CN': '专业级光功率计，带数据存储功能',
      'zh-TW': '專業級光功率計，帶數據存儲功能',
      'en': 'Professional grade power meter with data storage'
    },
    details: {
      'zh-CN': '<p><strong>产品特点：</strong></p><ul><li>宽波长范围</li><li>高灵敏度</li><li>数据记录功能</li><li>USB数据传输</li></ul>',
      'zh-TW': '<p><strong>產品特點：</strong></p><ul><li>寬波長範圍</li><li>高靈敏度</li><li>數據記錄功能</li><li>USB數據傳輸</li></ul>',
      'en': '<p><strong>Features:</strong></p><ul><li>Wide wavelength range</li><li>High sensitivity</li><li>Data logging</li><li>USB transfer</li></ul>'
    }
  },
  {
    id: 6,
    name: {
      'zh-CN': '红光源 VFL-650',
      'zh-TW': '紅光源 VFL-650',
      'en': 'Visual Fault Locator VFL-650'
    },
    model: 'VFL-650',
    description: {
      'zh-CN': '650nm红光可视故障定位仪',
      'zh-TW': '650nm紅光可視故障定位儀',
      'en': '650nm Red Light Visual Fault Locator'
    },
    details: {
      'zh-CN': '<p><strong>产品特点：</strong></p><ul><li>650nm激光波长</li><li>输出功率≥1mW</li><li>连续工作时间≥8小时</li></ul>',
      'zh-TW': '<p><strong>產品特點：</strong></p><ul><li>650nm激光波長</li><li>輸出功率≥1mW</li><li>連續工作時間≥8小時</li></ul>',
      'en': '<p><strong>Features:</strong></p><ul><li>650nm laser wavelength</li><li>Output power ≥1mW</li><li>Continuous operation ≥8 hours</li></ul>'
    }
  },
  {
    id: 7,
    name: {
      'zh-CN': '红光源 VFL-650Pro',
      'zh-TW': '紅光源 VFL-650Pro',
      'en': 'Visual Fault Locator VFL-650Pro'
    },
    model: 'VFL-650Pro',
    description: {
      'zh-CN': '专业级红光可视故障定位仪',
      'zh-TW': '專業級紅光可視故障定位儀',
      'en': 'Professional Visual Fault Locator'
    },
    details: {
      'zh-CN': '<p><strong>产品特点：</strong></p><ul><li>高功率输出</li><li>多种工作模式</li><li>坚固耐用</li></ul>',
      'zh-TW': '<p><strong>產品特點：</strong></p><ul><li>高功率輸出</li><li>多種工作模式</li><li>堅固耐用</li></ul>',
      'en': '<p><strong>Features:</strong></p><ul><li>High power output</li><li>Multiple modes</li><li>Durable build</li></ul>'
    }
  },
  {
    id: 8,
    name: {
      'zh-CN': '光时域反射仪 OTDR-700',
      'zh-TW': '光時域反射儀 OTDR-700',
      'en': 'OTDR-700'
    },
    model: 'OTDR-700',
    description: {
      'zh-CN': '便携式OTDR，支持多波长测试',
      'zh-TW': '便攜式OTDR，支持多波長測試',
      'en': 'Portable OTDR, supports multi-wavelength testing'
    },
    details: {
      'zh-CN': '<p><strong>产品特点：</strong></p><ul><li>1310/1550nm双波长</li><li>测量距离40km</li><li>高精度事件定位</li><li>波形存储和回放</li></ul>',
      'zh-TW': '<p><strong>產品特點：</strong></p><ul><li>1310/1550nm雙波長</li><li>測量距離40km</li><li>高精度事件定位</li><li>波形存儲和回放</li></ul>',
      'en': '<p><strong>Features:</strong></p><ul><li>1310/1550nm dual wavelength</li><li>40km range</li><li>High precision event location</li><li>Waveform storage and playback</li></ul>'
    }
  }
]
const localEntries = localProducts.map(p => {
 const previous = previousDetails.find(old => old.model === p.model)
 const released = releasedProducts.find(item => item.model === p.model)
 return { ...p, images: released?.images.length ? released.images : p.image ? [p.image] : [],
  details: released?.details || previous?.details['zh-CN'] || `<p>${p.description}</p>`,
  detailsTranslations: previous?.details }
})
const retainedEntries = previousDetails.filter(p => !localProducts.some(item => item.model === p.model)).map(p => ({
 id: 'legacy-' + p.id, categoryId: p.model.startsWith('WM-') ? 2 : 5,
 name: p.name['zh-CN'], model: p.model, description: p.description['zh-CN'],
 image: p.model.startsWith('WM-') ? fusionSplicerImage : multiOpmImage,
 images: [p.model.startsWith('WM-') ? fusionSplicerImage : multiOpmImage],
 details: p.details['zh-CN'], detailsTranslations: p.details
}))
export const catalogCategories = [...localCategories, ...releasedCategories.filter(c => !localCategories.some(local => local.name === c.name))]
export const catalogProducts = [...releasedProducts.map(p => {
 const category = releasedCategories.find(c => c.id === p.categoryId)
 const local = localCategories.find(c => c.name === category?.name)
 return { ...p, categoryId: local?.id || p.categoryId, detailsTranslations: undefined }
}), ...localEntries, ...retainedEntries]
export const findCatalogProduct = (id: unknown) => catalogProducts.find(p => String(p.id) === String(id))
