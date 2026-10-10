<template>
  <div class="app-container legacy-app-page workspace-page workspace-secondary product-detail-page">
    <!-- 顶部标题栏 -->
    <WorkspaceHeader :title="t('productDetail.title')" @back="goBack" />
    
    <!-- 主内容区域 -->
    <div class="content-flex hide-scrollbar">
      <div v-if="product" class="p-4">
        <ProductGallery v-if="productImages.length" :key="String(product.id)" :images="productImages" :name="product.name" />
        <div v-else class="product-image-section"><div class="image-placeholder"><img :src="productPlaceholderIcon" :alt="product.name" class="detail-product-image" /></div></div>

        <!-- 产品基本信息 -->
        <div class="product-info-section mb-4">
          <h2 class="product-name">{{ getLocalizedContent(product?.name) }}</h2>
          <div class="product-model">{{ t('productDetail.model') }}: {{ product?.model }}</div>
          <div class="product-desc">{{ getLocalizedContent(product?.description) }}</div>
        </div>
        
        <!-- 产品详情 -->
        <div class="product-detail-section">
          <h3 class="section-title">{{ t('productDetail.title') }}</h3>
          <div class="detail-content released-detail" v-html="productDetails"></div>
        </div>
        
      </div>
    </div>
    
    <div v-if="product" class="page-actions">
      <button @click="requestAfterSales" class="primary-action">
        <LocalIcon class="iconify" name="mdi:headset" />
        {{ t('productDetail.applyAfterSales') }}
      </button>
    </div>
    <div v-if="!product" class="product-not-found"><h2>未找到该产品</h2><p>产品可能已更新，请返回产品列表重新选择。</p><button class="primary-action" @click="router.push('/catalog')">返回产品列表</button></div>
    <!-- 底部导航栏 -->
    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
import LocalIcon from '@/components/LocalIcon.vue'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { findCatalogProduct } from '@/data/productCatalog'
import productPlaceholderIcon from '@/assets/icons/iconfont/product.svg'
import ProductGallery from '@/components/ProductGallery.vue'
import { safeProductDetails } from '@/data/releasedContent'
import BottomNavigation from '@/components/BottomNavigation.vue'
import { useI18n } from 'vue-i18n'
import WorkspaceHeader from '@/components/WorkspaceHeader.vue'
import '@/styles/subpages.css'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

// 辅助函数：获取本地化内容
const getLocalizedContent = (data: any) => {
  if (!data) return ''
  if (typeof data === 'string') return data
  // 尝试获取当前语言内容
  const content = data[locale.value]
  // 如果当前语言内容不存在，回退到简体中文，再回退到第一个可用的语言
  return content || data['zh-CN'] || Object.values(data)[0] || ''
}

const product = computed(() => findCatalogProduct(route.params.id))
const productImages = computed(() => product.value?.images || [])
const productDetails = computed(() => {
 const p = product.value
 if (!p) return ''
 const translations = p.detailsTranslations as Record<string, string> | undefined
 const html = translations?.[locale.value] || p.details || (p.description ? `<p>${p.description}</p>` : '')
 return safeProductDetails(html || p.images.map(src => `<p><img src="${src}"></p>`).join(''))
})

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
  if (product.value) router.push({ path: '/after-sales', query: { productId: String(product.value.id), create: '1' } })
}




</script>

<style scoped>
.product-not-found { padding:24px;text-align:center; }.product-not-found p {color:#64748b;line-height:1.6;margin:16px 0;}
.released-detail :deep(img){display:block;width:100%;max-width:100%;height:auto;object-fit:contain}
.released-detail :deep(p){margin:0!important}
.released-detail :deep(table){display:block;max-width:100%;overflow-x:auto}
.product-detail-page .product-detail-section:has(.released-detail){padding:16px 0 0}
.product-detail-page .product-detail-section:has(.released-detail) .section-title{padding:0 16px}

.product-detail-page .p-4 { padding: 0; }
.product-detail-page .product-image-section { padding: 18px 24px; margin: 0; background: #fff; border-bottom: 1px solid #eceff3; }
.product-detail-page .image-placeholder { height: 220px; border-radius: 0; background: #fff; box-shadow: none; }
.detail-product-image { width: 100%; height: 100%; object-fit: contain; border-radius: 6px; background: #fff; }
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