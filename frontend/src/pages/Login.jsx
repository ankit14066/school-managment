import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import { Mail, Lock, Shield } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login credentials incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 select-none">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl p-8 lg:p-10">
        <div className="flex flex-col items-center pb-6 mb-6 border-b border-slate-100">
          <div className="mb-3 bg-white rounded-full p-2.5 shadow-sm border border-slate-100">
            <img
              src="/logo-1.png"
              alt="School Logo"
              className="h-20 w-20 object-contain"
              onError={(e) => {
                e.target.src = "https://cdn-icons-png.flaticon.com/512/167/167707.png";
              }}
            />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight text-center leading-none">
            Quit Green Valley
          </h2>
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest leading-none mt-2">
            Convent School
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field pl-11"
                placeholder="name@school.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Secure Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field pl-11"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" /> : (
              <>
                <Shield className="w-5 h-5" />
                <span>Sign In Securely</span>
              </>
            )}
          </button>

          {/* <div className="text-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFormData({ email: 'developer@school.com', password: 'developer123' })}
              className="text-xs font-bold text-slate-400 hover:text-emerald-600 tracking-wider uppercase"
            >
              Quick Developer Bypass
            </button>
          </div> */}
        </form>
      </div>
    </div>
  );
};

export default Login;
