import{Navigate,Route,Routes}from'react-router-dom';
import{useAuth}from'./auth';import ProtectedRoute from'./components/ProtectedRoute';
import Landing from'./pages/public/Landing';import Login from'./pages/public/Login';import Register from'./pages/public/Register';
import Dashboard from'./pages/admin/Dashboard';import Appointments from'./pages/admin/Appointments';import Services from'./pages/admin/Services';import Barbers from'./pages/admin/Barbers';import Hours from'./pages/admin/Hours';import Clients from'./pages/admin/Clients';import Notifications from'./pages/admin/Notifications';import Reports from'./pages/admin/Reports';import Settings from'./pages/admin/Settings';
import Booking from'./pages/client/Booking';import MyAppointments from'./pages/client/MyAppointments';import ClientNotifications from'./pages/client/ClientNotifications';
import Profile from'./pages/Profile';import BarberSchedule from'./pages/barber/BarberSchedule';
function homeFor(user){if(!user)return '/';if(user.role==='administrador')return '/admin';if(user.role==='barbeiro')return '/barbeiro/agenda';return '/cliente/agendar';}
function Entry(){const{user}=useAuth();return <Navigate to={homeFor(user)} replace/>}
const guard=(roles,el)=><ProtectedRoute roles={roles}>{el}</ProtectedRoute>;
export default function App(){return <Routes>
  <Route path="/" element={<Landing/>}/><Route path="/login" element={<Login/>}/><Route path="/cadastro" element={<Register/>}/><Route path="/entrar" element={<Entry/>}/>
  <Route path="/admin" element={guard(['administrador'],<Dashboard/>)}/><Route path="/admin/agendamentos" element={guard(['administrador'],<Appointments/>)}/><Route path="/admin/servicos" element={guard(['administrador'],<Services/>)}/><Route path="/admin/barbeiros" element={guard(['administrador'],<Barbers/>)}/><Route path="/admin/horarios" element={guard(['administrador'],<Hours/>)}/><Route path="/admin/clientes" element={guard(['administrador'],<Clients/>)}/><Route path="/admin/notificacoes" element={guard(['administrador'],<Notifications/>)}/><Route path="/admin/relatorios" element={guard(['administrador'],<Reports/>)}/><Route path="/admin/configuracoes" element={guard(['administrador'],<Settings/>)}/>
  <Route path="/cliente/agendar" element={guard(['cliente'],<Booking/>)}/><Route path="/cliente/agendamentos" element={guard(['cliente'],<MyAppointments/>)}/><Route path="/cliente/notificacoes" element={guard(['cliente'],<ClientNotifications/>)}/>
  <Route path="/barbeiro/agenda" element={guard(['barbeiro'],<BarberSchedule/>)}/>
  <Route path="/perfil" element={guard(['administrador','cliente','barbeiro'],<Profile/>)}/>
  <Route path="*" element={<Navigate to="/" replace/>}/>
</Routes>}
