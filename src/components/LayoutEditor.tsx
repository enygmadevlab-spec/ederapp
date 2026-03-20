"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Save } from 'lucide-react';
import { HomePageRenderer } from '@/components/HomePageRenderer';
import { DEFAULT_SERVICES } from '@/lib/defaultServices';
import { createDefaultLayout, hexToRgb, mergeLayoutWithDefaults } from '@/lib/defaultLayout';
import { HomePageLayoutSettings, LayoutEditConfig, ServiceProduct } from '@/types';

interface LayoutEditorProps {
  initialLayout?: LayoutEditConfig;
  previewServices?: ServiceProduct[];
  onSave?: (layout: LayoutEditConfig) => Promise<void> | void;
}

function EditorSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-sky-500/20 bg-slate-950/80 p-5 shadow-[0_12px_40px_rgba(2,12,27,0.35)]">
      <div className="mb-4">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-200">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-sky-500/20 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:bg-white/10"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-200">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-sky-500/20 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:bg-white/10"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-200">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-2xl border border-sky-500/20 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:bg-white/10"
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}) {
  const isHexColor = /^#([0-9a-f]{6})$/i.test(value.trim());

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-200">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 rounded-2xl border border-sky-500/20 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:bg-white/10"
        />
        <input
          type="color"
          value={isHexColor ? value : '#020c1b'}
          onChange={(event) => onChange(event.target.value)}
          disabled={!isHexColor}
          className="h-11 w-14 rounded-xl border border-sky-500/20 bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      {helperText ? <p className="mt-2 text-xs text-slate-500">{helperText}</p> : null}
    </label>
  );
}

export function LayoutEditor({ initialLayout, previewServices, onSave }: LayoutEditorProps) {
  const normalizedInitialLayout = useMemo(
    () => mergeLayoutWithDefaults(initialLayout),
    [initialLayout]
  );
  const [draft, setDraft] = useState<LayoutEditConfig>(normalizedInitialLayout);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraft(normalizedInitialLayout);
    setStatusMessage(null);
  }, [normalizedInitialLayout]);

  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(normalizedInitialLayout);
  const servicesForPreview = previewServices && previewServices.length > 0 ? previewServices : DEFAULT_SERVICES;

  const updateRootField = <K extends keyof LayoutEditConfig>(field: K, value: LayoutEditConfig[K]) => {
    setDraft((current) => mergeLayoutWithDefaults({ ...current, [field]: value }));
    setStatusMessage(null);
  };

  const updateHomepageSection = <Section extends keyof HomePageLayoutSettings>(
    section: Section,
    values: Partial<HomePageLayoutSettings[Section]>
  ) => {
    setDraft((current) =>
      mergeLayoutWithDefaults({
        ...current,
        homepage: {
          ...current.homepage,
          [section]: {
            ...current.homepage[section],
            ...values,
          },
        },
      })
    );
    setStatusMessage(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMessage(null);

      const nextLayout = mergeLayoutWithDefaults({
        ...draft,
        backgroundColor: hexToRgb(draft.homepage.theme.pageBackground),
        updatedAt: new Date().toISOString(),
      });

      await onSave?.(nextLayout);
      setDraft(nextLayout);
      setStatusMessage('Layout salvo e pronto para uso na home.');
    } catch (error) {
      console.error('Erro ao salvar layout no editor:', error);
      setStatusMessage('Não foi possível salvar. Revise os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = () => {
    const defaultLayout = createDefaultLayout();
    setDraft(
      mergeLayoutWithDefaults({
        ...defaultLayout,
        id: draft.id,
        createdAt: draft.createdAt,
        createdBy: draft.createdBy,
      })
    );
    setStatusMessage('Valores padrão carregados localmente. Salve para publicar.');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[420px,minmax(0,1fr)]">
      <div className="space-y-5 xl:sticky xl:top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
        <section className="rounded-[32px] border border-sky-500/20 bg-gradient-to-br from-slate-950 to-[#041225] p-6 shadow-[0_18px_60px_rgba(2,12,27,0.45)]">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Layout Profissional</p>
            <h2 className="mt-3 text-2xl font-black text-white">Editor da Página Inicial</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Este preview usa o mesmo componente da home publicada. Tudo o que você alterar aqui aparece
              igual no site ao salvar.
            </p>
          </div>

          <div className="space-y-4">
            <TextField
              label="Nome interno do layout"
              value={draft.name}
              onChange={(value) => updateRootField('name', value)}
            />
            <TextAreaField
              label="Descrição"
              value={draft.description}
              onChange={(value) => updateRootField('description', value)}
              rows={3}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/30 bg-white/5 px-5 py-3 text-sm font-semibold text-sky-200 transition hover:bg-white/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Restaurar padrão
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-sky-500/15 bg-black/20 px-4 py-3 text-sm">
            <p className={hasUnsavedChanges ? 'text-amber-300' : 'text-emerald-300'}>
              {hasUnsavedChanges ? 'Existem mudanças locais pendentes.' : 'Preview sincronizado com a última base carregada.'}
            </p>
            {statusMessage ? <p className="mt-2 text-slate-300">{statusMessage}</p> : null}
          </div>
        </section>

        <EditorSection
          title="Hero e Links"
          description="Texto principal, ações e imagem de fundo do topo da home."
        >
          <TextField
            label="Imagem de fundo (URL)"
            value={draft.homepage.hero.backgroundImageUrl}
            onChange={(value) => updateHomepageSection('hero', { backgroundImageUrl: value })}
          />
          <TextField
            label="Selo superior"
            value={draft.homepage.hero.badgeText}
            onChange={(value) => updateHomepageSection('hero', { badgeText: value })}
          />
          <TextField
            label="Título antes do destaque"
            value={draft.homepage.hero.titlePrefix}
            onChange={(value) => updateHomepageSection('hero', { titlePrefix: value })}
          />
          <TextField
            label="Destaque principal"
            value={draft.homepage.hero.titlePrimaryHighlight}
            onChange={(value) => updateHomepageSection('hero', { titlePrimaryHighlight: value })}
          />
          <TextField
            label="Texto entre destaques"
            value={draft.homepage.hero.titleMiddle}
            onChange={(value) => updateHomepageSection('hero', { titleMiddle: value })}
          />
          <TextField
            label="Segundo destaque"
            value={draft.homepage.hero.titleSecondaryHighlight}
            onChange={(value) => updateHomepageSection('hero', { titleSecondaryHighlight: value })}
          />
          <TextField
            label="Final do título"
            value={draft.homepage.hero.titleSuffix}
            onChange={(value) => updateHomepageSection('hero', { titleSuffix: value })}
          />
          <TextAreaField
            label="Descrição do hero"
            value={draft.homepage.hero.description}
            onChange={(value) => updateHomepageSection('hero', { description: value })}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              label="Texto do botão principal"
              value={draft.homepage.hero.primaryButtonText}
              onChange={(value) => updateHomepageSection('hero', { primaryButtonText: value })}
            />
            <TextField
              label="Link do botão principal"
              value={draft.homepage.hero.primaryButtonHref}
              onChange={(value) => updateHomepageSection('hero', { primaryButtonHref: value })}
            />
            <TextField
              label="Texto do botão secundário"
              value={draft.homepage.hero.secondaryButtonText}
              onChange={(value) => updateHomepageSection('hero', { secondaryButtonText: value })}
            />
            <TextField
              label="Link do botão secundário"
              value={draft.homepage.hero.secondaryButtonHref}
              onChange={(value) => updateHomepageSection('hero', { secondaryButtonHref: value })}
            />
          </div>
        </EditorSection>

        <EditorSection
          title="Catálogo"
          description="Textos do bloco de serviços e microcopys dos cards."
        >
          <TextField
            label="Sobretítulo da seção"
            value={draft.homepage.services.eyebrowText}
            onChange={(value) => updateHomepageSection('services', { eyebrowText: value })}
          />
          <TextField
            label="Título da seção"
            value={draft.homepage.services.title}
            onChange={(value) => updateHomepageSection('services', { title: value })}
          />
          <TextAreaField
            label="Descrição da seção"
            value={draft.homepage.services.description}
            onChange={(value) => updateHomepageSection('services', { description: value })}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              label="Badge do card"
              value={draft.homepage.services.highlightBadgeText}
              onChange={(value) => updateHomepageSection('services', { highlightBadgeText: value })}
            />
            <TextField
              label="Botão secundário"
              value={draft.homepage.services.detailsButtonText}
              onChange={(value) => updateHomepageSection('services', { detailsButtonText: value })}
            />
            <TextField
              label="Botão principal"
              value={draft.homepage.services.addButtonText}
              onChange={(value) => updateHomepageSection('services', { addButtonText: value })}
            />
            <TextField
              label="Rótulo do preço"
              value={draft.homepage.services.priceLabel}
              onChange={(value) => updateHomepageSection('services', { priceLabel: value })}
            />
            <TextField
              label="Texto de documentos"
              value={draft.homepage.services.documentsLabel}
              onChange={(value) => updateHomepageSection('services', { documentsLabel: value })}
            />
            <TextField
              label="Texto de documentos adicionais"
              value={draft.homepage.services.additionalDocumentsLabel}
              onChange={(value) => updateHomepageSection('services', { additionalDocumentsLabel: value })}
            />
          </div>
        </EditorSection>

        <EditorSection
          title="CTA Final"
          description="Chamada de fechamento e bloco de contato da página."
        >
          <TextField
            label="Título do CTA"
            value={draft.homepage.cta.title}
            onChange={(value) => updateHomepageSection('cta', { title: value })}
          />
          <TextAreaField
            label="Descrição do CTA"
            value={draft.homepage.cta.description}
            onChange={(value) => updateHomepageSection('cta', { description: value })}
          />
          <TextField
            label="Rótulo do contato"
            value={draft.homepage.cta.contactLabel}
            onChange={(value) => updateHomepageSection('cta', { contactLabel: value })}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              label="Telefone"
              value={draft.homepage.cta.phoneNumber}
              onChange={(value) => updateHomepageSection('cta', { phoneNumber: value })}
            />
            <TextField
              label="Horário"
              value={draft.homepage.cta.workingHours}
              onChange={(value) => updateHomepageSection('cta', { workingHours: value })}
            />
            <TextField
              label="Texto do botão"
              value={draft.homepage.cta.buttonText}
              onChange={(value) => updateHomepageSection('cta', { buttonText: value })}
            />
            <TextField
              label="Link do botão"
              value={draft.homepage.cta.buttonHref}
              onChange={(value) => updateHomepageSection('cta', { buttonHref: value })}
            />
          </div>
        </EditorSection>

        <EditorSection
          title="Cores do Hero"
          description="Paleta principal do topo da página e dos botões iniciais."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ColorField
              label="Fundo geral da página"
              value={draft.homepage.theme.pageBackground}
              onChange={(value) => updateHomepageSection('theme', { pageBackground: value })}
            />
            <ColorField
              label="Texto do título"
              value={draft.homepage.theme.heroTitleText}
              onChange={(value) => updateHomepageSection('theme', { heroTitleText: value })}
            />
            <ColorField
              label="Overlay superior"
              value={draft.homepage.theme.heroOverlayFrom}
              onChange={(value) => updateHomepageSection('theme', { heroOverlayFrom: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Overlay intermediário"
              value={draft.homepage.theme.heroOverlayVia}
              onChange={(value) => updateHomepageSection('theme', { heroOverlayVia: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Overlay final"
              value={draft.homepage.theme.heroOverlayTo}
              onChange={(value) => updateHomepageSection('theme', { heroOverlayTo: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Cor 1 do destaque"
              value={draft.homepage.theme.heroAccentFrom}
              onChange={(value) => updateHomepageSection('theme', { heroAccentFrom: value })}
            />
            <ColorField
              label="Cor 2 do destaque"
              value={draft.homepage.theme.heroAccentTo}
              onChange={(value) => updateHomepageSection('theme', { heroAccentTo: value })}
            />
            <ColorField
              label="Texto da descrição"
              value={draft.homepage.theme.heroDescriptionText}
              onChange={(value) => updateHomepageSection('theme', { heroDescriptionText: value })}
            />
            <ColorField
              label="Fundo do selo"
              value={draft.homepage.theme.heroBadgeBackground}
              onChange={(value) => updateHomepageSection('theme', { heroBadgeBackground: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Borda do selo"
              value={draft.homepage.theme.heroBadgeBorder}
              onChange={(value) => updateHomepageSection('theme', { heroBadgeBorder: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Texto do selo"
              value={draft.homepage.theme.heroBadgeText}
              onChange={(value) => updateHomepageSection('theme', { heroBadgeText: value })}
            />
            <ColorField
              label="Botão principal - início"
              value={draft.homepage.theme.heroPrimaryButtonFrom}
              onChange={(value) => updateHomepageSection('theme', { heroPrimaryButtonFrom: value })}
            />
            <ColorField
              label="Botão principal - fim"
              value={draft.homepage.theme.heroPrimaryButtonTo}
              onChange={(value) => updateHomepageSection('theme', { heroPrimaryButtonTo: value })}
            />
            <ColorField
              label="Botão principal - texto"
              value={draft.homepage.theme.heroPrimaryButtonText}
              onChange={(value) => updateHomepageSection('theme', { heroPrimaryButtonText: value })}
            />
            <ColorField
              label="Botão secundário - fundo"
              value={draft.homepage.theme.heroSecondaryButtonBackground}
              onChange={(value) => updateHomepageSection('theme', { heroSecondaryButtonBackground: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Botão secundário - borda"
              value={draft.homepage.theme.heroSecondaryButtonBorder}
              onChange={(value) => updateHomepageSection('theme', { heroSecondaryButtonBorder: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Botão secundário - texto"
              value={draft.homepage.theme.heroSecondaryButtonText}
              onChange={(value) => updateHomepageSection('theme', { heroSecondaryButtonText: value })}
            />
          </div>
        </EditorSection>

        <EditorSection
          title="Cores do Catálogo"
          description="Controle dos cards, navegação do carrossel e textos da seção."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ColorField
              label="Brilho superior da seção"
              value={draft.homepage.theme.sectionGlowTop}
              onChange={(value) => updateHomepageSection('theme', { sectionGlowTop: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Brilho inferior da seção"
              value={draft.homepage.theme.sectionGlowBottom}
              onChange={(value) => updateHomepageSection('theme', { sectionGlowBottom: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Sobretítulo"
              value={draft.homepage.theme.sectionEyebrowText}
              onChange={(value) => updateHomepageSection('theme', { sectionEyebrowText: value })}
            />
            <ColorField
              label="Título da seção"
              value={draft.homepage.theme.sectionTitleText}
              onChange={(value) => updateHomepageSection('theme', { sectionTitleText: value })}
            />
            <ColorField
              label="Divisor - início"
              value={draft.homepage.theme.sectionDividerFrom}
              onChange={(value) => updateHomepageSection('theme', { sectionDividerFrom: value })}
            />
            <ColorField
              label="Divisor - fim"
              value={draft.homepage.theme.sectionDividerTo}
              onChange={(value) => updateHomepageSection('theme', { sectionDividerTo: value })}
            />
            <ColorField
              label="Descrição da seção"
              value={draft.homepage.theme.sectionDescriptionText}
              onChange={(value) => updateHomepageSection('theme', { sectionDescriptionText: value })}
            />
            <ColorField
              label="Controle do slider - fundo"
              value={draft.homepage.theme.sliderControlBackground}
              onChange={(value) => updateHomepageSection('theme', { sliderControlBackground: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Controle do slider - borda"
              value={draft.homepage.theme.sliderControlBorder}
              onChange={(value) => updateHomepageSection('theme', { sliderControlBorder: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Controle do slider - ícone"
              value={draft.homepage.theme.sliderControlIcon}
              onChange={(value) => updateHomepageSection('theme', { sliderControlIcon: value })}
            />
            <ColorField
              label="Dot ativo"
              value={draft.homepage.theme.sliderDotActive}
              onChange={(value) => updateHomepageSection('theme', { sliderDotActive: value })}
            />
            <ColorField
              label="Dot inativo"
              value={draft.homepage.theme.sliderDotInactive}
              onChange={(value) => updateHomepageSection('theme', { sliderDotInactive: value })}
            />
            <ColorField
              label="Card - fundo"
              value={draft.homepage.theme.cardBackground}
              onChange={(value) => updateHomepageSection('theme', { cardBackground: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Card - borda"
              value={draft.homepage.theme.cardBorder}
              onChange={(value) => updateHomepageSection('theme', { cardBorder: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Overlay da imagem"
              value={draft.homepage.theme.cardImageOverlay}
              onChange={(value) => updateHomepageSection('theme', { cardImageOverlay: value })}
            />
            <ColorField
              label="Badge do card - fundo"
              value={draft.homepage.theme.cardBadgeBackground}
              onChange={(value) => updateHomepageSection('theme', { cardBadgeBackground: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Badge do card - texto"
              value={draft.homepage.theme.cardBadgeText}
              onChange={(value) => updateHomepageSection('theme', { cardBadgeText: value })}
            />
            <ColorField
              label="Título do card"
              value={draft.homepage.theme.cardTitleText}
              onChange={(value) => updateHomepageSection('theme', { cardTitleText: value })}
            />
            <ColorField
              label="Descrição do card"
              value={draft.homepage.theme.cardDescriptionText}
              onChange={(value) => updateHomepageSection('theme', { cardDescriptionText: value })}
            />
            <ColorField
              label="Metadados do preço"
              value={draft.homepage.theme.cardMetaText}
              onChange={(value) => updateHomepageSection('theme', { cardMetaText: value })}
            />
            <ColorField
              label="Preço"
              value={draft.homepage.theme.cardPriceText}
              onChange={(value) => updateHomepageSection('theme', { cardPriceText: value })}
            />
            <ColorField
              label="Painel de documentos - fundo"
              value={draft.homepage.theme.cardDocsPanelBackground}
              onChange={(value) => updateHomepageSection('theme', { cardDocsPanelBackground: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Painel de documentos - borda"
              value={draft.homepage.theme.cardDocsPanelBorder}
              onChange={(value) => updateHomepageSection('theme', { cardDocsPanelBorder: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Painel de documentos - texto"
              value={draft.homepage.theme.cardDocsPanelText}
              onChange={(value) => updateHomepageSection('theme', { cardDocsPanelText: value })}
            />
            <ColorField
              label="Painel de documentos - destaque"
              value={draft.homepage.theme.cardDocsPanelAccent}
              onChange={(value) => updateHomepageSection('theme', { cardDocsPanelAccent: value })}
            />
            <ColorField
              label="Botão secundário - fundo"
              value={draft.homepage.theme.cardSecondaryButtonBackground}
              onChange={(value) => updateHomepageSection('theme', { cardSecondaryButtonBackground: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Botão secundário - borda"
              value={draft.homepage.theme.cardSecondaryButtonBorder}
              onChange={(value) => updateHomepageSection('theme', { cardSecondaryButtonBorder: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Botão secundário - texto"
              value={draft.homepage.theme.cardSecondaryButtonText}
              onChange={(value) => updateHomepageSection('theme', { cardSecondaryButtonText: value })}
            />
            <ColorField
              label="Botão principal - início"
              value={draft.homepage.theme.cardPrimaryButtonFrom}
              onChange={(value) => updateHomepageSection('theme', { cardPrimaryButtonFrom: value })}
            />
            <ColorField
              label="Botão principal - fim"
              value={draft.homepage.theme.cardPrimaryButtonTo}
              onChange={(value) => updateHomepageSection('theme', { cardPrimaryButtonTo: value })}
            />
            <ColorField
              label="Botão principal - texto"
              value={draft.homepage.theme.cardPrimaryButtonText}
              onChange={(value) => updateHomepageSection('theme', { cardPrimaryButtonText: value })}
            />
          </div>
        </EditorSection>

        <EditorSection
          title="Cores do CTA"
          description="Paleta do bloco final e da caixa de contato."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ColorField
              label="Brilho do CTA"
              value={draft.homepage.theme.ctaGlow}
              onChange={(value) => updateHomepageSection('theme', { ctaGlow: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Título do CTA"
              value={draft.homepage.theme.ctaTitleText}
              onChange={(value) => updateHomepageSection('theme', { ctaTitleText: value })}
            />
            <ColorField
              label="Descrição do CTA"
              value={draft.homepage.theme.ctaDescriptionText}
              onChange={(value) => updateHomepageSection('theme', { ctaDescriptionText: value })}
            />
            <ColorField
              label="Contato - fundo"
              value={draft.homepage.theme.ctaContactBackground}
              onChange={(value) => updateHomepageSection('theme', { ctaContactBackground: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Contato - borda"
              value={draft.homepage.theme.ctaContactBorder}
              onChange={(value) => updateHomepageSection('theme', { ctaContactBorder: value })}
              helperText="Aceita hex ou rgba."
            />
            <ColorField
              label="Contato - rótulo"
              value={draft.homepage.theme.ctaContactLabelText}
              onChange={(value) => updateHomepageSection('theme', { ctaContactLabelText: value })}
            />
            <ColorField
              label="Contato - telefone"
              value={draft.homepage.theme.ctaPhoneText}
              onChange={(value) => updateHomepageSection('theme', { ctaPhoneText: value })}
            />
            <ColorField
              label="Contato - horário"
              value={draft.homepage.theme.ctaHoursText}
              onChange={(value) => updateHomepageSection('theme', { ctaHoursText: value })}
            />
            <ColorField
              label="Botão final - início"
              value={draft.homepage.theme.ctaButtonFrom}
              onChange={(value) => updateHomepageSection('theme', { ctaButtonFrom: value })}
            />
            <ColorField
              label="Botão final - fim"
              value={draft.homepage.theme.ctaButtonTo}
              onChange={(value) => updateHomepageSection('theme', { ctaButtonTo: value })}
            />
            <ColorField
              label="Botão final - texto"
              value={draft.homepage.theme.ctaButtonText}
              onChange={(value) => updateHomepageSection('theme', { ctaButtonText: value })}
            />
          </div>
        </EditorSection>

        <EditorSection
          title="Tipografia e Tamanhos"
          description="Ajuste os tamanhos dos textos principais para refinar o visual."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <NumberField
              label="Hero - badge"
              value={draft.homepage.typography.heroBadgeSize}
              min={10}
              max={32}
              onChange={(value) => updateHomepageSection('typography', { heroBadgeSize: value })}
            />
            <NumberField
              label="Hero - descrição"
              value={draft.homepage.typography.heroDescriptionSize}
              min={14}
              max={40}
              onChange={(value) => updateHomepageSection('typography', { heroDescriptionSize: value })}
            />
            <NumberField
              label="Hero - título mobile"
              value={draft.homepage.typography.heroTitleMobile}
              min={28}
              max={90}
              onChange={(value) => updateHomepageSection('typography', { heroTitleMobile: value })}
            />
            <NumberField
              label="Hero - título desktop"
              value={draft.homepage.typography.heroTitleDesktop}
              min={40}
              max={140}
              onChange={(value) => updateHomepageSection('typography', { heroTitleDesktop: value })}
            />
            <NumberField
              label="Hero - botões"
              value={draft.homepage.typography.heroButtonSize}
              min={12}
              max={28}
              onChange={(value) => updateHomepageSection('typography', { heroButtonSize: value })}
            />
            <NumberField
              label="Catálogo - sobretítulo"
              value={draft.homepage.typography.sectionEyebrowSize}
              min={10}
              max={24}
              onChange={(value) => updateHomepageSection('typography', { sectionEyebrowSize: value })}
            />
            <NumberField
              label="Catálogo - título mobile"
              value={draft.homepage.typography.sectionTitleMobile}
              min={24}
              max={72}
              onChange={(value) => updateHomepageSection('typography', { sectionTitleMobile: value })}
            />
            <NumberField
              label="Catálogo - título desktop"
              value={draft.homepage.typography.sectionTitleDesktop}
              min={32}
              max={96}
              onChange={(value) => updateHomepageSection('typography', { sectionTitleDesktop: value })}
            />
            <NumberField
              label="Catálogo - descrição"
              value={draft.homepage.typography.sectionDescriptionSize}
              min={14}
              max={36}
              onChange={(value) => updateHomepageSection('typography', { sectionDescriptionSize: value })}
            />
            <NumberField
              label="Card - badge"
              value={draft.homepage.typography.cardBadgeSize}
              min={10}
              max={24}
              onChange={(value) => updateHomepageSection('typography', { cardBadgeSize: value })}
            />
            <NumberField
              label="Card - título"
              value={draft.homepage.typography.cardTitleSize}
              min={16}
              max={40}
              onChange={(value) => updateHomepageSection('typography', { cardTitleSize: value })}
            />
            <NumberField
              label="Card - descrição"
              value={draft.homepage.typography.cardDescriptionSize}
              min={12}
              max={24}
              onChange={(value) => updateHomepageSection('typography', { cardDescriptionSize: value })}
            />
            <NumberField
              label="Card - meta"
              value={draft.homepage.typography.cardMetaSize}
              min={10}
              max={20}
              onChange={(value) => updateHomepageSection('typography', { cardMetaSize: value })}
            />
            <NumberField
              label="Card - preço"
              value={draft.homepage.typography.cardPriceSize}
              min={18}
              max={44}
              onChange={(value) => updateHomepageSection('typography', { cardPriceSize: value })}
            />
            <NumberField
              label="Card - botões"
              value={draft.homepage.typography.cardButtonSize}
              min={12}
              max={24}
              onChange={(value) => updateHomepageSection('typography', { cardButtonSize: value })}
            />
            <NumberField
              label="CTA - título mobile"
              value={draft.homepage.typography.ctaTitleMobile}
              min={24}
              max={72}
              onChange={(value) => updateHomepageSection('typography', { ctaTitleMobile: value })}
            />
            <NumberField
              label="CTA - título desktop"
              value={draft.homepage.typography.ctaTitleDesktop}
              min={32}
              max={96}
              onChange={(value) => updateHomepageSection('typography', { ctaTitleDesktop: value })}
            />
            <NumberField
              label="CTA - descrição"
              value={draft.homepage.typography.ctaDescriptionSize}
              min={14}
              max={36}
              onChange={(value) => updateHomepageSection('typography', { ctaDescriptionSize: value })}
            />
            <NumberField
              label="CTA - rótulo"
              value={draft.homepage.typography.ctaContactLabelSize}
              min={10}
              max={22}
              onChange={(value) => updateHomepageSection('typography', { ctaContactLabelSize: value })}
            />
            <NumberField
              label="CTA - telefone"
              value={draft.homepage.typography.ctaPhoneSize}
              min={18}
              max={56}
              onChange={(value) => updateHomepageSection('typography', { ctaPhoneSize: value })}
            />
            <NumberField
              label="CTA - horário"
              value={draft.homepage.typography.ctaHoursSize}
              min={10}
              max={20}
              onChange={(value) => updateHomepageSection('typography', { ctaHoursSize: value })}
            />
            <NumberField
              label="CTA - botão"
              value={draft.homepage.typography.ctaButtonSize}
              min={12}
              max={28}
              onChange={(value) => updateHomepageSection('typography', { ctaButtonSize: value })}
            />
          </div>
        </EditorSection>
      </div>

      <div className="space-y-4">
        <div className="rounded-[28px] border border-sky-500/20 bg-slate-950/80 p-5">
          <h3 className="text-lg font-bold text-white">Preview em Tempo Real</h3>
          <p className="mt-1 text-sm text-slate-400">
            Render desktop completo. O site público usa esta mesma estrutura visual e estes mesmos dados.
          </p>
        </div>

        <div className="rounded-[32px] border border-sky-500/20 bg-slate-950/70 p-4 shadow-[0_18px_60px_rgba(2,12,27,0.45)]">
          <div className="overflow-auto rounded-[28px] border border-white/5 bg-black/30">
            <div className="min-w-[1320px]">
              <HomePageRenderer layout={draft} services={servicesForPreview} previewMode />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
