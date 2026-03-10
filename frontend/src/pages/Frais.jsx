import { useState, useEffect, useCallback} from 'react';
import { fraisService, bienService } from '../services/api';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const Frais = () => {
  const [frais, setFrais] = useState([]);
  const [biens, setBiens] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBien, setFilterBien] = useState('');
  const [filterPaye, setFilterPaye] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    bien_id: '',
    paiement_id: '',
    description: '',
    montant: 0,
    date_frais: new Date().toISOString().split('T')[0],
    paye: false,
    scope: 'single',
      bien_ids: [],
  });
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
  setLoading(true);
  try {
    const params = {};
    if (filterBien) params.bien_id = filterBien;
    if (filterPaye !== '') params.paye = filterPaye;

    const [fraisRes, biensRes] = await Promise.all([
      fraisService.getAll(params),
      bienService.getAll(),
    ]);
    setFrais(fraisRes.data.data);
    setBiens(biensRes.data.data);
  } catch (error) {
    console.error('Erreur chargement données:', error);
  } finally {
    setLoading(false);
  }
}, [filterBien, filterPaye]);

useEffect(() => {
  loadData();
}, [loadData]);

  const loadPaiements = async (bienId) => {
    if (!bienId) {
      setPaiements([]);
      return;
    }
    try {
      const response = await bienService.getPaiements(bienId);
      setPaiements(response.data.data);
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
    }
  };

  const openModal = (fraisItem = null) => {
    if (fraisItem) {
      setEditingId(fraisItem.id);
      setFormData({
        bien_id: fraisItem.bien_id || '',
        paiement_id: fraisItem.paiement_id || '',
        description: fraisItem.description,
        montant: fraisItem.montant,
        date_frais: fraisItem.date_frais.split('T')[0],
        paye: fraisItem.paye,
        scope: fraisItem.scope || (fraisItem.is_global ? 'global' : 'single'),
        bien_ids: fraisItem.bien_ids || [],
      });
      if (fraisItem.bien_id) {
        loadPaiements(fraisItem.bien_id);
      }
    } else {
      setEditingId(null);
      setFormData({
        bien_id: '',
        paiement_id: '',
        description: '',
        montant: 0,
        date_frais: new Date().toISOString().split('T')[0],
        paye: false,
        scope: 'single',
        bien_ids: [],
      });
      setPaiements([]);
    }
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setError('');
  };

  const handleBienChange = (bienId) => {
    setFormData({ ...formData, bien_id: bienId, paiement_id: '' });
    loadPaiements(bienId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = { ...formData };
      if (!data.paiement_id) delete data.paiement_id;
      // Clean up bien_id/bien_ids based on scope
      if (data.scope === 'custom') {
        data.bien_id = null;
      } else if (data.scope === 'single') {
        data.bien_ids = null;
      } else {
        data.bien_id = null;
        data.bien_ids = null;
      }

      if (editingId) {
        await fraisService.update(editingId, data);
      } else {
        await fraisService.create(data);
      }
      closeModal();
      loadData();
    } catch (err) {
      // Log backend error for debugging
      console.error('Erreur backend:', err.response?.data || err);
      const msg = err.response?.data?.message || err.message || '';
      // Laravel validation errors are usually in err.response.data.errors
      if (err.response?.status === 422 || err.response?.data?.errors) {
        setError('Veuillez remplir tous les champs obligatoires.');
      } else if (
        msg.includes('Unknown column') ||
        msg.includes('SQLSTATE') ||
        msg.includes('field is required') ||
        msg.includes('required')
      ) {
        setError('Veuillez remplir tous les champs obligatoires.');
      } else if (msg) {
        setError(msg);
      } else {
        setError('Une erreur est survenue');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ces frais ?')) {
      console.log('Suppression frais id:', id);
      try {
        const res = await fraisService.delete(id);
        if (res.data && res.data.success) {
          loadData();
        } else {
          alert(res.data && res.data.message ? res.data.message : 'Erreur lors de la suppression.');
        }
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression.');
      }
    }
  };

  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Frais supplémentaires</h1>
          <p className="text-sm text-slate-500 mt-1">{frais.length} frais enregistré(s)</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
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
              {bien.type === 'appartement' ? 'App' : 'Mag'} {bien.numero}
            </option>
          ))}
        </select>
        <select
          value={filterPaye}
          onChange={(e) => setFilterPaye(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Tous les statuts</option>
          <option value="true">Payés</option>
          <option value="false">Non payés</option>
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
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Paiement lié
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
                {frais.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.is_global ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                          Global (partagé)
                        </span>
                      ) : (
                        <div>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            item.bien?.type === 'appartement' 
                              ? 'bg-slate-100 text-slate-700' 
                              : 'bg-teal-50 text-teal-700'
                          }`}>
                            {item.bien?.type === 'appartement' ? 'App' : 'Mag'} {item.bien?.numero}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.bien?.proprietaire?.prenom} {item.bien?.proprietaire?.nom}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-amber-600">
                      {item.montant} DH
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {new Date(item.date_frais).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {item.paiement ? (
                        <span className="text-teal-600">
                          {moisNoms[item.paiement.mois - 1]} {item.paiement.annee}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.paye ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700">
                          <CheckCircle className="h-3 w-3" /> Payé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-700">
                          <XCircle className="h-3 w-3" /> Non payé
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openModal(item)}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {frais.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-slate-500 text-sm">
                      Aucun frais trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-medium text-slate-800">
                {editingId ? 'Modifier les frais' : 'Nouveaux frais'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Scope selection */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type de frais *</label>
                <select
                  value={formData.scope}
                  onChange={e => setFormData({ ...formData, scope: e.target.value, bien_id: '', bien_ids: [] })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="global">Global (tous les biens)</option>
                  <option value="appartments">Appartements uniquement</option>
                  <option value="garages">Garages uniquement</option>
                  <option value="custom">Sélection manuelle de biens</option>
                  <option value="single">Un seul bien</option>
                </select>
              </div>

              {/* Bien selection for single */}
              {formData.scope === 'single' && (
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
              )}

              {/* Bien multi-select for custom */}
              {formData.scope === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Biens concernés *</label>
                  <select
                    multiple
                    value={formData.bien_ids}
                    onChange={e => {
                      const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                      setFormData({ ...formData, bien_ids: options });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {biens.map((bien) => (
                      <option key={bien.id} value={bien.id}>
                        {bien.type === 'appartement' ? 'App' : 'Mag'} {bien.numero} - {bien.proprietaire?.prenom} {bien.proprietaire?.nom}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs biens.</p>
                </div>
              )}

              {/* Paiement lié */}
              {formData.scope === 'single' && formData.bien_id && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Lié au paiement (optionnel)
                  </label>
                  <select
                    value={formData.paiement_id}
                    onChange={(e) => setFormData({ ...formData, paiement_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Aucun paiement lié</option>
                    {paiements.map((p) => (
                      <option key={p.id} value={p.id}>
                        {moisNoms[p.mois - 1]} {p.annee} - {p.montant} DH
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ex: Réparation plomberie"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Montant (DH) *</label>
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
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date_frais}
                    onChange={(e) => setFormData({ ...formData, date_frais: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="paye"
                  checked={formData.paye}
                  onChange={(e) => setFormData({ ...formData, paye: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="paye" className="text-sm text-slate-700">
                  Frais payés
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-sm font-medium border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                >
                  {editingId ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

  export default Frais;