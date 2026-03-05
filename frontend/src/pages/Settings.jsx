import { useState, useEffect } from 'react';
import { settingsService } from '../services/api';
import { Building2, Mail, Phone, DollarSign, Calendar, Save, Loader2 } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    building_name: '',
    building_address: '',
    syndic_name: '',
    syndic_email: '',
    syndic_phone: '',
    default_cotisation: 50,
    payment_due_day: 28,
    currency: 'DH',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsService.getAll();
      setSettings(response.data.data);
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    try {
      await settingsService.update(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
      <div>
        <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Paramètres</h1>
        <p className="text-sm text-slate-500 mt-1">Configuration de votre syndic</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Building Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-slate-100">
              <Building2 className="h-5 w-5 text-slate-600" />
            </div>
            <h2 className="text-sm font-medium text-slate-800">Informations de l'immeuble</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Nom de l'immeuble
              </label>
              <input
                type="text"
                value={settings.building_name}
                onChange={(e) => handleChange('building_name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Résidence El Fath"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Adresse
              </label>
              <input
                type="text"
                value={settings.building_address}
                onChange={(e) => handleChange('building_address', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Casablanca, Maroc"
              />
            </div>
          </div>
        </div>

        {/* Syndic Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-teal-50">
              <Mail className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-sm font-medium text-slate-800">Coordonnées du syndic</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Nom du syndic
              </label>
              <input
                type="text"
                value={settings.syndic_name}
                onChange={(e) => handleChange('syndic_name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="SyndicPro"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Email
              </label>
              <input
                type="email"
                value={settings.syndic_email}
                onChange={(e) => handleChange('syndic_email', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="contact@syndicpro.ma"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Téléphone
              </label>
              <input
                type="text"
                value={settings.syndic_phone}
                onChange={(e) => handleChange('syndic_phone', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0522-123456"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-50">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-sm font-medium text-slate-800">Paramètres de paiement</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Cotisation mensuelle par défaut
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={settings.default_cotisation}
                  onChange={(e) => handleChange('default_cotisation', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 pr-12"
                  min="0"
                  step="0.01"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  {settings.currency}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Jour d'échéance (du mois)
              </label>
              <input
                type="number"
                value={settings.payment_due_day}
                onChange={(e) => handleChange('payment_due_day', parseInt(e.target.value) || 28)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                min="1"
                max="28"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Devise
              </label>
              <select
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="DH">DH (Dirham)</option>
                <option value="€">€ (Euro)</option>
                <option value="$">$ (Dollar)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </button>
          
          {success && (
            <span className="text-sm text-green-600">
              ✓ Paramètres enregistrés avec succès
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default Settings;
