import type {User} from '@/composables/useAuth'
// Local prototype adapter. Production endpoints and payloads are documented in CONTENT-SUPPLEMENT.md.
const key='prototype_accounts:v1'
interface Entry { user:User; salt:string; hash:string }
const load=():Record<string,Entry>=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
const normalize=(account:string)=>account.trim().toLowerCase()
const digest=async(password:string,salt:string)=>{
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits'])
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},material,256)
 return [...new Uint8Array(bits)].map(v=>v.toString(16).padStart(2,'0')).join('')
}
export const registeredUser=(account:string)=>load()[normalize(account)]?.user
export const verifyRegisteredPassword=async(account:string,password:string)=>{const entry=load()[normalize(account)];return !entry||entry.hash===await digest(password,entry.salt)}
export const saveRegisteredUser=(user:User)=>{
 const entries=load();let changed=false
 for(const entry of Object.values(entries))if(entry.user.id===user.id){const {password,...profile}=user;entry.user=profile;changed=true}
 if(changed)localStorage.setItem(key,JSON.stringify(entries))
}
export const createRegisteredUser=async(mode:'phone'|'email',account:string,password:string)=>{
 const normalized=normalize(account),entries=load()
 if(entries[normalized])throw new Error('register.accountExists')
 const user:User={id:'registered_'+crypto.randomUUID(),phone:mode==='phone'?normalized:'',email:mode==='email'?normalized:undefined,name:mode==='phone'?'用户'+normalized.slice(-4):normalized.split('@')[0],role:'user',devices:[],createdAt:new Date().toISOString()}
 const salt=crypto.randomUUID(),hash=await digest(password,salt)
 if(load()[normalized])throw new Error('register.accountExists')
 localStorage.setItem(key,JSON.stringify({...load(),[normalized]:{user,salt,hash}}))
 return user
}
export const removeRegisteredUser=(user:User)=>{const entries=load();for(const [account,entry] of Object.entries(entries))if(entry.user.id===user.id)delete entries[account];localStorage.setItem(key,JSON.stringify(entries))}

export const replaceRegisteredPassword = async (account: string, password: string, fallback: User) => {
 const normalized = normalize(account), entries = load()
 const source = entries[normalized]?.user || fallback
 const { password: oldPassword, ...user } = source
 const salt = crypto.randomUUID(), hash = await digest(password, salt)
 const updated = load()
 for (const entry of Object.values(updated)) if (entry.user.id === user.id) { entry.salt = salt; entry.hash = hash }
 updated[normalized] = { user, salt, hash }
 localStorage.setItem(key, JSON.stringify(updated))
 return user
}
