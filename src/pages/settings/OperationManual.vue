<template>
  <div class="app-container legacy-app-page workspace-page workspace-secondary manual-page">
    <WorkspaceHeader title="操作手册" @back="router.push('/settings')" />

    <div class="manual-toolbar">
      <div class="manual-search">
        <SettingsGlyph name="search" />
        <input v-model="query" type="search" aria-label="搜索产品名称或型号" placeholder="搜索产品名称或型号" />
        <button v-if="query" type="button" aria-label="清除搜索" @click="query = ''"><SettingsGlyph name="close" /></button>
      </div>
      <nav class="manual-categories" aria-label="手册设备分类">
        <button type="button" :class="{ active: selectedCategory === 0 }" :aria-pressed="selectedCategory === 0" @click="selectCategory(0)">全部</button>
        <button v-for="group in groups" :key="group.id" type="button" :class="{ active: selectedCategory === group.id }" :aria-pressed="selectedCategory === group.id" @click="selectCategory(group.id)">{{ group.name }}</button>
      </nav>
    </div>

    <main ref="listElement" class="manual-content">
      <div class="manual-summary" aria-live="polite">
        <span>{{ query.trim() ? '搜索结果' : selectedCategory ? selectedCategoryName : '全部手册' }}</span>
        <span>{{ visibleCount }} 份</span>
      </div>
      <section v-for="group in visibleGroups" :key="group.id" class="manual-section" :aria-labelledby="`manual-group-${group.id}`">
        <div class="manual-section-heading">
          <h2 :id="`manual-group-${group.id}`">{{ group.name }}</h2>
          <span>{{ group.items.length }}</span>
        </div>
        <div class="manual-list">
          <a v-for="item in group.items" :key="item.categoryId" class="manual-row" :href="assetUrl(item.operationManual || '')" target="_blank" rel="noopener noreferrer" :aria-label="`打开${item.name}操作手册 PDF`">
            <span class="manual-file-icon"><SettingsGlyph name="pdf" /></span>
            <strong>{{ item.name }}</strong>
            <span class="manual-format">PDF</span>
            <SettingsGlyph class="manual-arrow" name="chevron" />
          </a>
        </div>
      </section>
      <div v-if="!visibleCount" class="manual-empty">
        <span class="manual-empty-icon"><SettingsGlyph name="search" /></span>
        <h2>没有找到相关手册</h2>
        <p>试试其他型号或设备分类</p>
        <button type="button" @click="resetFilters">查看全部手册</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import WorkspaceHeader from '@/components/WorkspaceHeader.vue'
import SettingsGlyph from '@/components/SettingsGlyph.vue'
import manualRows from '@/data/released/manuals.json'
import categoryRows from '@/data/released/categories.json'
import { assetUrl } from '@/data/releasedContent'
import '@/styles/subpages.css'

const router = useRouter()
const query = ref('')
const selectedCategory = ref(0)
const listElement = ref<HTMLElement | null>(null)
type Manual = typeof manualRows[number]
interface ManualGroup { id: number; name: string; items: Manual[] }
const categories = new Map([...categoryRows, ...manualRows].map(row => [row.categoryId, row]))
const groups: ManualGroup[] = []
for (const manual of manualRows.filter(row => row.operationManual)) {
  let category = categories.get(manual.categoryId)!
  const visited = new Set<number>([category.categoryId])
  while (category.parentId && categories.has(category.parentId) && !visited.has(category.parentId)) {
    category = categories.get(category.parentId)!
    visited.add(category.categoryId)
  }
  let group = groups.find(item => item.id === category.categoryId)
  if (!group) {
    group = { id: category.categoryId, name: category.name, items: [] }
    groups.push(group)
  }
  group.items.push(manual)
}
// Keep the original three device-guide entry points prominent, now opening actual PDFs.
const featuredCategories = [46, 101, 75]
const rank = (id: number) => featuredCategories.includes(id) ? featuredCategories.indexOf(id) : featuredCategories.length
groups.sort((a, b) => rank(a.id) - rank(b.id))
const normalize = (value: string) => value.toLocaleLowerCase().replace(/\s+/g, '')
const visibleGroups = computed(() => groups
  .filter(group => !selectedCategory.value || group.id === selectedCategory.value)
  .map(group => ({ ...group, items: group.items.filter(item => normalize(`${group.name} ${item.name}`).includes(normalize(query.value))) }))
  .filter(group => group.items.length))
const visibleCount = computed(() => visibleGroups.value.reduce((count, group) => count + group.items.length, 0))
const selectedCategoryName = computed(() => groups.find(group => group.id === selectedCategory.value)?.name || '')
const selectCategory = (id: number) => { selectedCategory.value = id }
const resetFilters = () => { query.value = ''; selectedCategory.value = 0 }
watch([query, selectedCategory], () => { listElement.value?.scrollTo({ top: 0 }) })
</script>

<style scoped>
.manual-page { background: #f6f8fc; overflow: hidden; }
.manual-toolbar { flex: 0 0 auto; min-width: 0; padding: 12px 16px 0; background: #fff; border-bottom: 1px solid #e8edf4; }
.manual-search { display: flex; align-items: center; gap: 9px; min-height: 44px; padding: 0 12px; border: 1px solid #e8edf4; border-radius: 10px; background: #f5f7fa; }
.manual-search > .settings-glyph { width: 20px; height: 20px; }
.manual-search:focus-within { border-color: #93b4ed; box-shadow: 0 0 0 2px #2563eb10; }
.manual-search input { flex: 1; min-width: 0; width: 100%; height: 44px; padding: 0; border: 0; outline: 0; background: transparent; color: #17263c; font: inherit; font-size: 14px; }
.manual-search input::placeholder { color: #8793a5; }
.manual-search input::-webkit-search-cancel-button { display: none; }
.manual-search button { flex: 0 0 44px; display: grid; place-items: center; align-self: stretch; margin-right: -12px; padding: 0; border: 0; background: transparent; cursor: pointer; }
.manual-search button .settings-glyph { width: 18px; height: 18px; }
.manual-categories { display: flex; align-items: center; gap: 8px; max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; padding: 10px 0; scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
.manual-categories button { flex: 0 0 auto; min-height: 44px; padding: 0 14px; border: 1px solid transparent; border-radius: 9px; background: transparent; color: #64748b; font: inherit; font-size: 13px; cursor: pointer; white-space: nowrap; }
.manual-categories button.active { border-color: #dbe7ff; background: #edf4ff; color: #2563eb; font-weight: 650; }
.manual-content { flex: 1; min-height: 0; min-width: 0; overflow-y: auto; padding: 18px 16px max(28px, env(safe-area-inset-bottom)); }
.manual-summary { display: flex; align-items: center; justify-content: space-between; margin: 0 2px 21px; color: #64748b; font-size: 12px; }
.manual-summary > span:first-child { color: #334155; font-size: 15px; font-weight: 650; }
.manual-section { margin-bottom: 22px; }
.manual-section-heading { display: flex; align-items: center; gap: 8px; margin: 0 3px 9px; }
.manual-section-heading h2 { margin: 0; color: #536278; font-size: 12px; font-weight: 600; line-height: 1.6; }
.manual-section-heading > span { color: #8793a5; font-size: 11px; font-variant-numeric: tabular-nums; }
.manual-list { overflow: hidden; border: 1px solid #e7ecf3; border-radius: 12px; background: #fff; }
.manual-row { display: flex; align-items: center; gap: 12px; min-height: 68px; padding: 10px 14px; color: #17263c; text-decoration: none; border-bottom: 1px solid #edf0f5; box-sizing: border-box; }
.manual-row:last-child { border-bottom: 0; }
.manual-row:active { background: #f1f6ff; }
.manual-file-icon { display: grid; place-items: center; flex: 0 0 38px; width: 38px; height: 42px; border-radius: 9px; background: #fff3f2; }
.manual-row strong { flex: 1; min-width: 0; font-size: 14px; font-weight: 550; line-height: 1.5; overflow-wrap: anywhere; }
.manual-format { flex: 0 0 auto; color: #8a95a5; font-size: 10px; letter-spacing: .4px; }
.manual-arrow { width: 16px; height: 16px; margin-left: -6px; }
.manual-empty { display: flex; align-items: center; flex-direction: column; padding: 52px 8px; text-align: center; }
.manual-empty-icon { display: grid; place-items: center; width: 64px; height: 64px; border: 1px solid #e3eaf4; border-radius: 20px; background: #fff; }
.manual-empty-icon .settings-glyph { width: 28px; height: 28px; }
.manual-empty h2 { margin: 18px 0 8px; color: #334155; font-size: 16px; }
.manual-empty p { margin: 0 0 20px; color: #64748b; font-size: 13px; }
.manual-empty button { min-height: 44px; padding: 0 20px; border: 1px solid #dbe7ff; border-radius: 9px; background: #edf4ff; color: #2563eb; font: inherit; font-size: 14px; cursor: pointer; }
button:focus-visible, a:focus-visible { outline: 2px solid #2563eb; outline-offset: -2px; }
@media (hover: hover) { .manual-row:hover { background: #f8faff; } }
@media (max-width: 350px) { .manual-toolbar { padding-inline: 12px; } .manual-content { padding-inline: 12px; } .manual-row { padding-inline: 11px; gap: 9px; } }
</style>
