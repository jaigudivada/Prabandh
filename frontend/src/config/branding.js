/**
 * PRABANDH — Centralized Branding Configuration
 * ===============================================
 * 
 * All brand values are centralized here for easy customization.
 * Modify this file to white-label or rebrand for clients
 * while preserving the original authorship record (see `author` metadata).
 *
 * @project     PRABANDH
 * @author      JAI GUDIVADA
 * @studio      JAI VERSE
 * @copyright   © 2026 JAI VERSE. All rights reserved.
 */

const branding = {
  /** ── Identity ─────────────────────────────────────────── */
  project: {
    name: 'PRABANDH',
    subtitle: 'Issue Management Portal',
    tagline: 'Smart campus issue reporting and management platform',
    description:
      'A comprehensive, full-stack issue management system designed to streamline campus complaint reporting and resolution.',
  },

  /** ── Authorship ───────────────────────────────────────── */
  author: {
    name: 'JAI GUDIVADA',
    email: 'jaigudivada@jaiverse.com',
    url: 'https://github.com/jaigudivada',
  },

  /** ── Studio / Brand / Production ──────────────────────── */
  studio: {
    name: 'JAI VERSE',
    url: 'https://jaiverse.com',
    description: 'Design & development studio by JAI GUDIVADA.',
  },

  /** ── Brand Attribution ────────────────────────────────── */
  attribution: {
    text: 'A JAI VERSE Product',
    style: 'italic',
    separator: '·',
  },

  /** ── Copyright ─────────────────────────────────────────── */
  copyright: {
    year: 2026,
    holder: 'JAI VERSE',
    text: 'All rights reserved.',
    full: `© 2026 JAI VERSE. All rights reserved.`,
    attribution: 'Designed and developed by JAI GUDIVADA.',
  },

  /** ── Metadata (HTML / SEO / Social) ───────────────────── */
  metadata: {
    title: 'PRABANDH — Issue Management Portal',
    titleTemplate: '%s — PRABANDH',
    description:
      'Smart campus issue reporting and management platform for efficient complaint tracking and resolution.',
    applicationName: 'PRABANDH',
    themeColor: '#1e293b',
    og: {
      title: 'PRABANDH — Issue Management Portal by JAI VERSE',
      description:
        'Smart campus issue reporting and management platform for efficient complaint tracking and resolution.',
      type: 'website',
    },
    twitter: {
      title: 'PRABANDH — Issue Management Portal by JAI VERSE',
      description:
        'Smart campus issue reporting and management platform for efficient complaint tracking and resolution.',
      card: 'summary_large_image',
    },
  },

  /** ── UI Labels ─────────────────────────────────────────── */
  ui: {
    navTitle: 'PRABANDH',
    navSubtitle: 'Issue Management Portal',
    loginTitle: 'PRABANDH — Issue Management Portal',
    loginDescription: 'A professional workspace designed for effective enterprise issue management.',
    registerTitle: 'PRABANDH — Issue Management Portal',
    registerDescription: 'Register with a clean, professional onboarding experience for your team.',
    sidebarTitle: 'PRABANDH',
    sidebarSubtitle: 'Issue Management Portal',
  },

  /** ── Favicon / Icons ──────────────────────────────────── */
  icons: {
    favicon: '/favicon.ico',
    appleTouchIcon: '/apple-touch-icon.png',
    logo: '/logo.png',
    png192: '/icon-192x192.png',
    png512: '/icon-512x512.png',
  },

  /** ── Legal ─────────────────────────────────────────────── */
  license: {
    type: 'Custom Commercial License',
    year: 2026,
    holder: 'JAI VERSE',
    author: 'JAI GUDIVADA',
  },
};

export default branding;