export default function Feedback({message,type='success'}){return message?<div className={`feedback ${type}`}>{message}</div>:null}
