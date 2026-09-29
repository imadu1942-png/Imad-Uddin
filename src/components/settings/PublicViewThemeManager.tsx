import React, { useState, useEffect } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sparkles,
  Eye,
  AlertCircle,
  CheckCircle2,
  Copy,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  Sliders,
  FileCode,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import {
  PublicViewSettings,
  DEFAULT_PUBLIC_VIEW_SETTINGS,
  THEME_PRESETS,
  PublicThemeId,
  PublicHeaderStyle,
  PublicSummary,
} from '../../types/database.types';
import { databaseService } from '../../services/databaseService';
import { IslamicDomeLogo } from '../common/IslamicDomeLogo';
import { getThemeStyles } from '../../utils/themeHelper';
import { formatCurrency, toBengaliNumber } from '../../utils/formatters';

interface PublicViewThemeManagerProps {
  currentSettings: PublicViewSettings;
  isLoading: boolean;
  onSave: (newSettings: PublicViewSettings) => Promise<boolean>;
  publicSummary?: PublicSummary | null;
}

const PRESET_ACCENT_COLORS = [
  { name: 'ইসলামিক গাঢ় সবুজ', color: '#047857' },
  { name: 'উজ্জ্বল পান্না', color: '#059669' },
  { name: 'গাঢ় বনানী টিল', color: '#0f766e' },
  { name: 'সমুদ্র নীলভ টিল', color: '#0284c7' },
  { name: 'রাজকীয় গাঢ় স্লেট', color: '#334155' },
  { name: 'সোনালী আম্বার', color: '#b45309' },
  { name: 'গাঢ় কাঠকয়লা', color: '#27272a' },
];

const HEADER_STYLES: Array<{ id: PublicHeaderStyle; label: string; desc: string }> = [
  { id: 'gradient', label: 'মসৃণ গ্রেডিয়েন্ট (Gradient)', desc: 'ঐতিহ্যবাহী গাঢ় ও দৃষ্টিনন্দন দ্বি-রঙা গ্রেডিয়েন্ট শেড' },
  { id: 'solid', label: 'গাঢ় সলিড (Solid)', desc: 'স্থির ও গভীর গাঢ় রঙের স্পষ্ট ব্যাকগ্রাউন্ড' },
  { id: 'bordered', label: 'বর্ডারযুক্ত আভিজাত্য (Bordered)', desc: 'সূক্ষ্ম অ্যাকসেন্ট বর্ডারসহ পরিমিত ডার্ক লুক' },
  { id: 'card', label: 'ভাসমান কার্ড (Floating Card)', desc: 'উঁচু শ্যাডো ও গোলাকার মার্জিত কার্ডের রূপ' },
];

export const PublicViewThemeManager: React.FC<PublicViewThemeManagerProps> = ({
  currentSettings,
  isLoading,
  onSave,
  publicSummary,
}) => {
  const [formData, setFormData] = useState<PublicViewSettings>(currentSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState<'entry' | 'dashboard'>('entry');
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [liveSummary, setLiveSummary] = useState<PublicSummary | null>(publicSummary || null);

  // Sync state if initial props change
  useEffect(() => {
    setFormData(currentSettings);
  }, [currentSettings]);

  useEffect(() => {
    if (publicSummary) {
      setLiveSummary(publicSummary);
      return;
    }
    databaseService
      .getPublicSummary()
      .then((data) => setLiveSummary(data))
      .catch((err) => {
        console.warn('Preview public summary note:', err?.message);
      });
  }, [publicSummary]);

  const handleInputChange = (field: keyof PublicViewSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (saveSuccessMsg) setSaveSuccessMsg('');
    if (saveErrorMsg) setSaveErrorMsg('');
  };

  const handleSelectTheme = (themeId: PublicThemeId) => {
    const preset = THEME_PRESETS.find((p) => p.id === themeId);
    setFormData((prev) => ({
      ...prev,
      themeId,
      accentColor: preset ? preset.defaultAccent : prev.accentColor,
    }));
    if (saveSuccessMsg) setSaveSuccessMsg('');
    if (saveErrorMsg) setSaveErrorMsg('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setSaveErrorMsg('');
    try {
      const publicUrl = await databaseService.uploadPublicLogo(file);
      handleInputChange('logoUrl', publicUrl);
      setSaveSuccessMsg('লোগো সফলভাবে আপলোড হয়েছে! সংরক্ষণ করুন বাটনে ক্লিক করুন।');
    } catch (err: any) {
      setSaveErrorMsg(err?.message || 'লোগো আপলোড করা সম্ভব হয়নি। সরাসরি ইমেজ লিঙ্ক (URL) দিতে পারেন।');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('আপনি কি ডিফল্ট ডিজাইনে ফিরে যেতে চান? (এটি সাথে সাথে সেভ হবে না, প্রিভিউ দেখে সংরক্ষণ করতে পারবেন)')) {
      setFormData({ ...DEFAULT_PUBLIC_VIEW_SETTINGS });
      setSaveSuccessMsg('');
      setSaveErrorMsg('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      await onSave(formData);
      setSaveSuccessMsg('পাবলিক ভিউ ডিজাইন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      setSaveErrorMsg(err?.message || 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSaving(false);
    }
  };

  const sqlSetupScript = `-- সুপাবেস SQL Editor-এ public_view_settings টেবিল তৈরির স্ক্রিপ্ট:
CREATE TABLE IF NOT EXISTS public.public_view_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  org_name TEXT NOT NULL DEFAULT 'আশেকানে গাউছিয়া',
  subtitle TEXT NOT NULL DEFAULT 'হাদিয়া, মাহফিল ও আয়-ব্যয়ের হিসাব',
  welcome_message TEXT NOT NULL DEFAULT 'আসসালামু আলাইকুম, আপনাকে স্বাগতম',
  logo_url TEXT DEFAULT '',
  theme_id TEXT NOT NULL DEFAULT 'classic',
  accent_color TEXT NOT NULL DEFAULT '#047857',
  header_style TEXT NOT NULL DEFAULT 'gradient',
  footer_text TEXT NOT NULL DEFAULT '© আশেকানে গাউছিয়া। সর্বস্বত্ব সংরক্ষিত।',
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.public_view_settings (id, org_name, subtitle, welcome_message, logo_url, theme_id, accent_color, header_style, footer_text)
VALUES ('default', 'আশেকানে গাউছিয়া', 'হাদিয়া, মাহফিল ও আয়-ব্যয়ের হিসাব', 'আসসালামু আলাইকুম, আপনাকে স্বাগতম', '', 'classic', '#047857', 'gradient', '© আশেকানে গাউছিয়া। সর্বস্বত্ব সংরক্ষিত।')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.public_view_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only on public_view_settings"
  ON public.public_view_settings FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin insert on public_view_settings"
  ON public.public_view_settings FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Allow admin update on public_view_settings"
  ON public.public_view_settings FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Allow admin delete on public_view_settings"
  ON public.public_view_settings FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const previewStyles = getThemeStyles(formData);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-8 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-stone-700">সেটিংস লোড হচ্ছে...</p>
        <p className="text-xs text-stone-500">পাবলিক ভিউ ডিজাইন কনফিগারেশন সংগ্রহ করা হচ্ছে</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-1">
            <Palette className="w-3.5 h-3.5" />
            <span>অ্যাডমিন এক্সক্লুসিভ ফিচার</span>
          </div>
          <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            পাবলিক ভিউ ডিজাইন
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            সাধারণ দর্শনার্থীদের জন্য উন্মুক্ত পাবলিক ভিউ ও প্রবেশদ্বারের নাম, লোগো, থিম ও বার্তার রূপরেখা নির্ধারণ করুন
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDefaults}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          title="ডিফল্ট রূপরেখায় রিসেট করুন"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>ডিফল্ট রিকভার</span>
        </button>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">সফল: </span>
            <span>{saveSuccessMsg}</span>
          </div>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">ত্রুটি: </span>
            <span>{saveErrorMsg}</span>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowSqlHelp(!showSqlHelp)}
                className="text-xs text-rose-700 underline font-medium hover:text-rose-900 cursor-pointer"
              >
                {showSqlHelp ? 'SQL সাহায্য লুকান' : 'ডাটাবেস টেবিল সংক্রান্ত SQL নির্দেশনা দেখুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Script Accordion */}
      {showSqlHelp && (
        <div className="p-4 bg-stone-900 text-stone-100 rounded-xl border border-stone-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <FileCode className="w-4 h-4" />
              <span>Supabase SQL Setup for public_view_settings</span>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded text-xs transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedSql ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
            </button>
          </div>
          <pre className="p-3 bg-black/60 rounded text-[11px] font-mono overflow-x-auto text-stone-300 max-h-48 leading-relaxed">
            {sqlSetupScript}
          </pre>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: Brand & Identity */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            ১. সংগঠনের পরিচিতি ও মূল বার্তা
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Organization Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                সংগঠনের নাম (Organization Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.orgName}
                onChange={(e) => handleInputChange('orgName', e.target.value)}
                placeholder="যেমন: আশেকানে গাউছিয়া"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                সাবটাইটেল / স্লোগান (Subtitle)
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="যেমন: হাদিয়া, মাহফিল ও আয়-ব্যয়ের হিসাব"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Welcome Message */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                স্বাগতম বার্তা (Welcome Message)
              </label>
              <input
                type="text"
                value={formData.welcomeMessage}
                onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                placeholder="যেমন: আসসালামু আলাইকুম, আপনাকে স্বাগতম"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Footer Text */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                ফুটার কপিরাইট টেক্সট (Footer Text)
              </label>
              <input
                type="text"
                value={formData.footerText}
                onChange={(e) => handleInputChange('footerText', e.target.value)}
                placeholder="যেমন: © আশেকানে গাউছিয়া। সর্বস্বত্ব সংরক্ষিত।"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Organization Logo */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            ২. সংগঠনের লোগো (Organization Logo)
          </h4>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Logo Preview */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-stone-900 border-2 border-emerald-500/40 p-1 flex items-center justify-center shadow-md overflow-hidden">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo Preview"
                      className="w-full h-full object-contain"
                      onError={() => {
                        handleInputChange('logoUrl', '');
                        setSaveErrorMsg('প্রদত্ত লোগো URL থেকে ছবি লোড করা যায়নি। সঠিক ইমেজ লিংক দিন।');
                      }}
                    />
                  ) : (
                    <IslamicDomeLogo className="w-full h-full object-contain" />
                  )}
                </div>
                <span className="text-[11px] text-stone-500 mt-1 font-medium">
                  {formData.logoUrl ? 'কাস্টম লোগো' : 'ডিফল্ট গম্বুজ আইকন'}
                </span>
              </div>

              {/* Logo Controls */}
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    লোগো ইমেজ লিঙ্ক (Image URL):
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.logoUrl || ''}
                      onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full pl-9 pr-20 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                    <LinkIcon className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('logoUrl', '')}
                        className="absolute right-2 top-1.5 px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        রিমুভ
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    সরাসরি যেকোনো নির্ভরযোগ্য পাবলিক ইমেজ লিংক দিন (PNG/JPG/SVG/WebP)
                  </p>
                </div>

                {/* Optional File Upload to Supabase Storage */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingLogo ? 'আপলোড হচ্ছে...' : 'ডিভাইস থেকে আপলোড করুন'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                  </label>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleInputChange('logoUrl', '')}
                      className="text-xs text-stone-500 hover:text-rose-600 transition"
                    >
                      ডিফল্ট ইসলামিক লোগোতে ফিরে যান
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Predefined Themes */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
            <Sliders className="w-4 h-4 text-emerald-700" />
            ৩. প্রিডিফাইন থিম নির্বাচন (Predefined Themes)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEME_PRESETS.map((preset) => {
              const isSelected = formData.themeId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectTheme(preset.id)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-md bg-gradient-to-br ${preset.previewGradient} shadow-xs border border-white/20`}
                      />
                      <span className="font-bold text-xs sm:text-sm text-stone-900">
                        {preset.name}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: Accent Color & Header Style */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
            <Palette className="w-4 h-4 text-emerald-700" />
            ৪. অ্যাকসেন্ট কালার ও হেডার স্টাইল
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Accent Color */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-stone-700">
                মূল অ্যাকসেন্ট কালার (Accent Color):
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => handleInputChange('accentColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-stone-300 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={formData.accentColor}
                  onChange={(e) => handleInputChange('accentColor', e.target.value)}
                  placeholder="#047857"
                  className="w-28 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono font-semibold text-stone-900 uppercase"
                />
                <div
                  className="w-7 h-7 rounded-full shadow-inner border border-stone-200"
                  style={{ backgroundColor: formData.accentColor }}
                />
              </div>

              {/* Swatches */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_ACCENT_COLORS.map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onClick={() => handleInputChange('accentColor', item.color)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border border-stone-200 hover:border-stone-400 bg-white cursor-pointer transition"
                    title={item.name}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Header Style */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-stone-700">
                হেডার স্টাইল (Header Style):
              </label>
              <div className="space-y-1.5">
                {HEADER_STYLES.map((hStyle) => (
                  <label
                    key={hStyle.id}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition ${
                      formData.headerStyle === hStyle.id
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="headerStyle"
                      value={hStyle.id}
                      checked={formData.headerStyle === hStyle.id}
                      onChange={() => handleInputChange('headerStyle', hStyle.id)}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-semibold text-xs text-stone-900 block">
                        {hStyle.label}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {hStyle.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Live Preview */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-700" />
              পাবলিক ভিউ লাইভ প্রিভিউ (Real Preview)
            </h4>

            {/* Preview switcher tabs */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActivePreviewTab('entry')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  activePreviewTab === 'entry'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                প্রবেশদ্বার (Welcome Screen)
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('dashboard')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  activePreviewTab === 'dashboard'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                ড্যাশবোর্ড হেডার (Dashboard Header)
              </button>
            </div>
          </div>

          <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
            <span>প্রিভিউতে কোনো কাল্পনিক হিসাব নেই; সরাসরি আসল পাবলিক তথ্যের রূপরেখা প্রদর্শিত হচ্ছে।</span>
          </div>

          {/* PREVIEW CONTAINER */}
          <div className="rounded-2xl overflow-hidden border border-stone-300 shadow-inner bg-stone-950 p-4 sm:p-6 transition-all">
            {activePreviewTab === 'entry' ? (
              /* Entry Page Preview */
              <div className={`rounded-xl p-6 ${previewStyles.entryBgClass} text-stone-100 flex flex-col items-center justify-center max-w-sm mx-auto shadow-xl`}>
                {/* Brand Logo & Name */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-black border-2 border-emerald-500/40 p-1 mb-3 shadow-lg overflow-hidden">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <IslamicDomeLogo className="w-full h-full object-contain" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {formData.orgName || 'সংগঠনের নাম'}
                  </h3>
                  <p className="text-xs text-emerald-300/90 mt-1 font-medium">
                    {formData.subtitle || 'হাদিয়া, মাহফিল ও আয়-ব্যয়ের হিসাব'}
                  </p>
                </div>

                {/* Entry Card Mockup */}
                <div className={`w-full bg-stone-900/90 rounded-xl border ${previewStyles.entryCardBorderClass} p-4 space-y-3`}>
                  <label className="block text-xs font-medium text-stone-300">
                    {formData.welcomeMessage || 'স্বাগতম! আপনার পরিচয় দিন:'}
                  </label>
                  <div className="w-full h-9 px-3 bg-stone-950/70 border border-stone-700 rounded-lg text-xs text-stone-400 flex items-center">
                    সম্মানিত অতিথি
                  </div>
                  <div
                    className={`w-full h-9 ${previewStyles.primaryButtonClass} text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-md`}
                    style={{ backgroundColor: formData.accentColor }}
                  >
                    <span>প্রবেশ করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center text-[10px] text-stone-400">
                  {formData.footerText || '© আশেকানে গাউছিয়া। সর্বস্বত্ব সংরক্ষিত।'}
                </div>
              </div>
            ) : (
              /* Dashboard Header Preview */
              <div className="space-y-4">
                {/* Header Banner */}
                <div className={`rounded-xl p-5 ${previewStyles.headerContainerClass}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/20 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                        {formData.logoUrl ? (
                          <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <IslamicDomeLogo className="w-full h-full object-contain" />
                        )}
                      </div>
                      <div>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${previewStyles.badgeClass} mb-1`}>
                          <span>পাবলিক আর্থিক খতিয়ান</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold">
                          {formData.orgName} আর্থিক বিবরণী
                        </h3>
                        <p className="text-xs text-white/80 mt-0.5">
                          {formData.subtitle || 'সংগঠনের সকল দান, মাহফিল ফান্ড ও ব্যয়ের সামগ্রিক হিসাব ও স্বচ্ছ বিবরণী।'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real Data Highlight Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg text-stone-100">
                    <span className="text-[10px] text-stone-400 block">মোট সদস্য সংখ্যা</span>
                    <span className="text-sm font-bold text-white">
                      {liveSummary ? toBengaliNumber(liveSummary.member_count) : '০'} জন
                    </span>
                  </div>
                  <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg text-stone-100">
                    <span className="text-[10px] text-stone-400 block">চলতি বছরের আয়</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {liveSummary ? formatCurrency(liveSummary.current_year?.income ?? 0) : '০ ৳'}
                    </span>
                  </div>
                  <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg text-stone-100">
                    <span className="text-[10px] text-stone-400 block">চলতি বছরের ব্যয়</span>
                    <span className="text-sm font-bold text-rose-400">
                      {liveSummary ? formatCurrency(liveSummary.current_year?.expense ?? 0) : '০ ৳'}
                    </span>
                  </div>
                  <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg text-stone-100">
                    <span className="text-[10px] text-stone-400 block">বর্তমান অবশিষ্ট ফান্ড</span>
                    <span className="text-sm font-bold text-teal-300">
                      {liveSummary ? formatCurrency(liveSummary.current_year?.balance ?? 0) : '০ ৳'}
                    </span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-stone-400 pt-1">
                  {formData.footerText}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            * থিম পরিবর্তন শুধুমাত্র পাবলিক ভিউতে কার্যকর হবে। অ্যাডমিন ও ক্যাশিয়ার ড্যাশবোর্ড অপরিবর্তিত থাকবে।
          </p>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>সংরক্ষণ করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
