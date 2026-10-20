import {Navigate} from 'react-router-dom';import{useAuth}from'../auth';
function home(role){return role==='administrador'?'/admin':role==='barbeiro'?'/barbeiro/agenda':'/cliente/agendar'}
export default function ProtectedRoute({roles,children}){const{user}=useAuth();if(!user)return <Navigate to="/login" replace/>;if(roles&&!roles.includes(user.role))return <Navigate to={home(user.role)} replace/>;return children}
