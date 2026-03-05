import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Check, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Suivi des paiements en temps réel',
    'Génération automatique des reçus',
    'Tableau de bord intuitif',
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-800 text-white flex-col justify-between p-10">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold">SyndicPro</span>
          </Link>
        </div>
        
        <div className="max-w-xs">
          <h2 className="text-2xl font-semibold leading-snug">
            La gestion de votre immeuble, enfin centralisée.
          </h2>
          <div className="mt-8 space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">© 2026 SyndicPro</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-slate-800 rounded-md flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-800">SyndicPro</span>
          </div>

          <h1 className="text-xl font-semibold text-slate-800">Connexion</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bienvenue. Entrez vos identifiants.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <div className="text-right mt-1">
                <a href="#" className="text-xs text-teal-600 hover:text-teal-700">
                  Mot de passe oublié?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white rounded-md py-2 text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-xs text-slate-400">ou</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Pas encore de compte ? Contactez votre syndic.
          </p>

          <div className="mt-6 p-3 bg-slate-50 rounded-md border border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              Compte de test : admin@syndic.ma / password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
