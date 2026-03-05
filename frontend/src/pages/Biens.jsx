import { useState, useEffect } from 'react';
import { bienService, proprietaireService } from '../services/api';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Building2,
  Home,
  Store,
  User,
} from 'lucide-react';

const Biens = () => {
  const [biens, setBiens] = useState([]);
  const [proprietaires, setProprietaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    proprietaire_id: '',
    type: 'appartement',
    numero: '',
    adresse: '',
    cotisation_mensuelle: 50,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [search, filterType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [biensRes, proprietairesRes] = await Promise.all([
        bienService.getAll({ search, type: filterType }),
        proprietaireService.getAll(),
      ]);
      setBiens(biensRes.data.data);
      setProprietaires(proprietairesRes.data.data);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (bien = null) => {
    if (bien) {
      setEditingId(bien.id);
      setFormData({
        proprietaire_id: bien.proprietaire_id,
        type: bien.type,
        numero: bien.numero,
        adresse: bien.adresse || '',
        cotisation_mensuelle: bien.cotisation_mensuelle,
      });
    } else {
      setEditingId(null);
      setFormData({
        proprietaire_id: '',
        type: 'appartement',
        numero: '',
        adresse: '',
        cotisation_mensuelle: 50,
      });
    }
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await bienService.update(editingId, formData);
      } else {
        await bienService.create(formData);
      }
      closeModal();
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bien ?')) {
      try {
        await bienService.delete(id);
        loadData();
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Biens</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Ajouter
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un bien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les types</option>
          <option value="appartement">Appartements</option>
          <option value="magasin">Magasins</option>
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {biens.map((bien) => (
            <div
              key={bien.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    bien.type === 'appartement' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    {bien.type === 'appartement' 
                      ? <Home className="text-blue-600" size={24} />
                      : <Store className="text-purple-600" size={24} />
                    }
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {bien.type === 'appartement' ? 'Appartement' : 'Magasin'} {bien.numero}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      bien.type === 'appartement' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {bien.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(bien)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(bien.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span>{bien.proprietaire?.prenom} {bien.proprietaire?.nom}</span>
                </div>
                {bien.adresse && (
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-gray-400" />
                    <span className="truncate">{bien.adresse}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="text-sm text-gray-500">Cotisation mensuelle</span>
                <span className="font-semibold text-green-600">{bien.cotisation_mensuelle} DH</span>
              </div>
            </div>
          ))}

          {biens.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              Aucun bien trouvé
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Modifier le bien' : 'Nouveau bien'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propriétaire *
                </label>
                <select
                  value={formData.proprietaire_id}
                  onChange={(e) => setFormData({ ...formData, proprietaire_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un propriétaire</option>
                  {proprietaires.map((p) => (
                    <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="appartement">Appartement</option>
                    <option value="magasin">Magasin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro *
                  </label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A1, M2..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cotisation mensuelle (DH)
                </label>
                <input
                  type="number"
                  value={formData.cotisation_mensuelle}
                  onChange={(e) => setFormData({ ...formData, cotisation_mensuelle: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

export default Biens;
