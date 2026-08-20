/* ------------------------------------------------------------------ *
 * THE GATE SHELL.
 *
 * Every page the access wall serves — the sign-in gate, the waiting
 * page, the refusal, the application form — is written inline and
 * self-contained, because the static assets are behind that wall too:
 * the gate cannot load a stylesheet it is protecting.
 *
 * That constraint is why this is a shared module rather than a copy in
 * each file. auth.ts owns the wall's own pages and apply.ts owns the
 * application form; they are the same surface to a visitor and have to
 * look like it, which a second copy of these rules would not survive.
 *
 * The rules here cover a form as well as prose — select and textarea
 * alongside input — so the application form needs no styling of its own.
 * ------------------------------------------------------------------ */

/** A complete, asset-free page. `body` is trusted markup built by the caller. */
export const SHELL = (title: string, body: string) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${title}</title>
<style>
  :root { color-scheme: light dark; --paper:#FDFCFA; --ink:#241F19; --ink2:#4C463D;
          --rule:#E3DED4; --accent:#4C4899; --on:#fff; --bad:#AA2A1E; --surface:#fff; }
  @media (prefers-color-scheme: dark) {
    :root { --paper:#141310; --ink:#EDE9E1; --ink2:#B6AFA3; --rule:#2E2A24;
            --accent:#A8A6D3; --on:#241F19; --bad:#E87A68; --surface:#1D1B17; }
  }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; padding:24px;
         background:var(--paper); color:var(--ink);
         font:400 19px/1.65 Georgia,"Times New Roman",serif; }
  main { width:100%; max-width:29rem; }
  h1 { font-size:34px; line-height:1.2; margin:0 0 8px; }
  p { color:var(--ink2); margin:0 0 20px; }
  form { display:flex; flex-direction:column; gap:12px; }
  label { font:500 15px/1.4 system-ui,sans-serif; }
  input { font:400 17px/1.4 ui-monospace,SFMono-Regular,monospace; padding:12px 14px;
          border:1px solid var(--rule); border-radius:6px; background:var(--surface);
          color:var(--ink); width:100%; }
  input:focus-visible { outline:2px solid var(--accent); outline-offset:1px; }
  button { font:500 17px/1 system-ui,sans-serif; padding:13px 18px; border:0;
           border-radius:6px; background:var(--accent); color:var(--on); cursor:pointer; }
  button[disabled] { opacity:.55; cursor:default; }
  .msg { font:400 15px/1.5 system-ui,sans-serif; color:var(--bad); min-height:1.4em; margin:0; }
  /* Only the application form's error is a block of its own; the gate's login
     message sits inside a flex form whose gap already spaces it. */
  .msg[role="alert"] { margin:0 0 22px; }
  .fine { font:400 15px/1.6 system-ui,sans-serif; color:var(--ink2); margin-top:28px;
          padding-top:20px; border-top:1px solid var(--rule); }
  code { font:400 15px/1.5 ui-monospace,SFMono-Regular,monospace; background:var(--surface);
         border:1px solid var(--rule); border-radius:4px; padding:1px 5px; }
  .google { display:flex; align-items:center; justify-content:center; gap:10px;
            background:var(--surface); color:var(--ink); border:1px solid var(--rule);
            text-decoration:none; padding:13px 18px; border-radius:6px;
            font:500 17px/1 system-ui,sans-serif; }
  .or { display:flex; align-items:center; gap:12px; color:var(--ink2);
        font:400 14px/1 system-ui,sans-serif; margin:22px 0; }
  .or::before, .or::after { content:""; flex:1; height:1px; background:var(--rule); }
  .mark { font-size:34px; line-height:1; margin-bottom:12px; }
  select, textarea { font:400 17px/1.4 system-ui,sans-serif; padding:12px 14px;
          border:1px solid var(--rule); border-radius:6px; background:var(--surface);
          color:var(--ink); width:100%; }
  textarea { min-height:6.5rem; resize:vertical; }
  select:focus-visible, textarea:focus-visible { outline:2px solid var(--accent); outline-offset:1px; }
  fieldset { border:0; margin:0 0 12px; padding:0; }
  legend { font:500 17px/1.45 system-ui,sans-serif; color:var(--ink); padding:0 0 10px; }
  legend .step { margin-bottom:8px; }
  .choice { display:flex; align-items:flex-start; gap:10px; font:400 16px/1.5 system-ui,sans-serif;
            color:var(--ink2); padding:7px 0; cursor:pointer; }
  .choice input { width:auto; margin:3px 0 0; accent-color:var(--accent); }
  .hint { font:400 14px/1.5 system-ui,sans-serif; color:var(--ink2); margin:-4px 0 8px; }
  .step { display:block; font:500 13px/1 system-ui,sans-serif; letter-spacing:.08em;
          text-transform:uppercase; color:var(--accent); margin:0 0 8px; }
  .q { margin:0 0 12px; }
  .q label { display:block; font:500 17px/1.45 system-ui,sans-serif; color:var(--ink);
             margin:0 0 10px; }
</style>
</head><body><main>${body}</main></body></html>`;
