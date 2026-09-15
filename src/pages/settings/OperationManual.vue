<template>
  <div class="app-container legacy-app-page workspace-page workspace-secondary workspace-dialogs manual-page">
    <WorkspaceHeader title="操作手册" @back="router.push('/settings')" />

    <main class="manual-content">
      <section class="manual-intro">
        <strong>产品操作手册</strong>
      </section>
      <div class="manual-list">
        <button v-for="item in manuals" :key="item.name" type="button" @click="openManual(item)">
          <img class="manual-product-image" :src="item.image" alt="" />
          <span class="manual-copy"><strong>{{ item.name }}</strong><small>{{ item.description }}</small></span>
          <span class="manual-arrow">›</span>
        </button>
      </div>
    </main>

    <div v-if="selectedManual" class="manual-layer" @click.self="selectedManual = null">
      <section role="dialog" aria-modal="true" aria-label="操作手册预览">
        <header><strong>{{ selectedManual.name }}</strong><button type="button" aria-label="关闭" @click="selectedManual = null">×</button></header>
        <div class="manual-preview">
          <span class="pdf-icon large">PDF</span>
          <strong>{{ selectedManual.name }}操作手册</strong>
          <p>暂无可预览的 PDF 文件</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import WorkspaceHeader from '@/components/WorkspaceHeader.vue'
import '@/styles/subpages.css'
import fusionImage from '@/assets/app/products/fusion-splicer.png'
import portableImage from '@/assets/app/products/portable-otdr.png'
import opmImage from '@/assets/app/products/multi-opm.png'

interface ManualItem {
  name: string
  description: string
  image: string
}

const router = useRouter()
const selectedManual = ref<ManualItem | null>(null)
const manuals: ManualItem[] = [
  { name: '光纤熔接机', description: '熔接、加热、维护和记录', image: fusionImage },
  { name: '便携式OTDR', description: '测试参数、曲线与文件操作', image: portableImage },
  { name: '多功能光功率计', description: '光功率、光源与网线工具', image: opmImage }
]

const openManual = (item: ManualItem) => {
  selectedManual.value = item
}
</script>

<style scoped>
.workspace-secondary.manual-page .manual-content { padding: 22px 20px; min-height: 0; }
.workspace-secondary.manual-page .manual-intro { margin-bottom: 18px; }
.workspace-secondary.manual-page .manual-intro strong { font-size: 13px; font-weight: 500; color: #7a8492; }
.workspace-secondary.manual-page .manual-list { gap: 0; }
.workspace-secondary.manual-page .manual-list > button { padding: 18px 0; min-height: 98px; border-bottom: 1px solid #e2e7ed; border-radius: 0; box-shadow: none; background: transparent; gap: 14px; }
.manual-product-image { width: 52px; height: 60px; object-fit: contain; flex-shrink: 0; }
.workspace-secondary.manual-page .manual-copy { min-width: 0; }
.workspace-secondary.manual-page .manual-copy strong { font-size: 14px; line-height: 1.5; overflow-wrap: anywhere; }
.workspace-secondary.manual-page .manual-copy small { font-size: 11px; line-height: 1.7; color: #7d8794; }
.workspace-secondary.manual-page .manual-preview { min-height: 250px; gap: 20px; }
.workspace-secondary.manual-page .manual-preview strong { font-size: 15px; }
.workspace-secondary.manual-page .manual-preview p { font-size: 13px; }
.manual-page { background: linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%); }
.manual-header { height: 56px; display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; border-bottom: 1px solid #E5E7EB; background: #FFFFFF; padding: 0 12px; }
.manual-header button { width: 44px; height: 44px; border: 0; background: transparent; color: #2563EB; font-size: 30px; }
.manual-header h1 { margin: 0; text-align: center; font-size: 18px; }
.manual-content { flex: 1; overflow-y: auto; padding: 16px; }
.manual-intro { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.manual-intro strong { font-size: 18px; color: #1F2937; }
.manual-intro span { font-size: 13px; color: #6B7280; }
.manual-list { display: flex; flex-direction: column; gap: 12px; }
.manual-list > button { min-height: 72px; display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 0; border-radius: 12px; background: #FFFFFF; box-shadow: 0 2px 8px rgba(15,23,42,.06); text-align: left; }
.pdf-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 8px; background: #FEF2F2; color: #DC2626; font-size: 11px; font-weight: 800; flex: 0 0 auto; }
.pdf-icon.large { width: 64px; height: 64px; font-size: 15px; }
.manual-copy { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.manual-copy strong { font-size: 16px; color: #1F2937; }
.manual-copy small { color: #6B7280; font-size: 13px; }
.manual-arrow { color: #9CA3AF; font-size: 24px; }
.manual-layer { position: fixed; inset: 0; display: grid; place-items: center; padding: 20px; background: rgba(15,23,42,.48); z-index: 100; }
.manual-layer section { width: min(420px, 100%); border-radius: 14px; background: #FFFFFF; overflow: hidden; }
.manual-layer header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #E5E7EB; }
.manual-layer header button { border: 0; background: transparent; color: #2563EB; }
.manual-preview { min-height: 240px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 24px; text-align: center; }
.manual-preview p { margin: 0; color: #6B7280; line-height: 1.6; }
</style>
