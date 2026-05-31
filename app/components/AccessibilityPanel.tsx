"use client";

import {
  Accessibility,
  Contrast,
  EyeOff,
  Link as LinkIcon,
  MousePointer2,
  Type
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

type AccessibilitySettings = {
  contrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  focusMode: boolean;
  underlineLinks: boolean;
  readingSpacing: boolean;
};

const accessibilityDefaults: AccessibilitySettings = {
  contrast: false,
  largeText: false,
  reduceMotion: false,
  focusMode: false,
  underlineLinks: false,
  readingSpacing: false
};

export default function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(accessibilityDefaults);

  useEffect(() => {
    const stored = localStorage.getItem("banco-accessibility-settings");
    if (!stored) return;
    try {
      setSettings({ ...accessibilityDefaults, ...JSON.parse(stored) });
    } catch {
      setSettings(accessibilityDefaults);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.a11yContrast = settings.contrast ? "true" : "false";
    root.dataset.a11yText = settings.largeText ? "large" : "normal";
    root.dataset.a11yMotion = settings.reduceMotion ? "reduced" : "normal";
    root.dataset.a11yFocus = settings.focusMode ? "strong" : "normal";
    root.dataset.a11yLinks = settings.underlineLinks ? "underlined" : "normal";
    root.dataset.a11ySpacing = settings.readingSpacing ? "wide" : "normal";
    localStorage.setItem("banco-accessibility-settings", JSON.stringify(settings));
  }, [settings]);

  function toggle(key: keyof AccessibilitySettings) {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  }

  const options: Array<{ key: keyof AccessibilitySettings; label: string; text: string; icon: LucideIcon }> = [
    { key: "contrast", label: "Alto contraste", text: "Mejora lectura y separa controles.", icon: Contrast },
    { key: "largeText", label: "Texto grande", text: "Aumenta tamaño base sin zoom externo.", icon: Type },
    { key: "reduceMotion", label: "Reducir movimiento", text: "Desactiva animaciones no esenciales.", icon: EyeOff },
    { key: "focusMode", label: "Foco visible", text: "Refuerza navegación con teclado.", icon: MousePointer2 },
    { key: "underlineLinks", label: "Enlaces subrayados", text: "No dependen solo del color.", icon: LinkIcon },
    { key: "readingSpacing", label: "Espaciado lectura", text: "Aumenta interlineado y separación.", icon: Type }
  ];

  return (
    <>
      <a className="skip-link" href="#contenido-principal">Saltar al contenido principal</a>
      <section className="accessibility-panel" aria-label="Opciones de accesibilidad">
        <button
          className="accessibility-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="accessibility-options"
          onClick={() => setOpen(!open)}
        >
          <Accessibility size={20} />
          <span>Accesibilidad</span>
        </button>
        <div id="accessibility-options" className="accessibility-options" hidden={!open}>
          <header>
            <strong>Opciones de accesibilidad</strong>
            <span>WCAG 2.1 AA / EN 301 549</span>
          </header>
          <div className="accessibility-grid">
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={settings[option.key] ? "active" : ""}
                  aria-pressed={settings[option.key]}
                  onClick={() => toggle(option.key)}
                >
                  <Icon size={18} />
                  <span><strong>{option.label}</strong><small>{option.text}</small></span>
                </button>
              );
            })}
          </div>
          <button className="accessibility-reset" type="button" onClick={() => setSettings(accessibilityDefaults)}>Restablecer accesibilidad</button>
        </div>
      </section>
    </>
  );
}
