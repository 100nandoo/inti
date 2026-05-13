import { render } from 'svelte/server';
import UnauthorizedPage from '../pages/UnauthorizedPage.svelte';

type SSRRenderResult = {
  body?: string;
  head?: string;
  html?: string;
};

function stripSSRComments(markup: string): string {
  return markup.replace(/<!--[^]*?-->/g, '');
}

export function renderUnauthorizedPage(message = '__MESSAGE__'): string {
  const result = render(UnauthorizedPage, {
    props: { message },
  }) as SSRRenderResult;
  const html = stripSSRComments(result.html ?? result.body ?? '');
  const head = stripSSRComments(result.head ?? '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${head}
  <link rel="icon" href="/icons/inti.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/style.css" />
  <script defer src="/theme.js"></script>
</head>
<body>
  ${html}
</body>
</html>
`;
}
