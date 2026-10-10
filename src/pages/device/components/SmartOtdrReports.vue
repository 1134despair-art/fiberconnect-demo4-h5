<template>
  <section class="reports-card" aria-label="PDF检测报告">
    <header><div><h2><img class="report-pdf-icon" :src="smartOtdrIcons.pdf" alt="" />PDF 检测报告</h2><p>查看、下载及分享设备报告</p></div><button type="button" :disabled="loading" @click="reload">{{ loading ? '读取中…' : '刷新' }}</button></header>
    <p v-if="error" class="report-error" role="alert">{{ error }}</p>
    <p v-else-if="loading" role="status">正在读取报告列表…</p>
    <p v-else-if="!reports.length">设备暂无 PDF 报告</p>
    <template v-else>
      <label class="report-select">选择报告<select :value="selectedId" @change="selectReport(($event.target as HTMLSelectElement).value)"><option v-for="report in reports" :key="report.id" :value="report.id">{{ report.name }}</option></select></label>
      <p class="report-meta">{{ selected?.createdAt }} <span v-if="prototypeMode">· 示例文件</span></p>
      <div class="report-actions"><button :disabled="!file" @click="showPreview = true">查看报告</button><button :disabled="!file" @click="download">下载 PDF</button><button :disabled="!file || sharing" @click="share">{{ sharing ? '分享中…' : '分享' }}</button></div>
      <p v-if="message" role="status">{{ message }}</p>
    </template>
    <div v-if="showPreview && previewUrl" v-smart-otdr-overlay class="pdf-overlay" @click.self="showPreview = false">
      <section role="dialog" aria-modal="true" aria-label="PDF报告预览"><header><strong>{{ selected?.name }}</strong><button @click="showPreview = false">关闭</button></header><iframe :src="previewUrl" title="PDF检测报告"></iframe><p>若浏览器无法预览，可下载后查看。</p><button @click="download">下载 PDF</button></section>
    </div>
  </section>
</template>
<script setup lang="ts">
import { smartOtdrIcons } from '@/assets/icons/iconfont/smart-otdr'
import { vSmartOtdrOverlay } from '@/directives/smartOtdrOverlay'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { getSmartOtdrAdapter, type DeviceReport } from '@/services/smartOtdr'
const route = useRoute(); const { user } = useAuth()
const device = computed(() => user.value?.devices.find(item => item.id === route.params.id))
const prototypeMode = getSmartOtdrAdapter().mode === 'prototype'
const reports = ref<DeviceReport[]>([]); const selectedId = ref(''); const loading = ref(false); const sharing = ref(false)
const error = ref(''); const message = ref(''); const file = ref<File | null>(null); const previewUrl = ref(''); const showPreview = ref(false)
const selected = computed(() => reports.value.find(item => item.id === selectedId.value))
let request = 0
let listRequest = 0
function release() { if (previewUrl.value) URL.revokeObjectURL(previewUrl.value); previewUrl.value = ''; file.value = null; showPreview.value = false }
async function selectReport(id: string) {
  const d = device.value; const token = ++request; release(); selectedId.value = id; error.value = ''; message.value = ''
  if (!d) return
  try {
    const blob = await getSmartOtdrAdapter().readReport(d, id)
    if (await blob.slice(0, 5).text() !== '%PDF-') throw new Error('设备返回的文件不是有效 PDF')
    if (token !== request) return
    file.value = new File([blob], selected.value?.name || 'OTDR报告.pdf', { type: 'application/pdf' })
    previewUrl.value = URL.createObjectURL(file.value)
  } catch (reason) { if (token === request) error.value = reason instanceof Error ? reason.message : '报告读取失败' }
}
async function reload() {
  const d = device.value; const token = ++listRequest; ++request; release(); reports.value = []; error.value = ''; message.value = ''
  if (!d) return
  loading.value = true
  try {
    const list = await getSmartOtdrAdapter().listReports(d)
    if (token !== listRequest || device.value?.id !== d.id) return
    reports.value = list
    if (list.length) await selectReport(list[0].id)
  } catch (reason) { if (token === listRequest) error.value = reason instanceof Error ? reason.message : '报告列表读取失败' }
  finally { if (token === listRequest) loading.value = false }
}
function download() {
  if (!file.value) return
  const url = URL.createObjectURL(file.value); const anchor = document.createElement('a')
  anchor.href = url; anchor.download = file.value.name; document.body.appendChild(anchor); anchor.click(); anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30000); message.value = '已发起 PDF 下载'
}
async function share() {
  if (!file.value) return
  const data = { files: [file.value], title: 'OTDR 检测报告' }
  if (!navigator.share || !navigator.canShare?.(data)) { download(); message.value = '当前浏览器不支持文件分享，已下载，可在手机文件管理中分享。'; return }
  sharing.value = true
  try { await navigator.share(data); message.value = '报告已分享' }
  catch (reason) { if (!(reason instanceof Error && reason.name === 'AbortError')) error.value = '分享未完成，可下载后分享。' }
  finally { sharing.value = false }
}
watch(() => device.value?.id, () => void reload(), { immediate: true })
onUnmounted(() => { ++request; ++listRequest; release() })
</script>
<style scoped>
.reports-card { margin-bottom:14px; padding:16px; border:1px solid #dce5f0; border-radius:12px; background:#fff; }
header { display:flex; align-items:center; justify-content:space-between; gap:12px; } h2 { margin:0; font-size:15px; color:#172c48; } p { margin:6px 0 12px; color:#64748b; font-size:12px; line-height:1.6; }
button { min-height:40px; padding:6px 12px; border:1px solid #cbd8ec; border-radius:7px; background:#f2f6ff; color:#174ea6; cursor:pointer; } button:disabled { opacity:.5; cursor:wait; }
.report-select { display:grid; gap:8px; font-size:12px; }.report-select select { width:100%; min-width:0; height:44px; padding:0 8px; border:1px solid #cbd5e1; border-radius:7px; background:#fff; }
.report-actions { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }.report-actions button { padding-inline:3px; }
.report-error { color:#b42318; }.pdf-overlay { position:fixed; inset:0; z-index:120; display:grid; place-items:center; padding:12px; background:#0f172a99; }.pdf-overlay section { width:min(900px,100%); max-height:95dvh; padding:12px; box-sizing:border-box; background:#fff; border-radius:12px; }.pdf-overlay header strong { overflow-wrap:anywhere; }.pdf-overlay iframe { display:block; width:100%; height:65dvh; margin-top:12px; border:0; }

.pdf-overlay section { display:flex;flex-direction:column;width:100%;height:100%;min-height:0; }.pdf-overlay iframe { flex:1;min-height:160px;height:auto; }.pdf-overlay header { flex-shrink:0;min-width:0; }.pdf-overlay header strong { min-width:0;font-size:13px; }.pdf-overlay header button { flex-shrink:0;min-height:44px; }

.reports-card h2 { display:flex;align-items:center;gap:7px; }.report-pdf-icon { width:22px;height:22px;object-fit:contain; }
</style>
