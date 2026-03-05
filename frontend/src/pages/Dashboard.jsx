import { useState, useEffect } from 'react';
import { dashboardService, proprietaireService } from '../services/api';
import {
  Users,
  Building2,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Check,
  Download,
  Printer,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [tableau, setTableau] = useState(null);
  const [evolution, setEvolution] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const [anneeDebut, setAnneeDebut] = useState(currentYear - 1);
  const [anneeFin, setAnneeFin] = useState(currentYear);
  const [anneeEvolution, setAnneeEvolution] = useState(currentYear);
  const [filters, setFilters] = useState({
    type: '',
    proprietaire_id: '',
  });
  const [proprietaires, setProprietaires] = useState([]);

  useEffect(() => {
    loadData();
    loadProprietaires();
  }, [anneeDebut, anneeFin, anneeEvolution, filters]);

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
        dashboardService.getStats({ annee: anneeFin }),
        dashboardService.getTableauPaiements({ annee_debut: anneeDebut, annee_fin: anneeFin, ...filters }),
        dashboardService.getEvolution({ annee: anneeEvolution }),
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

  const exportToCSV = () => {
    if (!tableau?.tableau || !tableau?.colonnes) return;
    
    // Build CSV header
    const headers = ['Bien', 'Type', 'Propriétaire', ...tableau.colonnes.map(c => c.label), 'Total'];
    
    // Build CSV rows
    const rows = tableau.tableau.map(ligne => {
      const monthStatuses = tableau.colonnes.map(col => {
        const moisData = ligne.mois[col.key];
        if (moisData?.statut === 'non_applicable') return '-';
        if (moisData?.paye) return 'Payé';
        if (moisData?.statut === 'en_retard') return 'Retard';
        return 'Non payé';
      });
      return [ligne.numero, ligne.type, ligne.proprietaire, ...monthStatuses, `${ligne.total_paye} DH`];
    });
    
    // Add totals row
    const totalsRow = ['Total', '', '', ...tableau.colonnes.map(c => tableau.totaux_par_mois?.[c.key] || 0), `${tableau.total_general || 0} DH`];
    rows.push(totalsRow);
    
    // Create CSV content
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(';'))
      .join('\n');
    
    // Add BOM for Excel to recognize UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paiements_${anneeDebut}-${anneeFin}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const StatCard = ({ title, value, icon: Icon, iconBg, subtext }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-semibold text-slate-800 mt-1">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );

  const getStatutClasses = (statut) => {
    switch (statut) {
      case 'paye':
      case 'avance':
        return 'bg-green-50 border-green-200';
      case 'en_retard':
        return 'bg-red-50 border-red-200';
      case 'non_applicable':
        return 'bg-slate-100 border-slate-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getStatutIcon = (statut, paye) => {
    if (statut === 'non_applicable') {
      return <span className="text-xs text-slate-400">-</span>;
    }
    if (paye) {
      return <Check className="h-3.5 w-3.5 text-green-600" />;
    }
    if (statut === 'en_retard') {
      return <span className="text-xs text-red-500">!</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-slate-500 mt-1">Vue d'ensemble de votre copropriété</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Stats & Graphe:</span>
          <select
            value={anneeEvolution}
            onChange={(e) => setAnneeEvolution(parseInt(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {[2024, 2025, 2026, 2027].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Propriétaires"
          value={stats?.statistiques?.total_proprietaires || 0}
          icon={Users}
          iconBg="bg-slate-700"
        />
        <StatCard
          title="Biens"
          value={stats?.statistiques?.total_biens || 0}
          icon={Building2}
          iconBg="bg-teal-600"
          subtext={`${stats?.statistiques?.total_appartements || 0} app. · ${stats?.statistiques?.total_magasins || 0} mag.`}
        />
        <StatCard
          title="Total Paiements"
          value={`${stats?.statistiques?.total_paiements || 0} DH`}
          icon={CreditCard}
          iconBg="bg-slate-700"
        />
        <StatCard
          title="En Retard"
          value={stats?.statistiques?.paiements_en_retard || 0}
          icon={AlertTriangle}
          iconBg="bg-red-500"
        />
      </div>

      {/* Solde Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Entrées</p>
              <p className="text-lg font-semibold text-green-600">{stats?.statistiques?.total_paiements || 0} DH</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Dépenses</p>
              <p className="text-lg font-semibold text-red-600">{stats?.statistiques?.total_depenses || 0} DH</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Wallet className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Solde</p>
              <p className={`text-lg font-semibold ${(stats?.statistiques?.solde || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats?.statistiques?.solde || 0} DH
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique évolution */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-medium text-slate-800 mb-4">Évolution mensuelle</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nom_mois" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px'
                }} 
              />
              <Line type="monotone" dataKey="paiements" stroke="#0d9488" name="Paiements" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="depenses" stroke="#ef4444" name="Dépenses" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtres tableau */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">De:</span>
          <select
            value={anneeDebut}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setAnneeDebut(val);
              if (val > anneeFin) setAnneeFin(val);
            }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {[2024, 2025, 2026, 2027].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">À:</span>
          <select
            value={anneeFin}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setAnneeFin(val);
              if (val < anneeDebut) setAnneeDebut(val);
            }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {[2024, 2025, 2026, 2027].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Tous les types</option>
          <option value="appartement">Appartements</option>
          <option value="magasin">Magasins</option>
        </select>
        <select
          value={filters.proprietaire_id}
          onChange={(e) => setFilters({ ...filters, proprietaire_id: e.target.value })}
          className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Tous les propriétaires</option>
          {proprietaires.map((p) => (
            <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
          ))}
        </select>
      </div>

      {/* Tableau des paiements */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-0">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between print:hidden">
          <h2 className="text-sm font-medium text-slate-800">
            Suivi des paiements {anneeDebut === anneeFin ? anneeDebut : `${anneeDebut} - ${anneeFin}`}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Exporter CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimer
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50 z-10 min-w-[120px]">
                  Bien
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide sticky left-[120px] bg-slate-50 z-10 min-w-[140px]">
                  Propriétaire
                </th>
                {tableau?.colonnes?.map((col) => (
                  <th key={col.key} className="px-2 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableau?.tableau?.map((ligne) => (
                <tr key={ligne.bien_id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        ligne.type === 'appartement' 
                          ? 'bg-slate-100 text-slate-700' 
                          : 'bg-teal-50 text-teal-700'
                      }`}>
                        {ligne.type === 'appartement' ? 'App' : 'Mag'}
                      </span>
                      <span className="font-medium text-slate-800">{ligne.numero}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 sticky left-[120px] bg-white z-10 min-w-[140px]">
                    {ligne.proprietaire}
                  </td>
                  {tableau?.colonnes?.map((col) => {
                    const moisData = ligne.mois[col.key];
                    return (
                      <td key={col.key} className="px-2 py-3 text-center">
                        <div
                          className={`w-7 h-7 mx-auto rounded-md border flex items-center justify-center ${getStatutClasses(moisData?.statut)}`}
                          title={
                            moisData?.statut === 'non_applicable' 
                              ? 'Pas encore adhérent' 
                              : moisData?.paye 
                                ? `Payé le ${moisData?.date_paiement}` 
                                : 'Non payé'
                          }
                        >
                          {getStatutIcon(moisData?.statut, moisData?.paye)}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-slate-800">
                    {ligne.total_paye} DH
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan="2" className="px-4 py-3 font-medium text-slate-800 sticky left-0 bg-slate-50 z-10">Total</td>
                {tableau?.colonnes?.map((col) => (
                  <td key={col.key} className="px-2 py-3 text-center font-medium text-slate-600 text-xs">
                    {tableau?.totaux_par_mois?.[col.key] || 0}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-semibold text-teal-600">
                  {tableau?.total_general || 0} DH
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-green-50 border border-green-200 flex items-center justify-center">
            <Check className="h-3 w-3 text-green-600" />
          </div>
          <span>Payé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-red-50 border border-red-200 flex items-center justify-center">
            <span className="text-xs text-red-500">!</span>
          </div>
          <span>En retard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-50 border border-slate-200"></div>
          <span>Non payé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center">
            <span className="text-xs text-slate-400">-</span>
          </div>
          <span>Pas encore adhérent</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
