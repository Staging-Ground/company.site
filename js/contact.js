/*
 * contact.js — Contact loop for staginggroundlabs.com
 * =====================================================
 * One submit, two destinations:
 *
 *   1. Web3Forms  → emails the inquiry to hello@ (the alert, and a durable
 *                   record in the inbox). This is the source of truth for
 *                   success/failure shown to the visitor.
 *   2. Kit        → stores the contact and triggers the welcome email
 *                   ("Website Contact" form). If the visitor ticked the
 *                   updates box, they are also added to the "Website Updates"
 *                   form, which is the only audience that gets broadcasts.
 *
 * Kit's public form endpoint doesn't return CORS headers, so those posts are
 * sent `no-cors` (fire-and-forget). They never block or fail the visitor's
 * submission; verify them with the test checklist in CONTACT_LOOP.md.
 *
 * Config lives on the <form> element in index.html, not here.
 * Without JavaScript, the form still posts straight to Web3Forms.
 */

'use strict';

(() => {
  const PLACEHOLDER_PREFIX = 'YOUR_';
  const FALLBACK_EMAIL = 'hello@staginggroundlabs.com';
  const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = document.getElementById('cf-submit');
  const statusEl = document.getElementById('cf-status');

  const isConfigured = (value) =>
    typeof value === 'string' && value.length > 0 && !value.startsWith(PLACEHOLDER_PREFIX);

  const setStatus = (message, state) => {
    statusEl.textContent = message;
    statusEl.dataset.state = state || '';
  };

  const setBusy = (busy) => {
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? 'Sending…' : 'Send Message';
  };

  const firstName = (fullName) => (fullName || '').trim().split(/\s+/)[0] || '';

  /* ---------------------------------------------------------------------
     Validation: use the browser's built-in rules, report the first problem.
  --------------------------------------------------------------------- */
  const validate = () => {
    const fields = Array.from(form.querySelectorAll('input, select, textarea'))
      .filter((el) => el.type !== 'hidden' && el.name !== 'botcheck');

    fields.forEach((el) => el.removeAttribute('aria-invalid'));
    const invalid = fields.find((el) => !el.checkValidity());
    if (!invalid) return true;

    invalid.setAttribute('aria-invalid', 'true');
    invalid.focus();
    const label = form.querySelector(`label[for="${invalid.id}"]`);
    const name = label ? label.textContent.replace('*', '').trim() : 'This field';
    setStatus(
      invalid.type === 'email' && invalid.value
        ? 'Please enter a valid email address.'
        : `${name} is required.`,
      'error'
    );
    return false;
  };

  /* ---------------------------------------------------------------------
     Kit: fire-and-forget posts to public form endpoints.
  --------------------------------------------------------------------- */
  const postToKit = async (formId, data) => {
    if (!isConfigured(formId)) return;
    const base = form.dataset.kitBase || 'https://app.kit.com';
    const body = new FormData();
    body.append('email_address', data.email);
    body.append('fields[first_name]', firstName(data.name));
    if (data.company)  body.append('fields[company]', data.company);
    if (data.role)     body.append('fields[role]', data.role);
    if (data.interest) body.append('fields[interest]', data.interest);

    try {
      await fetch(`${base}/forms/${encodeURIComponent(formId)}/subscriptions`, {
        method: 'POST',
        mode: 'no-cors',
        body,
      });
    } catch (err) {
      // Never surface Kit failures to the visitor; the inbox alert still has the lead.
      console.warn('[contact] Kit post failed', formId, err);
    }
  };

  const syncToKit = async (data) => {
    // Contact form first so the welcome automation fires, then the opt-in list.
    await postToKit(form.dataset.kitContactForm, data);
    if (data.updates_optin === 'yes') {
      await postToKit(form.dataset.kitUpdatesForm, data);
    }
  };

  /* ---------------------------------------------------------------------
     Web3Forms: the inbox alert. Its response decides what the visitor sees.
  --------------------------------------------------------------------- */
  const sendAlert = async (data) => {
    const payload = {
      ...data,
      subject: `New inquiry: ${data.interest || 'General'} | ${data.name}`,
      replyto: data.email,
      updates_optin: data.updates_optin === 'yes' ? 'yes' : 'no',
    };

    const res = await fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json.message || `HTTP ${res.status}`);
    }
  };

  /* ---------------------------------------------------------------------
     Submit handler
  --------------------------------------------------------------------- */
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('', '');

    if (!validate()) return;

    const data = Object.fromEntries(new FormData(form).entries());

    // Honeypot tripped: pretend success, send nothing.
    if (data.botcheck) {
      form.reset();
      setStatus('Thanks! Your message is on its way.', 'success');
      return;
    }
    delete data.botcheck;

    if (!isConfigured(data.access_key)) {
      console.warn('[contact] Web3Forms access key not set. See CONTACT_LOOP.md.');
      setStatus(`The form isn't connected yet. Please email ${FALLBACK_EMAIL}.`, 'error');
      return;
    }

    setBusy(true);
    try {
      await Promise.all([sendAlert(data), syncToKit(data)]);
      form.reset();
      setStatus(
        `Thanks, ${firstName(data.name) || 'friend'}! Your message is in. Check your inbox for a welcome email; we'll reply within one business day.`,
        'success'
      );
    } catch (err) {
      console.error('[contact] Submit failed', err);
      setStatus(
        `Something went wrong sending your message. Please email ${FALLBACK_EMAIL} and we'll get right back to you.`,
        'error'
      );
    } finally {
      setBusy(false);
    }
  });
})();
