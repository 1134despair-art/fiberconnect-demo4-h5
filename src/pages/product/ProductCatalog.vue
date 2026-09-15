<template>
  <div class="app-container legacy-app-page legacy-catalog-page workspace-page">
    <!-- 顶部标题栏 -->
    <header class="workspace-header">
      <h1>{{ t('common.product') }}</h1>
      <span class="header-mark">产品分类</span>
    </header>
    
    <!-- 主内容区域 -->
    <div class="content-flex hide-scrollbar">
      <div class="catalog-container">
        <!-- 左侧分类列表 -->
        <div class="category-sidebar">
          <button
            v-for="category in categories" 
            :key="category.id"
            class="category-item"
            :class="{ active: selectedCategory === category.id }"
            :aria-pressed="selectedCategory === category.id"
            @click="selectCategory(category.id)"
          >
            <span class="category-name">
              {{ category.name }}
              <span class="category-count">{{ getCategoryProductCount(category.id) }}</span>
            </span>
          </button>
        </div>
        
        <!-- 右侧产品列表 -->
        <div class="product-list">
          <div class="category-header">
            <h3 class="category-title">{{ getCurrentCategoryName() }}</h3>
            <span class="product-total">{{ t('product.totalProducts', { count: getCategoryProductCount(selectedCategory) }) }}</span>
          </div>
          
          <div v-if="filteredProducts.length === 0" class="empty-products">
            <div class="empty-icon">
              <span class="iconify" data-icon="mdi:package-variant"></span>
            </div>
            <div class="empty-text">{{ t('product.noProducts') }}</div>
          </div>
          
          <div v-else class="products-grid">
            <button
              v-for="product in filteredProducts" 
              :key="product.id"
              class="product-card"
              @click="viewProductDetail(product)"
            >
              <div class="product-image">
                <img v-if="product.image" :src="product.image" :alt="product.name" class="product-thumb" />
                <span v-else class="iconify image-icon" data-icon="mdi:package-variant-closed"></span>
              </div>
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-model">型号: {{ product.model }}</div>
                <div class="product-desc">{{ product.description }}</div>
              </div>
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部导航栏 -->
    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BottomNavigation from '@/components/BottomNavigation.vue'
import '@/styles/workspace.css'
import fusionSplicerImage from '@/assets/app/products/fusion-splicer.png'
import portableOtdrImage from '@/assets/app/products/portable-otdr.png'
import smartOtdrImage from '@/assets/app/products/smart-otdr.png'
import multiOpmImage from '@/assets/app/products/multi-opm.png'

const router = useRouter()
const { t } = useI18n()

// 分类数据
const categories = computed(() => [
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
])

// 产品数据
const products = computed(() => [
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
    image: '',
    details: ''
  },
  {
    id: 6,
    categoryId: 11,
    name: '光纤红光笔 VFL-650',
    model: 'VFL-650',
    description: '650nm红光可视故障定位仪',
    image: '',
    details: ''
  },
  {
    id: 7,
    categoryId: 11,
    name: '光纤红光笔 VFL-650Pro',
    model: 'VFL-650Pro',
    description: '专业级红光可视故障定位仪',
    image: '',
    details: ''
  },
  {
    id: 8,
    categoryId: 22,
    name: '光纤链路测试仪 OTDR-700',
    model: 'OTDR-700',
    description: '便携式OTDR，支持多波长测试',
    image: '',
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
])

// 选中的分类
const selectedCategory = ref(1)

// 过滤后的产品
const filteredProducts = computed(() => {
  return products.value.filter(p => p.categoryId === selectedCategory.value)
})

/**
 * 获取分类产品数量
 */
const getCategoryProductCount = (categoryId: number) => {
  return categories.value.find(category => category.id === categoryId)?.count || 0
}

/**
 * 获取当前分类名称
 */
const getCurrentCategoryName = () => {
  const category = categories.value.find(c => c.id === selectedCategory.value)
  return category ? category.name : ''
}

/**
 * 选择分类
 */
const selectCategory = (categoryId: number) => {
  selectedCategory.value = categoryId
}

/**
 * 查看产品详情
 */
const viewProductDetail = (product: any) => {
  router.push(`/product/${product.id}`)
}


</script>

<style scoped>
.workspace-page .category-sidebar { width: 98px; background: #f3f4f6; border-right: 1px solid #e9ebef; }
.workspace-page .category-item { width: 100%; min-height: 61px; border: 0; border-bottom: 1px solid #e9ebef; padding: 13px 10px; background: transparent; }
.workspace-page .category-item.active { background: #fff; }
.workspace-page .category-item.active::before { height: 24px; width: 3px; border-radius: 0 3px 3px 0; }
.workspace-page .category-name { font-size: 12px; line-height: 1.65; gap: 4px; color: #747b85; }
.workspace-page .category-count { font-size: 10px; padding: 0; background: transparent; color: #969ca5; }
.workspace-page .category-item.active .category-name { color: #2458bb; }
.workspace-page .category-item.active .category-count { background: transparent; color: #2458bb; }
.workspace-page .product-list { padding: 18px 14px; background: #fff; }
.workspace-page .category-header { display: block; margin-bottom: 16px; }
.workspace-page .category-title { font-size: 15px; line-height: 1.6; }
.workspace-page .product-total { display: block; margin-top: 3px; font-size: 11px; color: #818792; }
.workspace-page .products-grid { gap: 18px; }
.workspace-page .product-card { width: 100%; padding: 0 0 16px; display: grid; grid-template-columns: minmax(0, 1fr) 20px; gap: 12px 4px; text-align: left; border: 0; border-bottom: 1px solid #eceef1; border-radius: 0; background: #fff; box-shadow: none; }
.workspace-page .product-card:hover { transform: none; box-shadow: none; }
.workspace-page .product-image { grid-column: 1 / -1; width: 100%; height: 144px; border-radius: 6px; background: #f5f6f8; padding: 12px 22px; }
.workspace-page .product-card:hover .product-image { background: #eef2f7; }
.workspace-page .product-name { font-size: 14px; line-height: 1.6; white-space: normal; overflow: visible; overflow-wrap: anywhere; }
.workspace-page .product-model { margin: 3px 0; padding: 0; font-size: 11px; color: #2d62bc; background: transparent; }
.workspace-page .product-desc { font-size: 11px; line-height: 1.7; white-space: normal; overflow: visible; color: #818792; }
.workspace-page .arrow-icon { align-self: center; }
@media (max-width: 350px) {
  .workspace-page .category-sidebar { width: 84px; }
  .workspace-page .product-list { padding: 16px 10px; }
  .workspace-page .product-image { height: 124px; padding: 12px; }
}
.app-container {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%);
  overflow: hidden;
}

.content-flex {
  flex: 1;
  min-height: 0; /* 关键：允许 flex 项目收缩 */
  display: flex;
  flex-direction: column;
}

.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  color: #1F2937;
  border-bottom: 1px solid #E5E7EB;
  z-index: 10;
}

.header-placeholder {
  width: 40px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
  text-align: center;
  flex: 1;
}

.catalog-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: transparent;
  padding-top: 0;
  box-sizing: border-box;
  overflow: hidden;
}

/* 分类侧边栏 */
.category-sidebar {
  width: 90px;
  background: #FFFFFF;
  overflow-y: auto;
  flex-shrink: 0;
  border-right: 1px solid #E5E7EB;
  height: 100%; /* 确保填满容器 */
  overflow-y: auto;
}

.category-item {
  padding: 16px 8px;
  display: flex;
  flex-direction: column; /* 保持 flex-direction: column */
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid transparent; /* 占位 */
  position: relative;
}

.category-item.active {
  background: #EFF6FF; /* 选中背景色 */
}

.category-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #2563EB;
  border-radius: 0 2px 2px 0;
}

.category-name {
  font-size: 13px;
  font-weight: 500;
  color: #64748B;
  text-align: center;
  display: flex; /* 使用 flex 布局 */
  align-items: center;
  gap: 4px; /* 名称和数字之间的间距 */
  justify-content: center;
  flex-wrap: wrap; /* 允许换行，以防太长 */
}

.category-item.active .category-name {
  color: #2563EB;
  font-weight: 600;
}

.category-count {
  font-size: 10px;
  color: #94A3B8;
  background: #F1F5F9;
  padding: 2px 6px;
  border-radius: 10px;
  /* 移除 block 属性，让它跟随 flex 流 */
}

.category-item.active .category-count {
  background: #DBEAFE;
  color: #2563EB;
}

/* 产品列表 */
.product-list {
  flex: 1;
  min-width: 0;
  padding: 10px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  overflow-y: auto;
  background: transparent;
  height: 100%; /* 确保填满容器 */
  box-sizing: border-box;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 0;
  border-bottom: none;
}

.category-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.product-total {
  font-size: 12px;
  color: #6B7280;
}

.empty-products {
  text-align: center;
  padding: 60px 20px;
  color: #9CA3AF;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
  color: #CBD5E1;
}

.empty-text {
  font-size: 14px;
}

.products-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #FFFFFF;
  border: 1px solid rgba(229, 231, 235, 0.5); /* 更淡的边框 */
  border-radius: 16px; /* 更圆润的圆角，与首页一致 */
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); /* 更柔和的阴影 */
}

.product-card:hover {
  background: #FFFFFF;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.product-image {
  width: 64px;
  height: 64px;
  background: #F0F9FF; /* 淡蓝色背景 */
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.product-thumb {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-icon {
  font-size: 32px;
  color: #2563EB;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-model {
  font-size: 12px;
  color: #2563EB;
  margin-bottom: 4px;
  font-weight: 500;
  background: #EFF6FF;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.product-desc {
  font-size: 12px;
  color: #6B7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.arrow-icon {
  font-size: 20px;
  color: #CBD5E1;
  flex-shrink: 0;
}

/* 底部导航栏样式已移至 BottomNavigation 组件 */

/* 响应式设计 */
@media (max-width: 768px) {
  .category-sidebar {
    width: 84px;
  }
  
  .product-image {
    width: 56px;
    height: 56px;
  }
  
  .image-icon {
    font-size: 28px;
  }
}
</style>
