import { useState, useEffect } from 'react';
import { paiementService, bienService } from '../services/api';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Receipt,
  Calendar,
  Download,
  CreditCard,
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
  const [showMultiModal, setShowMultiModal] = useState(false);
  const [formData, setFormData] = useState({
    bien_id: '',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    montant: 50,
    date_paiement: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [multiFormData, setMultiFormData] = useState({
    bien_id: '',
    mois_debut: new Date().getMonth() + 1,
    annee_debut: new Date().getFullYear(),
    nombre_mois: 3,
    montant_par_mois: 50,
    date_paiement: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');

  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    loadData();
  }, [filterBien, filterAnnee, filterMois]);

  const loadData = async () => {
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
  };

  const openModal = () => {
    setFormData({
      bien_id: '',
      mois: new Date().getMonth() + 1,
      annee: new Date().getFullYear(),
      montant: 50,
      date_paiement: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setError('');
    setShowModal(true);
  };

  const openMultiModal = () => {
    setMultiFormData({
      bien_id: '',
      mois_debut: new Date().getMonth() + 1,
      annee_debut: new Date().getFullYear(),
      nombre_mois: 3,
      montant_par_mois: 50,
      date_paiement: new Date().toISOString().split('T')[0],
    });
    setError('');
    setShowMultiModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await paiementService.create(formData);
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    }
  };

  const handleMultiSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await paiementService.createMultiple(multiFormData);
      setShowMultiModal(false);
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
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <CheckCircle size={12} /> Payé
          </span>
        );
      case 'en_retard':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            <AlertCircle size={12} /> En retard
          </span>
        );
      case 'avance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            <Clock size={12} /> Avance
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
        <h1 className="text-2xl font-bold text-gray-800">Paiements</h1>
        <div className="flex gap-2">
          <button
            onClick={openMultiModal}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Calendar size={20} />
            Paiement anticipé
          </button>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nouveau paiement
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filterBien}
          onChange={(e) => setFilterBien(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[2024, 2025, 2026, 2027].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={filterMois}
          onChange={(e) => setFilterMois(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bien
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propriétaire
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date paiement
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paiements.map((paiement) => (
                  <tr key={paiement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        paiement.bien?.type === 'appartement' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {paiement.bien?.type === 'appartement' ? 'App' : 'Mag'} {paiement.bien?.numero}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {paiement.bien?.proprietaire?.prenom} {paiement.bien?.proprietaire?.nom}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {moisNoms[paiement.mois - 1]} {paiement.annee}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                      {paiement.montant} DH
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatutBadge(paiement.statut)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        {paiement.recu && (
                          <button
                            onClick={() => window.open(`http://localhost:8000/api/recus/${paiement.recu.id}/download`, '_blank')}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Télécharger le reçu"
                          >
                            <Download size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(paiement.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paiements.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                      Aucun paiement trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Paiement Simple */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Nouveau paiement</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bien *</label>
                <select
                  value={formData.bien_id}
                  onChange={(e) => setFormData({ ...formData, bien_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mois *</label>
                  <select
                    value={formData.mois}
                    onChange={(e) => setFormData({ ...formData, mois: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {moisNoms.map((nom, index) => (
                      <option key={index} value={index + 1}>{nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Année *</label>
                  <select
                    value={formData.annee}
                    onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {[2024, 2025, 2026, 2027].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant (DH) *</label>
                  <input
                    type="number"
                    value={formData.montant}
                    onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date paiement *</label>
                  <input
                    type="date"
                    value={formData.date_paiement}
                    onChange={(e) => setFormData({ ...formData, date_paiement: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Paiement Anticipé */}
      {showMultiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Paiement anticipé (plusieurs mois)</h2>
              <button onClick={() => setShowMultiModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleMultiSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bien *</label>
                <select
                  value={multiFormData.bien_id}
                  onChange={(e) => setMultiFormData({ ...multiFormData, bien_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">À partir du mois *</label>
                  <select
                    value={multiFormData.mois_debut}
                    onChange={(e) => setMultiFormData({ ...multiFormData, mois_debut: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {moisNoms.map((nom, index) => (
                      <option key={index} value={index + 1}>{nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Année *</label>
                  <select
                    value={multiFormData.annee_debut}
                    onChange={(e) => setMultiFormData({ ...multiFormData, annee_debut: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {[2024, 2025, 2026, 2027].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de mois *</label>
                  <input
                    type="number"
                    value={multiFormData.nombre_mois}
                    onChange={(e) => setMultiFormData({ ...multiFormData, nombre_mois: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="24"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant/mois (DH) *</label>
                  <input
                    type="number"
                    value={multiFormData.montant_par_mois}
                    onChange={(e) => setMultiFormData({ ...multiFormData, montant_par_mois: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date paiement *</label>
                <input
                  type="date"
                  value={multiFormData.date_paiement}
                  onChange={(e) => setMultiFormData({ ...multiFormData, date_paiement: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Total à payer :</strong> {multiFormData.nombre_mois * multiFormData.montant_par_mois} DH
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMultiModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
