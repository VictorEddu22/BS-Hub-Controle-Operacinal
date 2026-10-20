import {createContext,useContext,useMemo,useState} from 'react';
const Ctx=createContext(null);
function initial(){try{return JSON.parse(localStorage.getItem('bshub_user'))||null}catch{return null}}
export function AuthProvider({children}){
  const[user,setUser]=useState(initial);
  const login=(data)=>{const{token,...safe}=data;localStorage.setItem('bshub_token',token);localStorage.setItem('bshub_user',JSON.stringify(safe));setUser(safe)};
  const updateUser=(data)=>{const next={...user,...data};localStorage.setItem('bshub_user',JSON.stringify(next));setUser(next)};
  const logout=()=>{localStorage.removeItem('bshub_token');localStorage.removeItem('bshub_user');setUser(null)};
  return <Ctx.Provider value={useMemo(()=>({user,login,updateUser,logout}),[user])}>{children}</Ctx.Provider>;
}
export const useAuth=()=>useContext(Ctx);
