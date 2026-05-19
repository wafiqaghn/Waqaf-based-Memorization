/* eslint-disable no-await-in-loop */
import { expect, test } from '@playwright/test';

import Homepage from '@/tests/POM/home-page';

let homePage: Homepage;

test.beforeEach(async ({ page, context }) => {
  homePage = new Homepage(page, context);
  await homePage.goTo('/');
});

test('Copyright year is current', { tag: ['@fast', '@footer'] }, async ({ page }) => {
  const footer = page.locator('footer');
  const currentYear = new Date().getFullYear().toString();
  await expect(footer).toContainText(`© ${currentYear} Quran.com`);
});

test(
  'Functional navigation links and legal links in the footer',
  { tag: ['@footer'] },
  async ({ page }) => {
    // Check that the links in the footer are working
    const footer = page.locator('footer');

    const allLinks = footer.locator('a');

    const links = await allLinks.all();
    // For loop is used here because the DOM can change while iterating over the links
    // eslint-disable-next-line no-restricted-syntax
    for (const link of links) {
      const text = (await link.textContent())?.trim() || '';
      const href = (await link.getAttribute('href')) || '';
      const target = (await link.getAttribute('target')) || '';

      const expectedLink = footerLinks.find((l) => l.text === text);

      if (expectedLink && expectedLink.target) {
        // I did not put the links to the app stores in the footerLinks mock because they may change
        if (expectedLink.href) {
          expect(href, `Link with text "${text}" should have href "${expectedLink?.href}"`).toBe(
            expectedLink.href,
          );
        }
        if (expectedLink.target) {
          expect(
            target,
            `Link with text "${text}" should have target "${expectedLink?.target}"`,
          ).toBe(expectedLink.target);
        }
      }
    }
  },
);

const footerLinks = [
  // Navigate section
  { text: 'Home', href: '/', target: '' },
  { text: 'Reciters', href: '/reciters', target: '' },
  { text: 'About Us', href: '/about-us', target: '' },
  { text: 'Developers', href: '/developers', target: '' },
  { text: 'Product Updates', href: '/product-updates', target: '' },
  { text: 'Feedback', href: 'https://feedback.quran.com/', target: '_blank' },
  { text: 'Help', href: '/support', target: '' },

  // Popular Links section
  { text: 'Ayatul Kursi', href: '/ayatul-kursi', target: '' },
  { text: 'Yaseen', href: '/ya-sin', target: '' },
  { text: 'Al Mulk', href: '/al-mulk', target: '' },
  { text: 'Ar-Rahman', href: '/ar-rahman', target: '' },
  { text: 'Al Kahf', href: '/al-kahf', target: '' },

  // Bottom Links section
  { text: 'Sitemap', href: '/sitemap.xml', target: '_blank' },
  { text: 'Privacy', href: '/privacy', target: '_blank' },
  { text: 'Terms and Conditions', href: '/terms-and-conditions', target: '_blank' },
];
