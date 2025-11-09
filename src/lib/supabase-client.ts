import { env } from "hono/adapter";
import { setCookie } from "hono/cookie";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Context, MiddlewareHandler } from "hono";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";

declare module "hono" {
  interface ContextVariableMap {
    supabase: SupabaseClient;
  }
}

export const getSupabase = (c: Context) => {
  return c.get("supabase");
};

type SupabaseEnv = {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
};

export const supabaseMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const supabaseEnv = env<SupabaseEnv>(c);
    const supabaseUrl = supabaseEnv.SUPABASE_URL;
    const supabaseAnonKey = supabaseEnv.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL missing!");
    }

    if (!supabaseAnonKey) {
      throw new Error("SUPABASE_PUBLISHABLE_KEY missing!");
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          const cookies = parseCookieHeader(c.req.header("Cookie") ?? "");
          return cookies.find((cookie) => cookie.name === name)?.value;
        },
        set(name: string, value: string, options: any) {
          setCookie(c, name, value, options);
        },
        remove(name: string, options: any) {
          setCookie(c, name, "", { ...options, maxAge: 0 });
        },
      },
    });

    c.set("supabase", supabase);

    await next();
  };
};
