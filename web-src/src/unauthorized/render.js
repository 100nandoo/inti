import { render } from 'svelte/server';
import UnauthorizedPage from '../pages/UnauthorizedPage.svelte';

function stripSSRComments(markup) {
  return markup.replace(/<!--[^]*?-->/g, '');
}

export function renderUnauthorizedPage(message = '__MESSAGE__') {
  const result = render(UnauthorizedPage, {
    props: { message },
  });
  const html = stripSSRComments(result.html ?? result.body ?? '');
  const head = stripSSRComments(result.head ?? '');
  const css = result.css?.code ? `<style>${result.css.code}</style>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${head}
  <link rel="icon" href="/icons/inti.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/style.css" />
  <script defer src="/theme.js"></script>
  ${css}
</head>
<body>
  ${html}
</body>
</html>
`;
}
