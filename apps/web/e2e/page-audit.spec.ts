import { expect, test } from '@playwright/test';
import { auditPage } from './page-audit';

test('l’audit repère chaque défaut qu’il prétend contrôler', async ({ page }) => {
  await page.setContent(`<html lang="fr"><body style="background:#fff">
    <h1>Titre</h1><h3>Saut</h3><p style="color:#bbb">Gris pâle</p><p style="color:oklab(0.85 0 0)">Gris oklab</p>
    <button></button><a href="/x"></a><img src="data:,">
    <div style="width:2000px">Large</div></body></html>`);
  const rules = (await auditPage(page)).map(({ rule }) => rule).sort();
  expect(rules).toEqual(['alt', 'contraste', 'contraste', 'débordement', 'nom', 'nom', 'titres']);
});
