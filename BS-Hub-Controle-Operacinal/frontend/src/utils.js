export const money=(v)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
export const dateBr=(v)=>v?new Date(String(v).includes('T')?v:`${v}T12:00:00`).toLocaleDateString('pt-BR'):'—';
export const dateTimeBr=(v)=>v?new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'—';
export const today=()=>{const d=new Date();const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};
