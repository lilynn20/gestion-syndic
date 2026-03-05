import { useState, useEffect } from 'react';
import { dashboardService, proprietaireService, bienService } from '../services/api';
import {
  Users,
  Building2,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [tableau, setTableau] = useState(null);
  const [evolution, setEvolution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [filters, setFilters] = useState({
    type: '',
    proprietaire_id: '',
  });
  const [proprietaires, setProprietaires] = useState([]);

  const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  useEffect(() => {
    loadData();
    loadProprietaires();
  }, [annee, filters]);

  const loadProprietaires = async () => {
    try {
      const response = await proprietaireService.getAll();
      setProprietaires(response.data.data);
    } catch (error) {
      console.error('Erreur chargement propriétaires:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, tableauRes, evolutionRes] = await Promise.all([
        dashboardService.getStats({ annee }),
        dashboardService.getTableauPaiements({ annee, ...filters }),
        dashboardService.getEvolution({ annee }),
      ]);

      setStats(statsRes.data.data);
      setTableau(tableauRes.data.data);
      setEvolution(evolutionRes.data.data);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtext && <p className="text-sm text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-4 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'paye':
      case 'avance':
        return 'bg-green-500';
      case 'en_retard':
        return 'bg-red-500';
      default:
        return 'bg-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
        <div className="flex items-center gap-4">
          <select
            value={annee}
            onChange={(e) => setAnnee(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2024, 2025, 2026, 2027].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Propriétaires"
          value={stats?.statistiques?.total_proprietaires || 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Biens"
          value={stats?.statistiques?.total_biens || 0}
          icon={Building2}
          color="bg-green-500"
          subtext={`${stats?.statistiques?.total_appartements || 0} app. / ${stats?.statistiques?.total_magasins || 0} mag.`}
        />
        <StatCard
          title="Total Paiements"
          value={`${stats?.statistiques?.total_paiements || 0} DH`}
          icon={CreditCard}
          color="bg-purple-500"
        />
        <StatCard
          title="En Retard"
          value={stats?.statistiques?.paiements_en_retard || 0}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      {/* Solde */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Entrées</p>
              <p className="text-xl font-bold text-green-600">{stats?.statistiques?.total_paiements || 0} DH</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-red-100">
              <TrendingDown className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dépenses</p>
              <p className="text-xl font-bold text-red-600">{stats?.statistiques?.total_depenses || 0} DH</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-100">
              <Wallet className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Solde</p>
              <p className={`text-xl font-bold ${(stats?.statistiques?.solde || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats?.statistiques?.solde || 0} DH
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique évolution */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Évolution mensuelle</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nom_mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="paiements" stroke="#22c55e" name="Paiements" strokeWidth={2} />
              <Line type="monotone" dataKey="depenses" stroke="#ef4444" name="Dépenses" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtres tableau */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les types</option>
            <option value="appartement">Appartements</option>
            <option value="magasin">Magasins</option>
          </select>
          <select
            value={filters.proprietaire_id}
            onChange={(e) => setFilters({ ...filters, proprietaire_id: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les propriétaires</option>
            {proprietaires.map((p) => (
              <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Suivi des paiements {annee}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                  Bien
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propriétaire
                </th>
                {moisNoms.map((mois, index) => (
                  <th key={index} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {mois}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tableau?.tableau?.map((ligne) => (
                <tr key={ligne.bien_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        ligne.type === 'appartement' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {ligne.type === 'appartement' ? 'App' : 'Mag'}
                      </span>
                      <span className="ml-2 font-medium">{ligne.numero}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {ligne.proprietaire}
                  </td>
                  {Object.values(ligne.mois).map((moisData, index) => (
                    <td key={index} className="px-2 py-3 text-center">
                      <div
                        className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${getStatutColor(moisData.statut)}`}
                        title={moisData.paye ? `Payé le ${moisData.date_paiement}` : 'Non payé'}
                      >
                        {moisData.paye && <CheckCircle size={16} className="text-white" />}
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap text-right font-semibold">
                    {ligne.total_paye} DH
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="2" className="px-4 py-3 font-semibold">Total</td>
                {Object.values(tableau?.totaux_par_mois || {}).map((total, index) => (
                  <td key={index} className="px-2 py-3 text-center font-semibold text-sm">
                    {total}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-bold text-lg text-blue-600">
                  {tableau?.total_general || 0} DH
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>Payé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span>En retard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-200"></div>
          <span>Non payé</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
