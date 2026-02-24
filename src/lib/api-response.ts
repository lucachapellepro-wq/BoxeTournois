import { NextResponse } from "next/server";

/** Réponse de succès avec données */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Réponse d'erreur standardisée */
export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/** Réponse 400 Bad Request */
export function apiBadRequest(message: string) {
  return apiError(message, 400);
}

/** Réponse 404 Not Found */
export function apiNotFound(message = "Ressource non trouvée") {
  return apiError(message, 404);
}

/** Réponse 409 Conflict */
export function apiConflict(message: string) {
  return apiError(message, 409);
}

/** Parse et valide un ID numérique depuis un paramètre string. Retourne le nombre ou null si invalide. */
export function parseId(id: string): number | null {
  const num = Number(id);
  return Number.isInteger(num) && num > 0 ? num : null;
}

/** Log d'erreur serveur sans exposer le stack Prisma complet */
export function logApiError(label: string, error: unknown) {
  console.error(label, error instanceof Error ? error.message : String(error));
}

/** Parse le body JSON d'une requête en toute sécurité. Retourne null si le JSON est invalide. */
export async function safeJson<T = unknown>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}
