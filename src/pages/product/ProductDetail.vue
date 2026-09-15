<template>
  <div class="app-container legacy-app-page workspace-page workspace-secondary product-detail-page">
    <!-- 顶部标题栏 -->
    <WorkspaceHeader :title="t('productDetail.title')" @back="goBack" />
    
    <!-- 主内容区域 -->
    <div class="content-flex hide-scrollbar">
      <div class="p-4">
        <!-- 产品图片 -->
        <div class="product-image-section">
          <div class="image-placeholder">
            <img v-if="productImage" :src="productImage" :alt="getLocalizedContent(product?.name)" class="detail-product-image" />
            <span v-else class="iconify product-icon" data-icon="mdi:package-variant-closed"></span>
          </div>
        </div>
        
        <!-- 产品基本信息 -->
        <div class="product-info-section mb-4">
          <h2 class="product-name">{{ getLocalizedContent(product?.name) }}</h2>
          <div class="product-model">{{ t('productDetail.model') }}: {{ product?.model }}</div>
          <div class="product-desc">{{ getLocalizedContent(product?.description) }}</div>
        </div>
        
        <!-- 产品详情 -->
        <div class="product-detail-section">
          <h3 class="section-title">{{ t('productDetail.title') }}</h3>
          <div class="detail-content" v-html="getLocalizedContent(product?.details)"></div>
        </div>
        
      </div>
    </div>
    
    <div class="page-actions">
      <button @click="requestAfterSales" class="primary-action">
        <span class="iconify" data-icon="mdi:headset"></span>
        {{ t('productDetail.applyAfterSales') }}
      </button>
    </div>
    <!-- 底部导航栏 -->
    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BottomNavigation from '@/components/BottomNavigation.vue'
import { useI18n } from 'vue-i18n'
import WorkspaceHeader from '@/components/WorkspaceHeader.vue'
import '@/styles/subpages.css'
import fusionImage from '@/assets/app/products/fusion-splicer.png'
import opmImage from '@/assets/app/products/multi-opm.png'
import otdrImage from '@/assets/app/products/portable-otdr.png'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

// 辅助函数：获取本地化内容
const getLocalizedContent = (data: any) => {
  if (!data) return ''
  // 尝试获取当前语言内容
  const content = data[locale.value]
  // 如果当前语言内容不存在，回退到简体中文，再回退到第一个可用的语言
  return content || data['zh-CN'] || Object.values(data)[0] || ''
}

// 产品数据
const products = ref([
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
])

const product = ref<any>(null)
const productImage = computed(() => {
  const model = product.value?.model || ''
  if (model.startsWith('WM-')) return fusionImage
  if (model.startsWith('PM-')) return opmImage
  if (model.startsWith('OTDR')) return otdrImage
  return ''
})

/**
 * 获取产品信息
 */
const getProduct = () => {
  const productId = parseInt(route.params.id as string)
  product.value = products.value.find(p => p.id === productId) || null
}

/**
 * 返回上一页
 */
const goBack = () => {
  router.back()
}

/**
 * 申请售后服务
 */
const requestAfterSales = () => {
  router.push('/after-sales')
}



onMounted(() => {
  getProduct()
})
</script>

<style scoped>
.product-detail-page .p-4 { padding: 0; }
.product-detail-page .product-image-section { padding: 20px 30px; margin: 0; background: #f3f5f8; }
.product-detail-page .image-placeholder { height: 190px; border-radius: 0; background: transparent; box-shadow: none; }
.detail-product-image { width: 100%; height: 100%; object-fit: contain; }
.product-detail-page .product-info-section, .product-detail-page .product-detail-section { padding: 20px; border-radius: 0; background: #fff; box-shadow: none; margin: 0; }
.product-detail-page .product-info-section:active, .product-detail-page .product-detail-section:active { transform: none; }
.product-detail-page .product-detail-section { margin-top: 12px; }
.product-detail-page .product-name { font-size: 19px; line-height: 1.5; margin-bottom: 10px; overflow-wrap: anywhere; }
.product-detail-page .product-model { background: #edf3fc; border-radius: 4px; font-size: 12px; margin-bottom: 12px; }
.product-detail-page .product-desc { font-size: 13px; line-height: 1.8; color: #77808c; }
.product-detail-page .detail-content { font-size: 13px; line-height: 1.8; }
.detail-content :deep(p) { margin: 16px 0 8px; color: #3c4857; }
.detail-content :deep(ul) { padding: 0; margin: 0; list-style: none; }
.detail-content :deep(li) { padding: 10px 0; border-bottom: 1px solid #edf0f3; color: #6f7985; }
.app-container {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%);
  overflow: hidden;
}

.content-flex {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.p-4 {
  padding: 20px;
}

.mb-4 {
  margin-bottom: 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #E5E7EB;
  color: #1F2937;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  color: #2563EB;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 0;
  font-weight: 500;
}

.header-placeholder {
  width: 60px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 16px 0;
}

/* 产品图片 */
.product-image-section {
  margin-bottom: 20px;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: #F9FAFB;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.product-icon {
  font-size: 64px;
  color: #2563EB;
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
}

.image-text {
  font-size: 16px;
  font-weight: 500;
  color: #6B7280;
}

/* 产品信息 */
.product-info-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
  transition: all 0.2s ease;
}

.product-info-section:active {
  transform: scale(0.98);
}

.product-name {
  font-size: 20px;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 12px 0;
}

.product-model {
  font-size: 13px;
  color: #2563EB;
  margin-bottom: 12px;
  background: #F0F9FF;
  padding: 4px 8px;
  border-radius: 8px;
  display: inline-block;
  font-weight: 500;
}

.product-desc {
  font-size: 15px;
  color: #4B5563;
  line-height: 1.6;
}

/* 产品详情 */
.product-detail-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.product-detail-section:active {
  transform: scale(0.98);
}

.detail-content {
  font-size: 15px;
  color: #6B7280;
  line-height: 1.6;
}

.detail-content ul {
  margin: 0;
  padding-left: 20px;
}

.detail-content li {
  margin-bottom: 8px;
}

/* 售后按钮 */
.action-section {
  margin-top: 24px;
  width: 100%;
}

.after-sales-btn {
  width: 100%;
  background: #2563EB;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.24);
}

.after-sales-btn:hover {
  background: #1D4ED8;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
}

.after-sales-btn:active {
  background: #1D4ED8;
  filter: brightness(0.95);
  transform: none;
}
</style>
