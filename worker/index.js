// Worker сайта. Обычные страницы и файлы отдаёт Cloudflare сам (см. assets в wrangler.jsonc),
// сюда попадают только запросы к серверу чарника: /seek_and_destroy/sheet/api/...
import { handleApi } from "./sheet-api.js";

const API = "/seek_and_destroy/sheet/api/";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith(API)) return handleApi(request, env, pathname.slice(API.length).replace(/\/+$/, ""));
    return env.ASSETS.fetch(request);
  },
};
