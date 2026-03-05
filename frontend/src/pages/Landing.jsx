import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  CreditCard, 
  FileText, 
  Bell, 
  Calendar,
  Check,
  ArrowRight
} from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: CreditCard,
      title: 'Suivi des charges',
      description: 'Suivez les paiements mensuels et identifiez rapidement les retards.',
    },
    {
      icon: Users,
      title: 'Gestion des résidents',
      description: 'Base de données complète des propriétaires et locataires.',
    },
    {
      icon: Calendar,
      title: 'Assemblées générales',
      description: 'Organisez et documentez vos réunions de copropriété.',
    },
    {
      icon: FileText,
      title: 'Documents & archives',
      description: 'Centralisez tous vos documents importants en un seul endroit.',
    },
    {
      icon: Building2,
      title: 'Gestion des biens',
      description: 'Gérez appartements et locaux commerciaux efficacement.',
    },
    {
      icon: Bell,
      title: 'Notifications automatiques',
      description: 'Alertes automatiques pour les échéances et rappels.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-800 rounded-md flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-800">SyndicPro</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-800 transition-colors">
              Fonctionnalités
            </a>
            <a href="#" className="text-sm text-slate-600 hover:text-slate-800 transition-colors">
              Tarifs
            </a>
            <a href="#" className="text-sm text-slate-600 hover:text-slate-800 transition-colors">
              Contact
            </a>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 transition-colors"
          >
            Se connecter
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-slate-50 py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 text-xs px-3 py-1 mb-6">
            Gestion de copropriété simplifiée
          </div>
          <h1 className="text-4xl lg:text-5xl font-semibold text-slate-800 tracking-tight leading-tight">
            Gérez votre copropriété avec clarté et efficacité
          </h1>
          <p className="text-slate-500 text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Une solution complète pour suivre les charges, gérer les résidents et simplifier l'administration de votre immeuble.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 transition-colors"
            >
              Commencer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="inline-flex items-center px-6 py-2.5 text-sm font-medium rounded-md text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors">
              Voir la démo
            </button>
          </div>
          
          {/* Mockup placeholder */}
          <div className="mt-16 rounded-2xl shadow-md border border-slate-200 bg-white p-8 max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-semibold text-slate-800">24</p>
                <p className="text-xs text-slate-500 mt-1">Propriétaires</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-semibold text-teal-600">98%</p>
                <p className="text-xs text-slate-500 mt-1">Taux de paiement</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-semibold text-slate-800">1.2K</p>
                <p className="text-xs text-slate-500 mt-1">DH ce mois</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-semibold text-slate-800 text-center tracking-tight">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-slate-500 text-center mt-3 max-w-xl mx-auto">
            Des outils puissants pour simplifier la gestion quotidienne de votre copropriété.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-50 rounded-xl p-6 border border-slate-100"
                >
                  <Icon className="h-5 w-5 text-teal-600" />
                  <h3 className="text-sm font-medium text-slate-800 mt-3">{feature.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-semibold text-slate-800 tracking-tight">
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="text-slate-500 mt-3">
            Rejoignez les syndics qui font confiance à SyndicPro.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 transition-colors"
            >
              Accéder à l'application
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">SyndicPro</span>
              </div>
              <p className="text-slate-400 text-sm mt-2">
                La gestion de copropriété, simplifiée.
              </p>
            </div>
            <div className="flex gap-8 mt-6 md:mt-0">
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                Fonctionnalités
              </a>
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                Tarifs
              </a>
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-6">
            <p className="text-xs text-slate-500">
              © 2026 SyndicPro. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
