"use client";

import React, { CSSProperties, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Plus,
  Star,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { LayoutEditConfig, ServiceProduct } from '@/types';

interface HomePageRendererProps {
  layout: LayoutEditConfig;
  services: ServiceProduct[];
  previewMode?: boolean;
  onAddToCart?: (service: ServiceProduct) => void;
}

export function HomePageRenderer({
  layout,
  services,
  previewMode = false,
  onAddToCart,
}: HomePageRendererProps) {
  const [activeSlide, setActiveSlide] = useState(services.length > 1 ? 1 : 0);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const { theme: appTheme } = useTheme();

  const config = layout.homepage;
  const { hero, services: servicesSection, cta, theme: baseTheme, typography } = config;
  const theme =
    appTheme === 'light'
      ? {
          ...baseTheme,
          pageBackground: '#eef2f6',
          heroOverlayFrom: 'rgba(238, 242, 246, 0.35)',
          heroOverlayVia: 'rgba(238, 242, 246, 0.78)',
          heroOverlayTo: '#eef2f6',
          heroAccentFrom: '#0c5fa5',
          heroAccentTo: '#1887c9',
          heroBadgeBackground: 'rgba(255, 255, 255, 0.92)',
          heroBadgeBorder: 'rgba(16, 47, 72, 0.12)',
          heroBadgeText: '#0c5fa5',
          heroTitleText: '#102f48',
          heroDescriptionText: '#23435f',
          heroPrimaryButtonFrom: '#0c5fa5',
          heroPrimaryButtonTo: '#1887c9',
          heroPrimaryButtonText: '#ffffff',
          heroSecondaryButtonBackground: 'rgba(255, 255, 255, 0.9)',
          heroSecondaryButtonBorder: 'rgba(16, 47, 72, 0.12)',
          heroSecondaryButtonText: '#102f48',
          sectionGlowTop: 'rgba(12, 95, 165, 0.10)',
          sectionGlowBottom: 'rgba(24, 135, 201, 0.08)',
          sectionEyebrowText: '#0c5fa5',
          sectionTitleText: '#102f48',
          sectionDividerFrom: '#0c5fa5',
          sectionDividerTo: '#1887c9',
          sectionDescriptionText: '#4c6376',
          sliderControlBackground: 'rgba(255, 255, 255, 0.92)',
          sliderControlBorder: 'rgba(16, 47, 72, 0.12)',
          sliderControlIcon: '#102f48',
          sliderDotActive: '#0c5fa5',
          sliderDotInactive: '#b8c5d0',
          cardBackground: 'rgba(255, 255, 255, 0.94)',
          cardBorder: 'rgba(16, 47, 72, 0.10)',
          cardImageOverlay: 'rgba(16, 47, 72, 0.78)',
          cardBadgeBackground: '#0c5fa5',
          cardBadgeText: '#ffffff',
          cardTitleText: '#102f48',
          cardDescriptionText: '#4c6376',
          cardMetaText: '#698092',
          cardPriceText: '#0c5fa5',
          cardDocsPanelBackground: '#f7f9fb',
          cardDocsPanelBorder: 'rgba(16, 47, 72, 0.10)',
          cardDocsPanelText: '#53697c',
          cardDocsPanelAccent: '#0c5fa5',
          cardSecondaryButtonBackground: '#ffffff',
          cardSecondaryButtonBorder: 'rgba(16, 47, 72, 0.12)',
          cardSecondaryButtonText: '#102f48',
          cardPrimaryButtonFrom: '#0c5fa5',
          cardPrimaryButtonTo: '#1887c9',
          cardPrimaryButtonText: '#ffffff',
          ctaGlow: 'rgba(12, 95, 165, 0.10)',
          ctaTitleText: '#102f48',
          ctaDescriptionText: '#466073',
          ctaContactBackground: 'rgba(255, 255, 255, 0.96)',
          ctaContactBorder: 'rgba(16, 47, 72, 0.10)',
          ctaContactLabelText: '#0c5fa5',
          ctaPhoneText: '#102f48',
          ctaHoursText: '#6e8294',
          ctaButtonFrom: '#0c5fa5',
          ctaButtonTo: '#1887c9',
          ctaButtonText: '#ffffff',
        }
      : baseTheme;

  useEffect(() => {
    if (services.length === 0) {
      setActiveSlide(0);
      return;
    }

    if (activeSlide > services.length - 1) {
      setActiveSlide(0);
    }
  }, [activeSlide, services.length]);

  useEffect(() => {
    if (previewMode || services.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setActiveSlide((current) => (current + 1) % services.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [previewMode, services.length]);

  const safeActiveSlide = services.length === 0 ? 0 : Math.min(activeSlide, services.length - 1);
  const isCompactPreview = previewMode;
  const sliderHeightClass = isCompactPreview ? 'h-[430px] sm:h-[460px]' : 'h-[500px]';
  const heroSectionClassName = isCompactPreview
    ? 'relative min-h-[78vh] flex items-center justify-center overflow-hidden'
    : 'relative min-h-[90vh] flex items-center justify-center overflow-hidden';
  const catalogSectionClassName = isCompactPreview ? 'py-24 relative overflow-hidden' : 'py-32 relative overflow-hidden';
  const ctaSectionClassName = isCompactPreview ? 'relative py-24 overflow-hidden' : 'relative py-32 overflow-hidden';
  const cardImageClassName = isCompactPreview ? 'h-44 relative overflow-hidden group' : 'h-48 relative overflow-hidden group';
  const cardBodyClassName = isCompactPreview ? 'p-5 flex-grow flex flex-col backdrop-blur-md' : 'p-6 flex-grow flex flex-col backdrop-blur-md';
  const docsPanelClassName = isCompactPreview ? 'mb-5 rounded-xl border p-3.5' : 'mb-6 p-4 rounded-xl border';
  const ctaContactClassName = isCompactPreview
    ? 'inline-block rounded-2xl mb-10 px-8 py-7 backdrop-blur-xl transition-all duration-300 border shadow-[0_0_40px_rgba(14,165,233,0.12)] sm:px-10 sm:py-8'
    : 'inline-block px-12 py-10 rounded-2xl mb-12 backdrop-blur-xl transition-all duration-300 border shadow-[0_0_40px_rgba(14,165,233,0.12)]';
  const ctaButtonClassName = isCompactPreview
    ? 'inline-flex items-center justify-center rounded-xl px-12 py-4 font-bold transition-all duration-300 hover:-translate-y-1 shadow-[0_0_25px_rgba(14,165,233,0.20)]'
    : 'inline-flex items-center justify-center px-14 py-5 rounded-xl font-bold transition-all hover:-translate-y-1 duration-300 shadow-[0_0_25px_rgba(14,165,233,0.20)]';

  const handlePreviewLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (previewMode) {
      event.preventDefault();
    }
  };

  const handleAdd = (service: ServiceProduct) => {
    if (previewMode || !onAddToCart) {
      return;
    }

    onAddToCart(service);
    setAddedIds((current) => [...current, service.id]);

    window.setTimeout(() => {
      setAddedIds((current) => current.filter((id) => id !== service.id));
    }, 1800);
  };

  const nextSlide = () => {
    if (services.length === 0) {
      return;
    }
    setActiveSlide((current) => (current + 1) % services.length);
  };

  const prevSlide = () => {
    if (services.length === 0) {
      return;
    }
    setActiveSlide((current) => (current - 1 + services.length) % services.length);
  };

  const getCardStyle = (index: number): CSSProperties => {
    const total = services.length;
    const distance = index - safeActiveSlide;
    const isActive = index === safeActiveSlide;
    const xOffset = distance * (isCompactPreview ? 96 : 110);
    const scale = isActive
      ? 1
      : Math.max((isCompactPreview ? 0.84 : 0.8) - Math.abs(distance) * 0.1, isCompactPreview ? 0.64 : 0.6);
    const rotateY = isActive ? 0 : distance * -15;
    const zIndex = total - Math.abs(distance);
    const opacity = Math.max(1 - Math.abs(distance) * 0.3, 0);
    const blur = isActive ? 0 : Math.abs(distance) * 2;

    return {
      transform: `translateX(${xOffset}%) scale(${scale}) perspective(1000px) rotateY(${rotateY}deg)`,
      zIndex,
      opacity,
      filter: `blur(${blur}px)`,
      transition: 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)',
      position: 'absolute',
      left: '0',
      right: '0',
      margin: '0 auto',
      width: '100%',
      maxWidth: isCompactPreview ? '320px' : '350px',
      pointerEvents: isActive ? 'auto' : 'none',
    };
  };

  const accentGradient = `linear-gradient(90deg, ${theme.heroAccentFrom}, ${theme.heroAccentTo})`;
  const primaryButtonGradient = `linear-gradient(90deg, ${theme.heroPrimaryButtonFrom}, ${theme.heroPrimaryButtonTo})`;
  const cardPrimaryButtonGradient = `linear-gradient(90deg, ${theme.cardPrimaryButtonFrom}, ${theme.cardPrimaryButtonTo})`;
  const ctaButtonGradient = `linear-gradient(90deg, ${theme.ctaButtonFrom}, ${theme.ctaButtonTo})`;
  const sectionDividerGradient = `linear-gradient(90deg, ${theme.sectionDividerFrom}, ${theme.sectionDividerTo})`;
  const heroOverlayGradient = `linear-gradient(to bottom, ${theme.heroOverlayFrom} 0%, ${theme.heroOverlayVia} 55%, ${theme.heroOverlayTo} 100%)`;

  return (
    <div className="flex flex-col overflow-x-hidden" style={{ backgroundColor: theme.pageBackground }}>
      <section className={heroSectionClassName}>
        <div className="absolute inset-0 z-0">
          <img
            src={hero.backgroundImageUrl}
            alt="Background"
            className="w-full h-full object-cover opacity-25 scale-105"
          />
          <div className="absolute inset-0" style={{ background: heroOverlayGradient }} />
          <div className="absolute inset-0">
            <div
              className="absolute inset-y-0 left-0 w-1/2 blur-3xl"
              style={{ backgroundColor: theme.heroAccentFrom, opacity: 0.08 }}
            />
            <div
              className="absolute inset-y-0 right-0 w-1/2 blur-3xl"
              style={{ backgroundColor: theme.heroAccentTo, opacity: 0.08 }}
            />
          </div>
        </div>

        <div
          className={`relative z-10 mx-auto px-4 text-center animate-fade-in sm:px-6 lg:px-8 ${
            isCompactPreview ? 'max-w-5xl pb-16' : 'max-w-6xl pb-20'
          }`}
        >
          <div
            className="inline-block px-6 py-2 rounded-full border backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(14,165,233,0.25)] transition-all duration-500"
            style={{
              backgroundColor: theme.heroBadgeBackground,
              borderColor: theme.heroBadgeBorder,
            }}
          >
            <span
              className="font-bold tracking-widest uppercase"
              style={{
                color: theme.heroBadgeText,
                fontSize: `${typography.heroBadgeSize}px`,
              }}
            >
              {hero.badgeText}
            </span>
          </div>

          <h1
            className="font-black tracking-tight mb-6 drop-shadow-2xl leading-tight"
            style={{
              color: theme.heroTitleText,
              fontSize: `clamp(${typography.heroTitleMobile}px, 7vw, ${typography.heroTitleDesktop}px)`,
            }}
          >
            {hero.titlePrefix}{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: accentGradient }}>
              {hero.titlePrimaryHighlight}
            </span>{' '}
            <br className="hidden md:block" />
            {hero.titleMiddle}{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: accentGradient }}>
              {hero.titleSecondaryHighlight}
            </span>
            {hero.titleSuffix}
          </h1>

          <p
            className={`mx-auto max-w-3xl leading-relaxed font-medium ${isCompactPreview ? 'mb-10' : 'mb-12'}`}
            style={{
              color: theme.heroDescriptionText,
              fontSize: `${typography.heroDescriptionSize}px`,
            }}
          >
            {hero.description}
          </p>

          <div className={`flex flex-col justify-center ${isCompactPreview ? 'gap-4 sm:flex-row' : 'gap-6 sm:flex-row'}`}>
            <Link
              href={hero.primaryButtonHref}
              onClick={handlePreviewLink}
              className={`inline-flex items-center justify-center rounded-xl font-bold transition-all shadow-[0_0_25px_rgba(14,165,233,0.25)] duration-300 hover:scale-110 ${
                isCompactPreview ? 'px-8 py-3.5' : 'px-10 py-4'
              }`}
              style={{
                background: primaryButtonGradient,
                color: theme.heroPrimaryButtonText,
                fontSize: `${typography.heroButtonSize}px`,
              }}
            >
              {hero.primaryButtonText}
              <ArrowRight className="ml-3 h-5 w-5" />
            </Link>
            <Link
              href={hero.secondaryButtonHref}
              onClick={handlePreviewLink}
              className={`inline-flex items-center justify-center rounded-xl border font-bold backdrop-blur-md transition-all duration-300 hover:scale-105 ${
                isCompactPreview ? 'px-8 py-3.5' : 'px-10 py-4'
              }`}
              style={{
                backgroundColor: theme.heroSecondaryButtonBackground,
                borderColor: theme.heroSecondaryButtonBorder,
                color: theme.heroSecondaryButtonText,
                fontSize: `${typography.heroButtonSize}px`,
              }}
            >
              {hero.secondaryButtonText}
            </Link>
          </div>
        </div>

        <div className="waves-container" />
      </section>

      <section className={catalogSectionClassName}>
        <div
          className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full blur-[150px] pointer-events-none"
          style={{ backgroundColor: theme.sectionGlowTop }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
          style={{ backgroundColor: theme.sectionGlowBottom }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`text-center ${isCompactPreview ? 'mb-16' : 'mb-20'}`}>
            <span
              className="font-bold tracking-[0.3em] uppercase mb-3 block"
              style={{
                color: theme.sectionEyebrowText,
                fontSize: `${typography.sectionEyebrowSize}px`,
              }}
            >
              {servicesSection.eyebrowText}
            </span>
            <h2
              className="font-black mb-6 drop-shadow-lg"
              style={{
                color: theme.sectionTitleText,
                fontSize: `clamp(${typography.sectionTitleMobile}px, 4.5vw, ${typography.sectionTitleDesktop}px)`,
              }}
            >
              {servicesSection.title}
            </h2>
            <div className="h-1 w-24 rounded-full mx-auto mb-6" style={{ background: sectionDividerGradient }} />
            <p
              className="max-w-3xl mx-auto leading-relaxed"
              style={{
                color: theme.sectionDescriptionText,
                fontSize: `${typography.sectionDescriptionSize}px`,
              }}
            >
              {servicesSection.description}
            </p>
          </div>

          {services.length > 0 ? (
            <div className={`relative flex items-center justify-center perspective-container ${sliderHeightClass}`}>
              <button
                type="button"
                onClick={prevSlide}
                className="absolute left-0 md:left-4 z-50 p-3 rounded-full transition-all backdrop-blur-md group border"
                style={{
                  backgroundColor: theme.sliderControlBackground,
                  borderColor: theme.sliderControlBorder,
                  color: theme.sliderControlIcon,
                }}
              >
                <ChevronLeft className="h-8 w-8 group-hover:scale-110 transition-transform" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-0 md:right-4 z-50 p-3 rounded-full transition-all backdrop-blur-md group border"
                style={{
                  backgroundColor: theme.sliderControlBackground,
                  borderColor: theme.sliderControlBorder,
                  color: theme.sliderControlIcon,
                }}
              >
                <ChevronRight className="h-8 w-8 group-hover:scale-110 transition-transform" />
              </button>

              <div className={`relative h-full w-full flex items-center justify-center ${isCompactPreview ? 'max-w-[920px]' : 'max-w-4xl'}`}>
                {services.map((service, index) => {
                  if (Math.abs(index - safeActiveSlide) > 2) {
                    return null;
                  }

                  return (
                    <div
                      key={service.id}
                      style={{
                        ...getCardStyle(index),
                        borderColor: theme.cardBorder,
                      }}
                      className="rounded-3xl overflow-hidden shadow-2xl border backdrop-blur-xl"
                    >
                      <div className="relative h-full flex flex-col">
                        <div className={cardImageClassName}>
                          <div
                            className="absolute inset-0 z-10"
                            style={{
                              background: `linear-gradient(to top, ${theme.cardImageOverlay}, transparent 65%)`,
                            }}
                          />
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                          />
                          <div
                            className="absolute top-4 right-4 z-20 backdrop-blur px-3 py-1 rounded-full font-bold shadow-lg flex items-center gap-1"
                            style={{
                              backgroundColor: theme.cardBadgeBackground,
                              color: theme.cardBadgeText,
                              fontSize: `${typography.cardBadgeSize}px`,
                            }}
                          >
                            <Star className="h-3 w-3 fill-current" /> {servicesSection.highlightBadgeText}
                          </div>
                        </div>

                        <div className={cardBodyClassName} style={{ backgroundColor: theme.cardBackground }}>
                          <h3
                            className="font-bold mb-2 leading-tight"
                            style={{
                              color: theme.cardTitleText,
                              fontSize: `${typography.cardTitleSize}px`,
                            }}
                          >
                            {service.title}
                          </h3>
                          <p
                            className={`line-clamp-3 leading-relaxed ${isCompactPreview ? 'mb-5' : 'mb-6'}`}
                            style={{
                              color: theme.cardDescriptionText,
                              fontSize: `${typography.cardDescriptionSize}px`,
                            }}
                          >
                            {service.description}
                          </p>

                          <div
                            className={docsPanelClassName}
                            style={{
                              backgroundColor: theme.cardDocsPanelBackground,
                              borderColor: theme.cardDocsPanelBorder,
                            }}
                          >
                            <p
                              className="font-bold uppercase mb-3 flex items-center gap-2"
                              style={{
                                color: theme.cardDocsPanelAccent,
                                fontSize: `${typography.cardMetaSize}px`,
                              }}
                            >
                              <FileText className="h-4 w-4" /> {service.requiredDocuments.length} {servicesSection.documentsLabel}
                            </p>
                            <ul className="space-y-2">
                              {service.requiredDocuments.slice(0, 3).map((documentName, documentIndex) => (
                                <li
                                  key={`${service.id}-${documentIndex}`}
                                  className="flex items-start gap-2"
                                  style={{
                                    color: theme.cardDocsPanelText,
                                    fontSize: `${typography.cardDescriptionSize}px`,
                                  }}
                                >
                                  <span style={{ color: theme.cardDocsPanelAccent }}>•</span>
                                  <span>{documentName}</span>
                                </li>
                              ))}
                              {service.requiredDocuments.length > 3 && (
                                <li
                                  className="font-semibold"
                                  style={{
                                    color: theme.cardDocsPanelAccent,
                                    fontSize: `${typography.cardDescriptionSize}px`,
                                  }}
                                >
                                  +{service.requiredDocuments.length - 3} {servicesSection.additionalDocumentsLabel}
                                </li>
                              )}
                            </ul>
                          </div>

                          <div className="mt-auto">
                            <div className={`flex items-end justify-between ${isCompactPreview ? 'mb-3.5' : 'mb-4'}`}>
                              <div>
                                <p
                                  className="uppercase font-semibold mb-1"
                                  style={{
                                    color: theme.cardMetaText,
                                    fontSize: `${typography.cardMetaSize}px`,
                                  }}
                                >
                                  {servicesSection.priceLabel}
                                </p>
                                <p
                                  className="font-black flex items-center gap-1"
                                  style={{
                                    color: theme.cardPriceText,
                                    fontSize: `${typography.cardPriceSize}px`,
                                  }}
                                >
                                  <DollarSign className="h-5 w-5" />
                                  {service.price.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            <div className={`grid grid-cols-2 ${isCompactPreview ? 'gap-2.5' : 'gap-3'}`}>
                              <Link
                                href="/services"
                                onClick={handlePreviewLink}
                                className={`block rounded-xl border text-center transition-colors ${isCompactPreview ? 'py-2' : 'py-2.5'}`}
                                style={{
                                  backgroundColor: theme.cardSecondaryButtonBackground,
                                  borderColor: theme.cardSecondaryButtonBorder,
                                  color: theme.cardSecondaryButtonText,
                                  fontSize: `${typography.cardButtonSize}px`,
                                  fontWeight: 700,
                                }}
                              >
                                {servicesSection.detailsButtonText}
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleAdd(service)}
                                disabled={previewMode}
                                className={`flex items-center justify-center gap-2 rounded-xl transition-all disabled:cursor-default ${
                                  isCompactPreview ? 'py-2' : 'py-2.5'
                                }`}
                                style={{
                                  background: cardPrimaryButtonGradient,
                                  color: theme.cardPrimaryButtonText,
                                  fontSize: `${typography.cardButtonSize}px`,
                                  fontWeight: 800,
                                }}
                              >
                                {addedIds.includes(service.id) ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    <span>Adicionado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4" />
                                    <span>{servicesSection.addButtonText}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="absolute -bottom-8 flex gap-2">
                {services.map((service, index) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: index === safeActiveSlide ? '32px' : '8px',
                      backgroundColor: index === safeActiveSlide ? theme.sliderDotActive : theme.sliderDotInactive,
                      boxShadow: index === safeActiveSlide ? `0 0 10px ${theme.sliderDotActive}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div
              className="rounded-3xl border p-10 text-center"
              style={{
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
                color: theme.cardDescriptionText,
              }}
            >
              Nenhum serviço cadastrado para pré-visualização.
            </div>
          )}
        </div>
      </section>

      <section className={ctaSectionClassName}>
        <div
          className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
          style={{ backgroundColor: theme.ctaGlow }}
        />
        <div className="relative max-w-5xl mx-auto px-4 text-center z-10">
          <h2
            className="font-black mb-8"
            style={{
              color: theme.ctaTitleText,
              fontSize: `clamp(${typography.ctaTitleMobile}px, 4vw, ${typography.ctaTitleDesktop}px)`,
            }}
          >
            {cta.title}
          </h2>
          <p
            className={`mx-auto max-w-2xl leading-relaxed ${isCompactPreview ? 'mb-10' : 'mb-14'}`}
            style={{
              color: theme.ctaDescriptionText,
              fontSize: `${typography.ctaDescriptionSize}px`,
            }}
          >
            {cta.description}
          </p>

          <div
            className={ctaContactClassName}
            style={{
              backgroundColor: theme.ctaContactBackground,
              borderColor: theme.ctaContactBorder,
            }}
          >
            <p
              className="mb-3 uppercase tracking-widest font-bold"
              style={{
                color: theme.ctaContactLabelText,
                fontSize: `${typography.ctaContactLabelSize}px`,
              }}
            >
              {cta.contactLabel}
            </p>
            <div
              className="font-black tracking-wide flex items-center justify-center gap-2"
              style={{
                color: theme.ctaPhoneText,
                fontSize: `${typography.ctaPhoneSize}px`,
              }}
            >
              {cta.phoneNumber}
            </div>
            <p
              className="mt-3"
              style={{
                color: theme.ctaHoursText,
                fontSize: `${typography.ctaHoursSize}px`,
              }}
            >
              {cta.workingHours}
            </p>
          </div>

          <div>
            <Link
              href={cta.buttonHref}
              onClick={handlePreviewLink}
              className={ctaButtonClassName}
              style={{
                background: ctaButtonGradient,
                color: theme.ctaButtonText,
                fontSize: `${typography.ctaButtonSize}px`,
              }}
            >
              {cta.buttonText}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
