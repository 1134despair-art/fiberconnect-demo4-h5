<script setup lang="ts">
import LocalIcon from '@/components/LocalIcon.vue'
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { catalogProducts, findCatalogProduct } from '@/data/productCatalog'
import { scopedKey, readStored } from '@/services/scopedStorage'
import { useI18n } from 'vue-i18n'
import { useModal } from '@/composables/useModal'
import BottomNavigation from '@/components/BottomNavigation.vue'
import WorkspaceHeader from '@/components/WorkspaceHeader.vue'
import '@/styles/subpages.css'
import plusIcon from '@/assets/icons/mdi-plus.svg'

const { t } = useI18n()
const { alert, showModal, modalOptions, handleConfirm } = useModal()

const route = useRoute()
const products = computed(() => catalogProducts)
interface ServiceOrder {
 id: string; productId: string; productName: string; productModel: string;
 problemDescription: string; contactPhone: string; status: string; createTime: string;
 returnExpressNo: string; sendBackExpressNo: string; result: string
}
const orderStorageKey = scopedKey('after-sales')
const storedOrders = readStored<unknown>(orderStorageKey, [])
const orders = ref<ServiceOrder[]>(Array.isArray(storedOrders) ? storedOrders : [])

// Modal states
const showCreateOrder = ref(route.query.create === '1')
const showOrderDetail = ref(false)
const isSubmitting = ref(false)
const selectedOrder = ref<any>(null)

// New order form
const newOrder = reactive({
  productId: findCatalogProduct(route.query.productId) ? String(route.query.productId) : '',
  problemDescription: '',
  contactPhone: '',
  returnExpressNo: '',
  sendBackExpressNo: ''
})

// Accept mobile or landline numbers with international prefix and separators.
const contactValid = computed(() => /^\+?[0-9][0-9 ()-]{5,22}$/.test(newOrder.contactPhone.trim()) && newOrder.contactPhone.replace(/\D/g, '').length >= 7 && newOrder.contactPhone.replace(/\D/g, '').length <= 15)
const isFormValid = computed(() => !!findCatalogProduct(newOrder.productId) && !!newOrder.problemDescription.trim() && contactValid.value)
watch(() => route.query.productId, value => {
 if (findCatalogProduct(value)) { newOrder.productId = String(value); showCreateOrder.value = true }
})

/**
 * Get status text
 */
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return t('afterSales.pending')
    case 'processing':
      return t('afterSales.processing')
    case 'completed':
      return t('afterSales.completed')
    default:
      return 'Unknown'
  }
}

/**
 * Select product
 */
const selectProduct = () => {
  // Can show more product info based on selection
}

/**
 * Submit order
 */
const submitOrder = async () => {
  if (!isFormValid.value) return
  
  isSubmitting.value = true
  try {
    const product = findCatalogProduct(newOrder.productId)
    if (!product) return
    
    const order = {
      id: `RMA${Date.now()}${crypto.randomUUID().slice(0, 6)}`,
      productId: String(product.id),
      contactPhone: newOrder.contactPhone.trim(),
      productName: product?.name || '',
      productModel: product?.model || '',
      problemDescription: newOrder.problemDescription,
      status: 'pending',
      createTime: new Date().toLocaleString('zh-CN'),
      returnExpressNo: newOrder.returnExpressNo,
      sendBackExpressNo: newOrder.sendBackExpressNo,
      result: ''
    }
    
    const nextOrders = [order, ...orders.value]
    localStorage.setItem(orderStorageKey, JSON.stringify(nextOrders))
    orders.value = nextOrders
    
    // Reset form
    newOrder.productId = ''
    newOrder.problemDescription = ''
    newOrder.contactPhone = ''
    newOrder.returnExpressNo = ''
    newOrder.sendBackExpressNo = ''
    
    showCreateOrder.value = false
    await alert(t('afterSales.successSubmit'), t('common.success'))
  } catch (error) {
    await alert(t('afterSales.errorSubmit'), t('common.error'))
  } finally {
    isSubmitting.value = false
  }
}

/**
 * View order detail
 */
const viewOrderDetail = (order: any) => {
  selectedOrder.value = order
  showOrderDetail.value = true
}
</script>

<template>
  <div class="app-container legacy-app-page workspace-page workspace-secondary workspace-dialogs after-sales-page">
    <!-- 顶部标题栏 -->
    <WorkspaceHeader :title="t('afterSales.title')" @back="$router.push('/settings')">
      <button class="workspace-icon-button" :aria-label="t('afterSales.createOrder')" :title="t('afterSales.createOrder')" @click="showCreateOrder = true"><img :src="plusIcon" alt="" class="plus-icon" /></button>
    </WorkspaceHeader>
    
    <!-- 主内容区域 -->
    <div class="content-flex hide-scrollbar">
      <div class="p-4">
        <!-- 订单列表 -->
        <div class="orders-card">
          <div class="orders-header">
            <h3 class="section-title">{{ t('afterSales.orderList') }}</h3>
            <span class="order-count">{{ t('afterSales.totalOrders', { count: orders.length }) }}</span>
          </div>
          
          <div v-if="orders.length === 0" class="empty-orders">
            <div class="empty-icon">
              <LocalIcon class="iconify" name="mdi:clipboard-text-off" />
            </div>
            <div class="empty-text">{{ t('afterSales.noOrders') }}</div>
            <div class="empty-tip">{{ t('afterSales.clickToCreate') }}</div>
          </div>
          
          <div v-else class="orders-list">
            <div 
              v-for="order in orders" 
              :key="order.id"
              class="order-card"
              role="button"
              tabindex="0"
              @click="viewOrderDetail(order)"
              @keydown.enter="viewOrderDetail(order)"
              @keydown.space.prevent="viewOrderDetail(order)"
            >
              <div class="order-header">
                <div class="order-info">
                  <div class="order-id">{{ t('afterSales.orderId') }}: {{ order.id }}</div>
                  <div class="order-date">{{ t('afterSales.createTime') }}: {{ order.createTime }}</div>
                </div>
                <div class="order-status" :class="order.status">
                  {{ getStatusText(order.status) }}
                </div>
              </div>
              
              <div class="order-product">
                <div class="product-label">{{ t('afterSales.afterSalesProduct') }}</div>
                <div class="product-name">{{ order.productName }}</div>
                <div class="product-model">{{ t('afterSales.productModel') }}: {{ order.productModel }}</div>
              </div>
              
              <div v-if="order.returnExpressNo" class="order-express">
                <div class="express-item">
                  <span class="express-label">{{ t('afterSales.returnExpress') }}:</span>
                  <span class="express-value">{{ order.returnExpressNo }}</span>
                </div>
                <div v-if="order.sendBackExpressNo" class="express-item">
                  <span class="express-label">{{ t('afterSales.sendBackExpress') }}:</span>
                  <span class="express-value">{{ order.sendBackExpressNo }}</span>
                </div>
              </div>
              
              <div class="order-problem">
                <div class="problem-label">{{ t('afterSales.problemDesc') }}</div>
                <div class="problem-desc">{{ order.problemDescription }}</div>
              </div>
              
              <div class="order-actions">
                <LocalIcon class="iconify arrow-icon" name="mdi:chevron-right" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建订单弹窗 -->
    <div v-if="showCreateOrder" class="modal-overlay" @click="showCreateOrder = false">
      <div class="modal-content" role="dialog" aria-modal="true" :aria-label="t('afterSales.createOrder')" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('afterSales.createOrder') }}</h3>
          <button @click="showCreateOrder = false" class="modal-close" :aria-label="t('common.close')">
            <LocalIcon class="iconify" name="mdi:close" />
          </button>
        </div>
        <div class="modal-body">
          <div class="create-order-form">
            <!-- 选择产品 -->
            <div class="form-group">
              <label class="form-label">{{ t('afterSales.selectProduct') }}</label>
              <select id="service-product" aria-label="选择产品" v-model="newOrder.productId" class="form-select" @change="selectProduct">
                <option value="">{{ t('afterSales.placeholderSelectProduct') }}</option>
                <option v-for="product in products" :key="product.id" :value="product.id">
                  {{ product.name }} ({{ product.model }})
                </option>
              </select>
            </div>
            
            <!-- 问题描述 -->
            <div class="form-group">
              <label class="form-label">{{ t('afterSales.problemDesc') }}</label>
              <textarea 
                v-model="newOrder.problemDescription" 
                class="form-textarea"
                :placeholder="t('afterSales.placeholderProblem')"
                rows="4"
              ></textarea>
            </div>
            
            <!-- 联系方式 -->
            <div class="form-group">
              <label class="form-label">{{ t('afterSales.contactPhone') }}</label>
              <input 
                v-model="newOrder.contactPhone" 
                id="service-contact"
                aria-label="联系电话"
                :aria-invalid="!!newOrder.contactPhone && !contactValid"
                aria-describedby="service-contact-error"
                type="tel"
                class="form-input"
                :placeholder="t('afterSales.inputContactPhone')"
              />
            </div>
            
            <p v-if="newOrder.contactPhone && !contactValid" id="service-contact-error" class="field-error" role="alert">请输入有效的联系电话（7～15 位数字）</p>
            <!-- 退回快递单号 -->
            <div class="form-group">
              <label class="form-label">{{ t('afterSales.returnExpressNo') }}</label>
              <input 
                v-model="newOrder.returnExpressNo" 
                type="text"
                class="form-input"
                :placeholder="t('afterSales.inputReturnExpress')"
              />
            </div>
            
            <!-- 回寄快递单号 -->
            <div class="form-group">
              <label class="form-label">{{ t('afterSales.sendBackExpressNo') }}</label>
              <input 
                v-model="newOrder.sendBackExpressNo" 
                type="text"
                class="form-input"
                :placeholder="t('afterSales.inputSendBackExpress')"
              />
            </div>
            
            <!-- 提交按钮 -->
            <button 
              @click="submitOrder" 
              class="submit-btn"
              :disabled="!isFormValid || isSubmitting"
            >
              {{ isSubmitting ? t('common.submitting') : t('afterSales.submitOrder') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单详情弹窗 -->
    <div v-if="showOrderDetail" class="modal-overlay" @click="showOrderDetail = false">
      <div class="modal-content" role="dialog" aria-modal="true" :aria-label="t('afterSales.orderDetail')" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('afterSales.orderDetail') }}</h3>
          <button @click="showOrderDetail = false" class="modal-close" :aria-label="t('common.close')">
            <LocalIcon class="iconify" name="mdi:close" />
          </button>
        </div>
        <div v-if="selectedOrder" class="modal-body">
          <div class="order-detail">
            <div class="order-detail-status" :class="selectedOrder.status">
              <LocalIcon class="iconify" :name="selectedOrder.status === 'completed' ? 'mdi:check-circle-outline' : 'mdi:clock-outline'" />
              <strong>{{ getStatusText(selectedOrder.status) }}</strong>
            </div>
            <div class="detail-section">
              <h4 class="section-title">{{ t('afterSales.orderInfo') }}</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">{{ t('afterSales.orderId') }}</span>
                  <span class="detail-value">{{ selectedOrder.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ t('afterSales.createTime') }}</span>
                  <span class="detail-value">{{ selectedOrder.createTime }}</span>
                </div><div class="detail-item"><span class="detail-label">{{ t('afterSales.contactPhone') }}</span><span class="detail-value">{{ selectedOrder.contactPhone || '未填写' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ t('afterSales.status') }}</span>
                  <span class="detail-value status" :class="selectedOrder.status">
                    {{ getStatusText(selectedOrder.status) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="section-title">{{ t('afterSales.productInfo') }}</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">{{ t('afterSales.productName') }}</span>
                  <span class="detail-value">{{ selectedOrder.productName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ t('afterSales.productModel') }}</span>
                  <span class="detail-value">{{ selectedOrder.productModel }}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="section-title">{{ t('afterSales.problemDesc') }}</h4>
              <div class="problem-box">{{ selectedOrder.problemDescription }}</div>
            </div>
            
            <div v-if="selectedOrder.returnExpressNo" class="detail-section">
              <h4 class="section-title">{{ t('afterSales.expressInfo') }}</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">{{ t('afterSales.returnExpressNo') }}</span>
                  <span class="detail-value express">{{ selectedOrder.returnExpressNo }}</span>
                </div>
                <div v-if="selectedOrder.sendBackExpressNo" class="detail-item">
                  <span class="detail-label">{{ t('afterSales.sendBackExpressNo') }}</span>
                  <span class="detail-value express">{{ selectedOrder.sendBackExpressNo }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="selectedOrder.status !== 'pending'" class="detail-section">
              <h4 class="section-title">{{ t('afterSales.result') }}</h4>
              <div class="result-box">
                {{ selectedOrder.result || t('afterSales.processing') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部导航栏 -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content" role="dialog" aria-modal="true" :aria-label="modalOptions.title">
        <div class="modal-header"><h3 class="modal-title">{{ modalOptions.title }}</h3></div>
        <div class="modal-body"><p class="submission-message">{{ modalOptions.message }}</p><button class="primary-action" @click="handleConfirm">{{ t('common.confirm') }}</button></div>
      </div>
    </div>
    <BottomNavigation />
  </div>
</template>

<style scoped>
.field-error {color:#b42318;font-size:13px;line-height:1.5;margin:0 0 12px;}
.plus-icon { width: 22px; height: 22px; filter: brightness(0) invert(1); }
.after-sales-page .orders-card { padding: 0; border: 0; border-radius: 0; box-shadow: none; background: transparent; }
.after-sales-page .orders-header { margin: 0 0 16px; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.after-sales-page .orders-header .section-title { margin: 0; }
.after-sales-page .order-count { font-size: 12px; color: #808894; }
.after-sales-page .orders-list { gap: 14px; }
.after-sales-page .order-card { padding: 16px; border: 1px solid #e4e8ee; border-radius: 8px; background: #fff; box-shadow: none; position: relative; }
.after-sales-page .order-card:hover { transform: none; border-color: #b7c8e5; box-shadow: none; }
.after-sales-page .order-card:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.after-sales-page .order-header { display: flex; flex-wrap: wrap; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid #edf0f3; }
.after-sales-page .order-info { flex: 1 1 170px; min-width: 0; }
.after-sales-page .order-id { font-size: 12px; color: #67717f; overflow-wrap: anywhere; margin-bottom: 6px; }
.after-sales-page .order-date { font-size: 11px; color: #9299a3; }
.after-sales-page .order-status { font-size: 11px; padding: 3px 7px; border-radius: 4px; align-self: flex-start; white-space: normal; }
.after-sales-page .order-status.processing { background: #edf3ff; color: #3261b4; }
.after-sales-page .order-status.completed { background: #edf8f2; color: #27785b; }
.after-sales-page .order-product { margin: 14px 0; }
.after-sales-page .product-label { display: none; }
.after-sales-page .product-name { font-size: 15px; line-height: 1.6; color: #303c4b; overflow-wrap: anywhere; }
.after-sales-page .product-model { font-size: 11px; color: #8a929d; margin-top: 3px; }
.after-sales-page .order-express { padding: 0; background: transparent; border: 0; border-radius: 0; margin-bottom: 12px; }
.after-sales-page .express-item { display: flex; flex-wrap: wrap; gap: 5px 8px; font-size: 11px; }
.after-sales-page .express-label { font-size: 11px; color: #8a929d; }
.after-sales-page .express-value { font-size: 11px; color: #667384; overflow-wrap: anywhere; }
.after-sales-page .order-problem { padding: 12px 22px 0 0; margin: 0; border-top: 1px solid #edf0f3; }
.after-sales-page .problem-label { font-size: 11px; color: #9299a3; margin-bottom: 5px; }
.after-sales-page .problem-desc { font-size: 12px; line-height: 1.7; color: #66717f; }
.after-sales-page .order-actions { position: absolute; right: 14px; bottom: 16px; margin: 0; }
.after-sales-page .order-detail { gap: 0; }
.after-sales-page .detail-section { padding: 18px 0; border-bottom: 1px solid #e9edf2; }
.after-sales-page .detail-section .section-title { margin: 0 0 6px; font-size: 13px; color: #424f60; }
.after-sales-page .detail-grid { display: block; }
.after-sales-page .order-detail-status { display: flex; align-items: center; gap: 9px; padding: 16px; background: #edf3ff; color: #3261b4; font-size: 15px; border-radius: 6px; }
.after-sales-page .order-detail-status.completed { background: #edf8f2; color: #27785b; }
.after-sales-page .order-detail-status .iconify { font-size: 24px; }
.after-sales-page .problem-box, .after-sales-page .result-box { padding: 0; background: transparent; border: 0; border-radius: 0; color: #687482; font-size: 13px; line-height: 1.8; }
.submission-message { margin: 0 0 20px; font-size: 14px; line-height: 1.7; }
.p-4 {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

/* Header styles */
.header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: #EFF6FF;
  color: #1F2937;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 12px 0;
}

/* Create order button */
.create-order-section {
  text-align: center;
}

.create-order-btn {
  width: 100%;
  background: #2563EB;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.create-order-btn:hover {
  background: #1D4ED8;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

/* Orders card */
.orders-card {
  background: #FFFFFF;
  border: 1px solid rgba(30, 58, 95, 0.1);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.orders-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.order-count {
  font-size: 14px;
  color: #6B7280;
}

.empty-orders {
  text-align: center;
  padding: 60px 20px;
  color: #6B7280;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.empty-tip {
  font-size: 14px;
  color: #9CA3AF;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.order-card:hover {
  background: #F3F4F6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.order-info {
  flex: 1;
}

.order-id {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}

.order-date {
  font-size: 12px;
  color: #6B7280;
}

.order-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.order-status.pending {
  background: #FEF3C7;
  color: #92400E;
}

.order-status.processing {
  background: #DBEAFE;
  color: #1E40AF;
}

.order-status.completed {
  background: #D1FAE5;
  color: #065F46;
}

.order-product {
  margin-bottom: 12px;
}

.product-label {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 2px;
}

.product-model {
  font-size: 12px;
  color: #2563EB;
}

.order-express {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.express-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 6px;
}

.express-item:last-child {
  margin-bottom: 0;
}

.express-label {
  color: #6B7280;
  font-size: 13px;
}

.express-value {
  color: #1F2937;
  font-weight: 500;
  font-size: 13px;
}

.order-problem {
  margin-bottom: 8px;
}

.problem-label {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}

.problem-desc {
  font-size: 14px;
  color: #1F2937;
  line-height: 1.5;
}

.order-actions {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.arrow-icon {
  font-size: 20px;
  color: #9CA3AF;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(4px);
  box-sizing: border-box;
}

.modal-content {
  background: #FFFFFF;
  border: 1px solid rgba(30, 58, 95, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 343px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #E5E7EB;
  background: #F8F9FA;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #6B7280;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #F3F4F6;
}

.modal-body {
  padding: 20px;
}

/* Form styles */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 16px;
  background: #FFFFFF;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.submit-btn {
  width: 100%;
  background: #2563EB;
  border: none;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 12px 24px;
  height: 48px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.submit-btn:hover:not(:disabled) {
  background: #1D4ED8;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

/* Order detail styles */
.order-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  border-bottom: 1px solid #E5E7EB;
  padding-bottom: 16px;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 12px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 13px;
  color: #6B7280;
}

.detail-value {
  font-size: 14px;
  color: #1F2937;
  font-weight: 500;
}

.detail-value.status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.detail-value.status.pending {
  background: #FEF3C7;
  color: #92400E;
}

.detail-value.status.processing {
  background: #DBEAFE;
  color: #1E40AF;
}

.detail-value.status.completed {
  background: #D1FAE5;
  color: #065F46;
}

.detail-value.express {
  color: #2563EB;
}

.problem-box,
.result-box {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #1F2937;
  line-height: 1.5;
}
</style>
