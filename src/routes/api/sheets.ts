import { createFileRoute } from "@tanstack/react-router";
import { handleAction, json } from "@/lib/sheets-handler.server";

export const Route = createFileRoute("/api/sheets")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const params: Record<string, any> = {};
        url.searchParams.forEach((v, k) => (params[k] = v));
        return handleAction(String(params.action || ""), params, request);
      },
      POST: async ({ request }) => {
        const txt = await request.text();
        let body: any = {};
        try { body = txt ? JSON.parse(txt) : {}; }
        catch { return json({ error: "JSON inválido." }, 400); }
        return handleAction(String(body.action || ""), body, request);
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }),
    },
  },
});
