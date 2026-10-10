<template>
 <div class="product-gallery">
  <div class="gallery-track" @scroll="onScroll" ref="track">
   <button v-for="(src,index) in images" :key="src" type="button" :aria-label="`${name} ${index+1}`" @click="preview=index">
    <img :src="src" :alt="name" @error="imageError" />
   </button>
  </div>
  <div v-if="images.length>1" class="gallery-pagination"><button v-for="(_,index) in images" :key="index" type="button" :class="{active:active===index}" :aria-label="`${index+1} / ${images.length}`" @click="track?.scrollTo({left:index*track.clientWidth,behavior:'smooth'})"></button><span>{{active+1}} / {{images.length}}</span></div>
  <div v-if="preview!==null" v-smart-otdr-overlay class="gallery-overlay" role="dialog" aria-modal="true" :aria-label="name" @keydown.esc="preview=null" @click.self="preview=null">
   <section class="gallery-preview"><header><span>{{preview+1}} / {{images.length}}</span><button ref="close" type="button" @click="preview=null" :aria-label="t('common.close')">×</button></header>
    <div class="preview-scroll"><img :src="images[preview]" :alt="name" @error="imageError" /></div>
    <footer v-if="images.length>1"><button :disabled="preview===0" @click="preview--" :aria-label="locale==='en'?'Previous image':'上一张'">‹</button><button :disabled="preview===images.length-1" @click="preview++" :aria-label="locale==='en'?'Next image':'下一张'">›</button></footer>
   </section>
  </div>
 </div>
</template>
<script setup lang="ts">
import {ref,watch,nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {vSmartOtdrOverlay} from '@/directives/smartOtdrOverlay'
import placeholder from '@/assets/icons/iconfont/product.svg'
const {t,locale}=useI18n()
defineProps<{images:string[];name:string}>()
const active=ref(0),preview=ref<number|null>(null),track=ref<HTMLElement|null>(null),close=ref<HTMLButtonElement|null>(null)
let trigger:HTMLElement|null=null
watch(preview,async (value,old)=>{if(value!==null&&old===null){trigger=document.activeElement as HTMLElement;await nextTick();close.value?.focus()}else if(value===null)trigger?.focus()})
const onScroll=()=>{if(track.value)active.value=Math.round(track.value.scrollLeft/track.value.clientWidth)}
const imageError=(event:Event)=>{const img=event.target as HTMLImageElement;if(img.src!==placeholder)img.src=placeholder}
</script>
<style scoped>
.product-gallery{background:white;min-width:0}.gallery-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}.gallery-track>button{flex:0 0 100%;min-width:0;height:260px;scroll-snap-align:center;border:0;background:white;padding:12px}.gallery-track img{width:100%;height:100%;object-fit:contain}.gallery-pagination{display:flex;align-items:center;justify-content:center;gap:8px;padding:4px 12px 12px}.gallery-pagination button{width:24px;height:24px;border:0;border-radius:50%;background:radial-gradient(circle,#cbd5e1 3px,transparent 4px)}.gallery-pagination button.active{background:radial-gradient(circle,#2563eb 4px,transparent 5px)}.gallery-pagination span{font-size:11px;color:#64748b}.gallery-overlay{z-index:210;display:flex;background:#0f172ae6}.gallery-preview{width:100%;height:100%;display:flex;flex-direction:column;background:white;border-radius:12px;overflow:hidden!important}.gallery-preview header,.gallery-preview footer{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;flex-shrink:0}.gallery-preview button{width:44px;min-height:44px;border:0;border-radius:8px;background:#eff6ff;color:#2563eb;font-size:25px}.gallery-preview button:disabled{opacity:.35}.preview-scroll{overflow:auto;flex:1;min-height:0}.preview-scroll img{display:block;width:100%;height:auto}.gallery-preview header span{font-size:13px;color:#64748b}
</style>
