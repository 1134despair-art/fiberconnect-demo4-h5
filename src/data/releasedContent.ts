import rows from './released/products.json'
import categories from './released/categories.json'
export { default as releasedAppInfo } from './released/about.json'
export const assetUrl = (source: string) => {
 const src = source.trim()
 if (/^https?:\/\//i.test(src)) return src
 if (!src.startsWith('/')) return ''
 return 'https://sklsaixian.com/prod-api/' + src.replace(/^\/(?:api|dev-api|prod-api)\//, '/').replace(/^\/+/, '')
}
export const releasedCategories = categories.filter(c => !c.parentId).map(c => ({ id: 10000 + c.categoryId, name: c.name }))
const rootCategory = (id: number): number => {
 const seen = new Set<number>()
 let current = categories.find(c => c.categoryId === id)
 while (current?.parentId && !seen.has(current.categoryId)) {
  seen.add(current.categoryId)
  current = categories.find(c => c.categoryId === current!.parentId)
 }
 return 10000 + (current?.categoryId || id)
}
export const releasedProducts = rows.filter(p => p.status === '0').map(p => {
 const images = String(p.image || '').split(',').map(assetUrl).filter(Boolean).slice(0, 5)
 return { id: 'released-' + p.productId, categoryId: rootCategory(p.categoryId), name: p.name, model: p.model || '', description: p.description || '', image: images[0] || '', images, details: p.details || '' }
})

// Public rich text is content, never executable markup. Keep only presentation tags.
export const safeProductDetails = (html: string) => {
 const doc = new DOMParser().parseFromString(html, 'text/html')
 const allowed = new Set(['P','BR','IMG','STRONG','B','EM','I','UL','OL','LI','H2','H3','H4','TABLE','TBODY','THEAD','TR','TD','TH','DIV','SPAN'])
 doc.querySelectorAll('script,style,iframe,object,embed,svg,math,form,input,button,link,meta').forEach(el => el.remove())
 for (const el of [...doc.body.querySelectorAll('*')]) {
  if (!allowed.has(el.tagName)) { el.replaceWith(...el.childNodes); continue }
  const src = el.getAttribute('src'), alt = el.getAttribute('alt')
  for (const attr of [...el.attributes]) el.removeAttribute(attr.name)
  if (el.tagName === 'IMG') {
   const url = assetUrl(src || '')
   if (!url) { el.remove(); continue }
   el.setAttribute('src', url); el.setAttribute('alt', alt || '产品详情'); el.setAttribute('loading','lazy')
  }
 }
 return doc.body.innerHTML
}
