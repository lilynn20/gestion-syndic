import { useState, useEffect, useCallback } from 'react';
import { paiementService, bienService, fraisService } from '../services/api';
import {
  Plus,
  Trash2,
  X,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

const Paiements = () => {
  const [paiements, setPaiements] = useState([]);
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBien, setFilterBien] = useState('');
  const [filterAnnee, setFilterAnnee] = useState(new Date().getFullYear());
  const [filterMois, setFilterMois] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isAnticipated, setIsAnticipated] = useState(false);
  const [formData, setFormData] = useState({
    bien_id: '',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    montant: 50,
    date_paiement: new Date().toISOString().split('T')[0],
    notes: '',
    nombre_mois: 3,
  });
  const [error, setError] = useState('');
  const [includeExtraFees, setIncludeExtraFees] = useState(false);
  const [extraFeesData, setExtraFeesData] = useState({ data: [], total_share: 0 });
  const [loadingExtraFees, setLoadingExtraFees] = useState(false);

  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const loadData = useCallback(async () => { 
    setLoading(true);
    try {
      const params = { annee: filterAnnee };
      if (filterBien) params.bien_id = filterBien;
      if (filterMois) params.mois = filterMois;

      const [paiementsRes, biensRes] = await Promise.all([
        paiementService.getAll(params),
        bienService.getAll(),
      ]);
      setPaiements(paiementsRes.data.data);
      setBiens(biensRes.data.data);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
    
  }, [filterBien, filterAnnee, filterMois]);
    useEffect(() => {
      loadData();
    }, [loadData]);

  const openModal = () => {
    setFormData({
      bien_id: '',
      mois: new Date().getMonth() + 1,
      annee: new Date().getFullYear(),
      montant: 50,
      date_paiement: new Date().toISOString().split('T')[0],
      notes: '',
      nombre_mois: 3,
    });
    setIsAnticipated(false);
    setIncludeExtraFees(false);
    setExtraFeesData({ data: [], total_share: 0 });
    setError('');
    setShowModal(true);
  };

  const loadExtraFees = async (bienId) => {
    if (!bienId) {
      setExtraFeesData({ data: [], total_share: 0 });
      return;
    }
    setLoadingExtraFees(true);
    try {
      const response = await fraisService.getUnpaidGlobal(bienId);
      setExtraFeesData(response.data);
    } catch (error) {
      console.error('Erreur chargement frais:', error);
      setExtraFeesData({ data: [], total_share: 0 });
    } finally {
      setLoadingExtraFees(false);
    }
  };

  const handleBienChange = (bienId) => {
    setFormData({ ...formData, bien_id: bienId });
    loadExtraFees(bienId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isAnticipated) {
        // Paiement anticipé - multiple months
        await paiementService.createMultiple({
          bien_id: formData.bien_id,
          mois_debut: formData.mois,
          annee_debut: formData.annee,
          nombre_mois: formData.nombre_mois,
          montant_par_mois: formData.montant,
          date_paiement: formData.date_paiement,
          include_extra_fees: includeExtraFees,
        });
      } else {
        // Paiement simple
        await paiementService.create({
          ...formData,
          include_extra_fees: includeExtraFees,
        });
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      try {
        await paiementService.delete(id);
        loadData();
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'paye':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700">
            <CheckCircle className="h-3 w-3" /> Payé
          </span>
        );
      case 'en_retard':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-700">
            <AlertCircle className="h-3 w-3" /> En retard
          </span>
        );
      case 'avance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-teal-50 text-teal-700">
            <Clock className="h-3 w-3" /> Avance
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Paiements</h1>
          <p className="text-sm text-slate-500 mt-1">{paiements.length} paiement(s) enregistré(s)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau paiement
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterBien}
          onChange={(e) => setFilterBien(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Tous les biens</option>
          {biens.map((bien) => (
            <option key={bien.id} value={bien.id}>
              {bien.type === 'appartement' ? 'App' : 'Mag'} {bien.numero} - {bien.proprietaire?.prenom} {bien.proprietaire?.nom}
            </option>
          ))}
        </select>
        <select
          value={filterAnnee}
          onChange={(e) => setFilterAnnee(parseInt(e.target.value))}
          className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {[2024, 2025, 2026, 2027].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={filterMois}
          onChange={(e) => setFilterMois(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Tous les mois</option>
          {moisNoms.map((nom, index) => (
            <option key={index} value={index + 1}>{nom}</option>
          ))}
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-teal-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Bien
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Propriétaire
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date paiement
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paiements.map((paiement) => (
                  <tr key={paiement.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        paiement.bien?.type === 'appartement' 
                          ? 'bg-slate-100 text-slate-700' 
                          : 'bg-teal-50 text-teal-700'
                      }`}>
                        {paiement.bien?.type === 'appartement' ? 'App' : 'Mag'} {paiement.bien?.numero}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {paiement.bien?.proprietaire?.prenom} {paiement.bien?.proprietaire?.nom}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {moisNoms[paiement.mois - 1]} {paiement.annee}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-teal-600">
                      {paiement.montant} DH
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatutBadge(paiement.statut)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        {paiement.recu && (
                          <button
                            onClick={() => {
                              const token = localStorage.getItem('token');
                              window.open(`http://localhost:8000/api/recus/${paiement.recu.id}/download?token=${token}`, '_blank');
                            }}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                            title="Télécharger le reçu"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(paiement.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paiements.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-slate-500 text-sm">
                      Aucun paiement trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Paiement */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-medium text-slate-800">
                {isAnticipated ? 'Paiement anticipé' : 'Nouveau paiement'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              {error && (
                <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Checkbox paiement anticipé */}
              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isAnticipated}
                  onChange={(e) => setIsAnticipated(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">Paiement anticipé</span>
                  <p className="text-xs text-slate-500">Payer plusieurs mois à l'avance</p>
                </div>
              </label>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bien *</label>
                <select
                  value={formData.bien_id}
                  onChange={(e) => handleBienChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Sélectionner un bien</option>
                  {biens.map((bien) => (
                    <option key={bien.id} value={bien.id}>
                      {bien.type === 'appartement' ? 'App' : 'Mag'} {bien.numero} - {bien.proprietaire?.prenom} {bien.proprietaire?.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkbox frais supplémentaires */}
              {formData.bien_id && extraFeesData.data.length > 0 && (
                <label className="md:col-span-2 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md cursor-pointer hover:bg-amber-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeExtraFees}
                    onChange={(e) => setIncludeExtraFees(e.target.checked)}
                    className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-amber-700">Inclure les frais supplémentaires</span>
                    <p className="text-xs text-amber-600">
                      {extraFeesData.data.length} frais non payé(s) - Part: {extraFeesData.total_share} DH
                    </p>
                  </div>
                </label>
              )}

              {/* Détails frais supplémentaires */}
              {includeExtraFees && extraFeesData.data.length > 0 && (
                <div className="md:col-span-2 p-3 bg-amber-50 border border-amber-100 rounded-md">
                  <p className="text-xs font-medium text-amber-700 mb-2">Frais supplémentaires inclus:</p>
                  <ul className="space-y-1">
                    {extraFeesData.data.map((frais) => (
                      <li key={frais.id} className="text-xs text-amber-600 flex justify-between">
                        <span>{frais.description}</span>
                        <span className="font-medium">{frais.share_amount} DH</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 pt-2 border-t border-amber-200 flex justify-between text-sm font-medium text-amber-700">
                    <span>Total frais supplémentaires:</span>
                    <span>{extraFeesData.total_share} DH</span>
                  </div>
                </div>
              )}

              {loadingExtraFees && (
                <div className="md:col-span-2 flex items-center gap-2 text-xs text-slate-500">
                  <div className="animate-spin rounded-full h-3 w-3 border border-slate-300 border-t-teal-600"></div>
                  Chargement des frais supplémentaires...
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {isAnticipated ? 'À partir du mois *' : 'Mois *'}
                  </label>
                  <select
                    value={formData.mois}
                    onChange={(e) => setFormData({ ...formData, mois: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {moisNoms.map((nom, index) => (
                      <option key={index} value={index + 1}>{nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Année *</label>
                  <select
                    value={formData.annee}
                    onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {[2024, 2025, 2026, 2027].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isAnticipated && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de mois *</label>
                  <input
                    type="number"
                    value={formData.nombre_mois}
                    onChange={(e) => setFormData({ ...formData, nombre_mois: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    min="1"
                    max="24"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {isAnticipated ? 'Montant/mois (DH) *' : 'Montant (DH) *'}
                  </label>
                  <input
                    type="number"
                    value={formData.montant}
                    onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date paiement *</label>
                  <input
                    type="date"
                    value={formData.date_paiement}
                    onChange={(e) => setFormData({ ...formData, date_paiement: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows="2"
                ></textarea>
              </div>

              {isAnticipated && (
                <div className="md:col-span-2 p-3 bg-teal-50 border border-teal-100 rounded-md">
                  <p className="text-sm text-teal-700">
                    <strong>Total à payer :</strong> {formData.nombre_mois * formData.montant + (includeExtraFees ? extraFeesData.total_share : 0)} DH
                    {includeExtraFees && extraFeesData.total_share > 0 && (
                      <span className="text-xs ml-1">(dont {extraFeesData.total_share} DH de frais)</span>
                    )}
                  </p>
                </div>
              )}

              {!isAnticipated && includeExtraFees && extraFeesData.total_share > 0 && (
                <div className="md:col-span-2 p-3 bg-teal-50 border border-teal-100 rounded-md">
                  <p className="text-sm text-teal-700">
                    <strong>Total à payer :</strong> {formData.montant + extraFeesData.total_share} DH
                    <span className="text-xs ml-1">(dont {extraFeesData.total_share} DH de frais)</span>
                  </p>
                </div>
              )}

              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                  style={{ minWidth: 120 }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                  style={{ minWidth: 120 }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Paiements;