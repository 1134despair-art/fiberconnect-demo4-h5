import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import zhTW from './zh-TW'
import en from './en'

// 获取浏览器语言或默认使用简体中文
const defaultLocale = localStorage.getItem('language') || 'zh-CN'

const i18n = createI18n({
  legacy: false, // 使用 Composition API
  locale: defaultLocale,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'en': en
  }
})

export default i18n
