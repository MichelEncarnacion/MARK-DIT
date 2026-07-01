'use strict';

/**
 * Corre varias tareas de una fuente en paralelo. Ninguna falla tumba a las
 * demas: los items exitosos se juntan, los fallos se registran (log +
 * mensaje) para exponerlos en feed.json sin interrumpir el refresh.
 */
async function gather(tasks) {
  const settled = await Promise.allSettled(tasks.map((t) => t.run()));
  const items = [];
  const errors = [];

  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    } else {
      const message = `Fuente "${tasks[i].label}" fallo: ${result.reason.message}`;
      console.warn(`[sources] ${message}`);
      errors.push(message);
    }
  });

  return { items, errors };
}

module.exports = { gather };
