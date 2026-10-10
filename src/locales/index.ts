import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import zhTW from './zh-TW'
import en from './en'
import * as released from './released'
import ru from './released-languages/ru'
import fr from './released-languages/fr'
import th from './released-languages/th'
import pt from './released-languages/pt'
import es from './released-languages/es'
import pl from './released-languages/pl'
import ko from './released-languages/ko'

const supplement = <T extends { login: object; settings: object }, E extends { login: object; settings: object; register: object }>(base: T, extra: E) => ({ ...base, login: { ...extra.login, ...base.login }, settings: { ...extra.settings, ...base.settings }, register: extra.register })

// 获取浏览器语言或默认使用简体中文
const defaultLocale = localStorage.getItem('language') || 'zh-CN'

const i18n = createI18n({
  legacy: false, // 使用 Composition API
  locale: defaultLocale,
  fallbackLocale: 'zh-CN',
  messages: {
    ru, fr, th, pt, es, pl, ko,
    'zh-CN': supplement(zhCN, released.zhCN),
    'zh-TW': supplement(zhTW, released.zhTW),
    'en': supplement(en, released.en)
  }
})

export default i18n
