import {
  getAssetFromKV,
  mapRequestToAsset,
} from "@cloudflare/kv-asset-handler";

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = true;

addEventListener("fetch", (event) => {
  try {
    event.respondWith(handleEvent(event));
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        })
      );
    }
    event.respondWith(new Response("Internal Error", { status: 500 }));
  }
});

async function handleEvent(event) {
  // const url = new URL(event.request.url)
  let options = {};

  // const key = url.pathname.slice(1);
  // if (event.request.method === 'GET' && key.startsWith("storage/")) {
  //   const object = await STORAGE_BUCKET.get(key);

  //   if (object === null) {
  //     event.respondWith(Response('Object Not Found', { status: 404 }));
  //     return
  //   }

  //   const headers = new Headers();
  //   object.writeHttpMetadata(headers);
  //   headers.set('etag', object.httpEtag);

  //   event.respondWith(new Response(object.body, {
  //     headers,
  //   }));
  //   return ;
  // }

  /**
   * You can add custom logic to how we fetch your assets
   * by configuring the function `mapRequestToAsset`
   */
  // options.mapRequestToAsset = handlePrefix(/^\/docs/)

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      };
    }

    // no extension and not end with '/', redirect to the same path with '/'
    if (!event.request.url.endsWith("/")) {
      if (!event.request.url.split("/").pop().includes(".")) {
        return Response.redirect(`${event.request.url}/`, 301);
      }
    }

    const page = await getAssetFromKV(event, options);

    // allow headers to be altered
    const response = new Response(page.body, page);

    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "unsafe-url");
    response.headers.set("Feature-Policy", "none");

    if (event.request.url.match(/\.(js|css|png|jpg|svg|ttf)$/)) {
      response.headers.set("Cache-Control", "max-age=604800");
    }

    return response;
  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    // if (!DEBUG) {
    //   try {
    //     let notFoundResponse = await getAssetFromKV(event, {
    //       mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
    //     })

    //     return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 })
    //   } catch (e) {}
    // }
    return getAssetFromKV(event, {
      mapRequestToAsset: (req) => {
        const url = new URL(req.url);
        let pathname = url.pathname;

        if (pathname.startsWith("/tools/")) {
          // remove the '/tools' prefix
          pathname = pathname.substring(6);
        }

        // If the pathname ends with '/', assume it's a directory and append 'index.html'
        if (pathname.endsWith("/")) {
          pathname += "index.html";
        }

        // If it doesn't have an extension, assume it's a directory and append '/index.html'
        else if (!pathname.split("/").pop().includes(".")) {
          pathname += "/index.html";
        }

        return new Request(`${url.origin}${pathname}`, req);
      },
    });

    // return new Response(e.message || e.toString(), { status: 500 })
  }
}

/**
 * Here's one example of how to modify a request to
 * remove a specific prefix, in this case `/docs` from
 * the url. This can be useful if you are deploying to a
 * route on a zone, or if you only want your static content
 * to exist at a specific path.
 */
function handlePrefix(prefix) {
  return (request) => {
    // compute the default (e.g. / -> index.html)
    let defaultAssetKey = mapRequestToAsset(request);
    let url = new URL(defaultAssetKey.url);

    // strip the prefix from the path for lookup
    url.pathname = url.pathname.replace(prefix, "/");

    // inherit all other props from the default request
    return new Request(url.toString(), defaultAssetKey);
  };
}
