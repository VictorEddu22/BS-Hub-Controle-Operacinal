export default function Avatar({src,name='',size='normal',className=''}){
  const initial=(name||'?').trim().charAt(0).toUpperCase();
  return src
    ? <img className={`avatar-image ${size} ${className}`} src={src} alt={name?`Foto de ${name}`:'Foto de perfil'}/>
    : <span className={`portrait-letter ${size==='small'?'small':''} ${className}`}>{initial}</span>;
}
