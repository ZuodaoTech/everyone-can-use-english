
async function handleRequest(request, env) {
  const { host, pathname } = new URL(request.url);
  // for the root path, forward to Portal
  // for other paths, forward to VTP
  if (pathname === '/') {
    return forwardToPortal(request, env);
  } else {
    return forwardToVtp(request, env);
  }
}

async function renderInternalError(msg) {
  return new Response(`Internal Error: ${msg}`, {
    status: 500,
    headers: { 'Content-Type': 'text/html' }
  });
}

async function forwardToVtp(request, env) {
  return await env.vtp.fetch(request)
}

async function forwardToPortal(request, env) {
  return await env.portal.fetch(request)
}
