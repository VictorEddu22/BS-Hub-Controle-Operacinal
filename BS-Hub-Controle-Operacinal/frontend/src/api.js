export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export async function api(path, options={}){
  const token=localStorage.getItem('bshub_token');
  const res=await fetch(`${API_URL}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} : {}),...(options.headers||{})}});
  const data=await res.json().catch(()=>({}));
  if(res.status===401){localStorage.removeItem('bshub_token');localStorage.removeItem('bshub_user');}
  if(!res.ok) throw new Error(data.mensagem||data.erro||'Não foi possível concluir a solicitação.');
  return data;
}
