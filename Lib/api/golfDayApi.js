
const API_BASE_URL = "http://forekonline-001-site6.rtempurl.com".replace(/\/$/, "");

const API_VERSION = "v1";

// ─── Core request with ApiResponse<T> unwrapping ───

async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}/api/${API_VERSION}${path}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let body = null;

  try {
    body = await response.json();
  } catch {
    // 204 No Content or non-JSON
  }

  if (!response.ok) {
    const errorMessage =
      body?.errors?.join(", ") ||
      body?.message ||
      `API request failed: ${response.status}`;
    throw new Error(errorMessage);
  }

  // Unwrap the ApiResponse<T> wrapper — return inner .data
  return body?.data ?? body;
}

// ─── Event API ───

export async function getCurrentEvent() {
  const event = await apiRequest("/events/current", {
    method: "GET",
    cache: "no-store",
  });

  // Normalize API response to match frontend expectations
  return normalizeEventResponse(event);
}

function normalizeEventResponse(event) {
  if (!event) return null;

  return {
    ...event,
    // Map packageCode → packageId for frontend compatibility
    sponsorshipPackages: (event.sponsorshipPackages || []).map((pkg) => ({
      ...pkg,
      packageId: pkg.packageCode,
    })),
    // Nest courseImageUrl under .course for frontend compatibility
    course: {
      courseImageUrl: event.courseImageUrl,
    },
  };
}

// ─── Registration API ───

export async function createRegistration(payload) {
  return apiRequest("/registrations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Transforms the frontend form into one or more CreateRegistrationRequest payloads.
 * The .NET API expects ONE registration per team, so multiple teams = multiple API calls.
 *
 * Returns: array of results (one per team)
 */
export async function submitRegistration(form, event) {
  const payloads = buildRegistrationPayloads(form, event);
  const results = [];

  for (const payload of payloads) {
    const result = await createRegistration(payload);
    results.push(result);
  }

  return results;
}

/**
 * Builds an array of API-compatible payloads — one per team.
 *
 * Frontend form shape → CreateRegistrationRequest:
 *   form.company.companyName     → companyName
 *   form.company.contactPerson   → contactPersonName
 *   form.company.email           → contactPersonEmail
 *   form.company.phone           → contactPersonPhone
 *   form.sponsorTier             → sponsorshipPackageId (resolved from packages)
 *   form.teams[].teamName        → teamName
 *   form.teams[].players[]       → players[]
 */
export function buildRegistrationPayloads(form, event) {
  // Resolve the sponsorship package GUID from the selected packageCode
  const selectedPackage = (event?.sponsorshipPackages || []).find(
    (pkg) => pkg.packageId === form.sponsorTier || pkg.packageCode === form.sponsorTier
  );

  return form.teams.map((team) => ({
    eventId: event?.id,
    teamName: team.teamName,
    companyName: form.company.companyName,
    contactPersonName: form.company.contactPerson,
    contactPersonEmail: form.company.email,
    contactPersonPhone: form.company.phone,
    sponsorshipPackageId: selectedPackage?.id || null,
    players: team.players.map((player) => ({
      firstName: player.firstName,
      lastName: player.lastName,
      email: player.email,
      phone: player.phone || "",
      handicap: player.handicap ? parseInt(player.handicap, 10) : null,
      halfwayHouseMealOption: player.meal,
      dinnerMealOption: player.dinnerMeal,
      dietaryRequirements: player.dietary || null,
    })),
  }));
}

// ─── Legacy wrapper (keeps old call signature working) ───
export function buildRegistrationPayload(form, event) {
  return buildRegistrationPayloads(form, event);
}

// ─── Utilities ───

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatEventDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getRegistrationsByEvent(eventId) {
  if (!eventId) return [];
  return apiRequest(`/registrations/event/${eventId}`, {
    method: "GET",
    cache: "no-store",
  });
}