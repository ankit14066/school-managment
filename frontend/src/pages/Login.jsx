import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/login-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        {/* Logo + School Name */}
        <div className="flex flex-col items-center pb-5 mb-5 border-b border-gray-200">
          <img
            src="/logo-1.png"
            alt="School Logo"
            className="h-20 w-auto object-contain mb-2"
          />
          <p className="text-base font-semibold text-gray-700 text-center leading-tight">
            Quit Green Valley
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-wide leading-tight">
            Convent School
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="admin@gmail.com"
              required
            />
          </div>

          <div>
            <label className="label">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Spinner size="sm" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;