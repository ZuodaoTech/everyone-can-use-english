
async function handleRequest(request, env) {
  const { host, pathname } = new URL(request.url);
  // for the root path and portal's assets, forward to Portal
  // for other paths, forward to VTP
  if (pathname === '/' || pathname.startsWith('/portal-assets') || pathname.startsWith('/portal-static')) {
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

export default {
  async fetch(request, env) {
    return handleRequest(request, env)
  }
}