# Staging Ground — staginggroundlabs.com

Company site for **Staging Ground** (a dba of Ubuntu Equity Group, LLC): enterprise technical training built on mental models, not tool tutorials.

Static HTML/CSS/JS, no build step, hosted on GitHub Pages.

## Structure

```
index.html       Main page (all sections + contact form)
privacy.html     Privacy policy (CalOPPA)
css/tokens.css   Design tokens: colors, type, spacing. Change values here, not in components
css/main.css     Components and layout
js/main.js       Status bar clock/uptime, nav, scroll reveal
js/contact.js    Contact form: Web3Forms alert + Kit contact/opt-in
CNAME            Custom domain for GitHub Pages
CONTACT_LOOP.md  Contact loop setup, welcome email copy, test checklist
```

## Preview locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Configure the contact form

Three values on the `<form id="contact-form">` element in `index.html` (all public, safe to commit):

| Value | Where | Gets it from |
|-------|-------|--------------|
| `access_key` hidden input | `YOUR_WEB3FORMS_ACCESS_KEY` | web3forms.com |
| `data-kit-contact-form` | `YOUR_KIT_CONTACT_FORM_ID` | Kit → *Website Contact* form URL |
| `data-kit-updates-form` | `YOUR_KIT_UPDATES_FORM_ID` | Kit → *Website Updates* form URL |

Full setup and test steps: [CONTACT_LOOP.md](CONTACT_LOOP.md).

## Deploy (GitHub Pages + custom domain)

1. Repo lives in the **StagingGround** org. **Settings → Pages →** Deploy from branch `main`, folder `/ (root)`.
2. Verify the domain for the org: **Org Settings → Pages → Add a domain**, then add the TXT record GitHub shows in Porkbun.
3. Porkbun DNS:
   - Delete the parking records (`ALIAS` and `CNAME` → `uixie.porkbun.com`).
   - Add `A` records on the root (`@`): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - Add `CNAME` `www` → `stagingground.github.io`.
   - **Do not touch MX, SPF, DKIM, or DMARC.** Email depends on them.
4. **Settings → Pages →** custom domain `staginggroundlabs.com` (the `CNAME` file sets this), wait for the DNS check, then tick **Enforce HTTPS** (certificate can take up to an hour).

## Content rules

- Nothing from DCA, BreEZe, IIS/TEKsystems courseware, or any client system. Generic industries only.
- Every statistic must be confirmed against its original source before it ships (see `Why_We_Teach_This.md` in the project).
