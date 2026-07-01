'use strict';

const { fetchFeed } = require('../lib/rss');
const { gather } = require('../lib/sourceUtils');

const GITHUB_API = 'https://api.github.com/repos/anthropics/courses/contents';
const CLASS_CENTRAL_FEED = 'https://www.classcentral.com/report/feed/';
const AI_KEYWORDS = /(inteligencia artificial|\bIA\b|artificial intelligence|\bAI\b|machine learning|deep learning|LLM|GPT|chatbot|generative)/i;

/**
 * Cursos oficiales de Anthropic/Claude: el repo publico anthropics/courses
 * (via GitHub API, sin necesidad de RSS ni scraping).
 */
async function fetchAnthropicCourses() {
  const response = await fetch(GITHUB_API, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'mark-dit-bot',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API respondio ${response.status}`);
  }
  const entries = await response.json();
  return entries
    .filter((entry) => entry.type === 'dir')
    .map((entry) => ({
      title: `Curso oficial de Anthropic: ${entry.name.replace(/[-_]/g, ' ')}`,
      link: entry.html_url,
      source: 'Anthropic (oficial)',
      publishedAt: null,
      rawSummary: `Modulo gratuito del repositorio oficial de cursos de Anthropic (anthropics/courses): "${entry.name}".`,
    }));
}

/**
 * Cursos gratis de IA de otras plataformas de calidad, via el feed
 * editorial de Class Central, filtrado por palabras clave de IA.
 */
async function fetchFreeAiCourses() {
  const items = await fetchFeed(CLASS_CENTRAL_FEED, 'Class Central');
  return items
    .filter((item) => AI_KEYWORDS.test(item.title) || AI_KEYWORDS.test(item.rawSummary))
    .slice(0, 8);
}

function fetchCourses() {
  return gather([
    { label: 'Anthropic (GitHub)', run: fetchAnthropicCourses },
    { label: 'Class Central', run: fetchFreeAiCourses },
  ]);
}

module.exports = { fetchCourses, category: 'courses' };
