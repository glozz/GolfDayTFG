"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  Trophy,
  Users,
  Building2,
  UtensilsCrossed,
  Clock3,
  Download,
  Mail,
  Phone,
  BadgeInfo,
  CheckCircle2,
  Gift,
  HeartHandshake,
  Flag,
  LayoutDashboard,
  Plus,
  Trash2,
  Menu,
  X,
} from "lucide-react";
import {
  submitRegistration,
  formatCurrency,
  formatEventDate,
  getCurrentEvent,
  getRegistrationsByEvent,
} from "@/Lib/api/golfDayApi";

const defaultPackageOptions = [
  {
    id: "premium-hole",
    title: "Premium Hole Sponsor",
    price: 25000,
    description:
      "Premium branding at a sponsored hole, event visibility, and premium sponsor placement.",
    benefits: ["Premium signage", "Featured on landing page", "Priority sponsor listing"],
  },
  {
    id: "standard-hole",
    title: "Standard Hole Sponsor",
    price: 15000,
    description: "Standard hole sponsorship with branding and event recognition.",
    benefits: ["Hole signage", "Sponsor listing", "Event recognition"],
  },
  {
    id: "four-ball",
    title: "Four-Ball Entry",
    price: 8500,
    description: "Register a full team of four players for the event.",
    benefits: ["4 player slots", "Welcome pack", "Event participation"],
  },
  {
    id: "prize-donation",
    title: "Prize Donation",
    price: 0,
    description: "Donate prizes for players, teams, or goodie bags.",
    benefits: ["Brand mention", "Prize category visibility", "Supports charity event"],
  },
];

const teeSlots = [
  { time: "08:00", hole: "Hole 1" },
  { time: "08:10", hole: "Hole 10" },
  { time: "08:20", hole: "Hole 1" },
  { time: "08:30", hole: "Hole 10" },
  { time: "08:40", hole: "Hole 1" },
  { time: "08:50", hole: "Hole 10" },
  { time: "09:00", hole: "Hole 1" },
  { time: "09:10", hole: "Hole 10" },
];

const navItems = [
  { id: "overview", label: "Overview" },
  { id: "packages", label: "Packages" },
  { id: "register", label: "Register" },
  { id: "tee-times", label: "Tee Times" },
  { id: "course", label: "Course" },
  { id: "dashboard", label: "Admin" },
];

const createPlayer = (halfwayOptions = [], dinnerOptions = []) => ({
  id: crypto.randomUUID(),
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  handicap: "",
  meal: halfwayOptions[0] || "Chicken",
  dinnerMeal: dinnerOptions[0] || "Chicken",
  dietary: "",
});

const createTeam = (index, halfwayOptions = [], dinnerOptions = []) => ({
  id: crypto.randomUUID(),
  teamName: `Team ${index + 1}`,
  players: [
    createPlayer(halfwayOptions, dinnerOptions),
    createPlayer(halfwayOptions, dinnerOptions),
    createPlayer(halfwayOptions, dinnerOptions),
    createPlayer(halfwayOptions, dinnerOptions),
  ],
  carts: 0,
  trolleys: 0,
  dinner: true,
});

const createInitialForm = (event = null) => {
  const halfwayOptions = event?.catering?.halfwayHouseOptions || ["Chicken", "Beef", "Vegetarian", "Halal"];
  const dinnerOptions = event?.catering?.dinnerOptions || ["Chicken", "Beef", "Vegetarian"];
  const sponsorTier =
    event?.sponsorshipPackages?.[0]?.packageId || defaultPackageOptions[0].id;

  return {
    participation: {
      teamEntry: true,
      sponsorHole: false,
      donatePrizes: false,
      charityDonation: false,
    },
    sponsorTier,
    company: {
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      vatNumber: "",
      notes: "",
      internalReference: "",
    },
    donation: {
      prizeDescription: "",
      prizeQuantity: 1,
      charityAmount: "",
    },
    teams: [createTeam(0, halfwayOptions, dinnerOptions)],
    catering: {
      halfwayHousePreference: halfwayOptions[0] || "Chicken",
      eveningDinnerAttendance: "Yes",
      generalDietaryNotes: "",
    },
  };
};

function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <p className="text-base leading-7 text-slate-600">{subtitle}</p>
    </div>
  );
}

function Card({ className = "", children }) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
  );
}

function Input({ label, required, className = "", ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <input
        {...props}
        className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 ${className}`}
      />
    </label>
  );
}

function TextArea({ label, className = "", ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        {...props}
        className={`min-h-[110px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 ${className}`}
      />
    </label>
  );
}

function Select({ label, children, className = "", ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        {...props}
        className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 ${className}`}
      >
        {children}
      </select>
    </label>
  );
}

function PlayerModal({ registration, onClose }) {
  if (!registration) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{registration.teamName}</h3>
              <p className="mt-1 text-sm text-slate-500">{registration.companyName}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Players ({registration.players?.length || 0})
          </p>

          {(!registration.players || registration.players.length === 0) ? (
            <p className="text-sm text-slate-500">No player details available.</p>
          ) : (
            <div className="space-y-3">
              {registration.players.map((player, index) => (
                <div key={player.id || index} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{player.email}</p>
                      {player.phone && (
                        <p className="text-sm text-slate-500">{player.phone}</p>
                      )}
                    </div>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {player.handicap != null && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
                        HC: {player.handicap}
                      </span>
                    )}
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
                      🍽 {player.halfwayHouseMealOption}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
                      🥂 {player.dinnerMealOption}
                    </span>
                    {player.dietaryRequirements && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 shadow-sm">
                        ⚠ {player.dietaryRequirements}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TfgGolfDayFrontend() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState(createInitialForm());
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("registrations");
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoadingEvent(true);
        setError("");
        const data = await getCurrentEvent();
        setEvent(data);
        setForm(createInitialForm(data));

        if (data?.id) {
          setLoadingRegistrations(true);
          try {
            const regs = await getRegistrationsByEvent(data.id);
            setRegistrations(regs || []);
          } catch (regErr) {
            console.warn("Could not load registrations:", regErr.message);
          } finally {
            setLoadingRegistrations(false);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load event.");
      } finally {
        setLoadingEvent(false);
      }
    }

    loadEvent();
  }, []);

  const packageOptions = useMemo(() => {
    if (!event?.sponsorshipPackages?.length) {
      return defaultPackageOptions.map((pkg) => ({
        ...pkg,
        packageId: pkg.id,
        priceLabel: pkg.price ? formatCurrency(pkg.price) : "Flexible",
      }));
    }

    return event.sponsorshipPackages.map((pkg) => ({
      ...pkg,
      id: pkg.packageId,
      priceLabel: pkg.price ? formatCurrency(pkg.price) : "Flexible",
    }));
  }, [event]);

  const halfwayHouseOptions = event?.catering?.halfwayHouseOptions || ["Chicken", "Beef", "Vegetarian", "Halal"];
  const dinnerOptions = event?.catering?.dinnerOptions || ["Chicken", "Beef", "Vegetarian"];

  const totalRegisteredTeams = registrations.length;
  const totalPlayers = registrations.reduce((sum, reg) => sum + (reg.players?.length || 0), 0);
  const confirmedCount = registrations.filter((r) => r.status === "Confirmed").length;
  const pendingCount = registrations.filter((r) => r.status === "Pending").length;

  const stats = [
    { label: "Teams Registered", value: totalRegisteredTeams, icon: Users },
    { label: "Total Players", value: totalPlayers, icon: Trophy },
    { label: "Confirmed", value: confirmedCount, icon: CheckCircle2 },
    { label: "Pending", value: pendingCount, icon: Clock3 },
  ];

  const generatedTeeTimes = useMemo(() => {
    return form.teams.map((team, index) => ({
      teamName: team.teamName || `Team ${index + 1}`,
      ...teeSlots[index % teeSlots.length],
    }));
  }, [form.teams]);

  const selectedPackage = packageOptions.find((p) => p.id === form.sponsorTier);

  const updateCompany = (key, value) => {
    setForm((prev) => ({
      ...prev,
      company: {
        ...prev.company,
        [key]: value,
      },
    }));
  };

  const updateDonation = (key, value) => {
    setForm((prev) => ({
      ...prev,
      donation: {
        ...prev.donation,
        [key]: value,
      },
    }));
  };

  const updateParticipation = (key) => {
    setForm((prev) => ({
      ...prev,
      participation: {
        ...prev.participation,
        [key]: !prev.participation[key],
      },
    }));
  };

  const updateCatering = (key, value) => {
    setForm((prev) => ({
      ...prev,
      catering: {
        ...prev.catering,
        [key]: value,
      },
    }));
  };

  const addTeam = () => {
    setForm((prev) => ({
      ...prev,
      teams: [...prev.teams, createTeam(prev.teams.length, halfwayHouseOptions, dinnerOptions)],
    }));
  };

  const removeTeam = (id) => {
    setForm((prev) => ({
      ...prev,
      teams: prev.teams.length > 1 ? prev.teams.filter((team) => team.id !== id) : prev.teams,
    }));
  };

  const updateTeam = (teamId, field, value) => {
    setForm((prev) => ({
      ...prev,
      teams: prev.teams.map((team) => (team.id === teamId ? { ...team, [field]: value } : team)),
    }));
  };

  const updatePlayer = (teamId, playerId, field, value) => {
    setForm((prev) => ({
      ...prev,
      teams: prev.teams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              players: team.players.map((player) =>
                player.id === playerId ? { ...player, [field]: value } : player
              ),
            }
          : team
      ),
    }));
  };

  const resetForm = () => {
    setForm(createInitialForm(event));
    setSubmitted(false);
    setSuccessMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const results = await submitRegistration(form, event);

      setSubmitted(true);
      setSuccessMessage(
        results.length === 1
          ? "Registration submitted successfully."
          : `${results.length} team registrations submitted successfully.`
      );

      // Refresh registrations from API so dashboard updates immediately
      if (event?.id) {
        try {
          const regs = await getRegistrationsByEvent(event.id);
          setRegistrations(regs || []);
        } catch {}
      }

      document.getElementById("confirmation")?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Failed to submit registration.");
    } finally {
      setSubmitting(false);
    }
  };

  const adminRegistrations = useMemo(() => {
    if (!registrations.length) {
      return [];
    }

    return registrations.map((reg) => ({
      id: reg.id,
      company: reg.companyName,
      contact: reg.contactPersonName,
      team: reg.teamName,
      players: reg.players?.length || 0,
      status: reg.status,
    }));
  }, [registrations]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-white/40 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-slate-900">
                {event?.name || "TFG Charity Golf Day"}
              </p>
              <p className="text-xs text-slate-500">
                {event?.year || "2026"} Registration Portal
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <a
              href="#register"
              className="inline-flex items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
            >
              Register Now
            </a>
          </div>

          <button
            className="rounded-2xl border border-slate-200 p-2 md:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <section id="overview" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_30%),radial-gradient(circle_at_top_left,_rgba(15,23,42,0.09),_transparent_24%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {loadingEvent ? "Loading event..." : "External-facing digital registration experience"}
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {event?.eventDetails?.heroTitle ||
                  "A polished event portal for sponsors, teams, donations, and tee time scheduling."}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                {event?.eventDetails?.heroSubtitle ||
                  "Centralize golf day registrations, sponsorship packages, catering preferences, and admin reporting in one clean digital experience built for annual reuse."}
              </p>
              {event?.eventDetails?.description && (
                <p className="max-w-2xl text-base leading-7 text-slate-600">
                  {event.eventDetails.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="#register"
                className="inline-flex items-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
              >
                Start Registration
              </a>
              <a
                href="#dashboard"
                className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                View Admin Dashboard
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{stat.label}</p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">{stat.value}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-100 p-3">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <Card className="overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-900 p-6 text-white">
                <p className="text-sm font-medium text-slate-300">Event Snapshot</p>
                <h3 className="mt-2 text-2xl font-bold">{event?.name || "TFG Charity Golf Day 2026"}</h3>
              </div>
              <div className="space-y-5 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3 text-slate-700">
                      <CalendarDays className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        {event?.date ? formatEventDate(event.date) : "Friday, 16 October 2026"}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3 text-slate-700">
                      <MapPin className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        {event?.venue?.name || "Atlantic Beach Golf Club"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">Included in the portal</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      "Company & VAT capture",
                      "Multi-team registration",
                      "Hole sponsorship options",
                      "Prize and charity donations",
                      "Dietary requirements",
                      "Automatic tee time previews",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="h-4 w-4" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-emerald-50 p-5">
                  <p className="text-sm font-semibold text-emerald-900">Why this works</p>
                  <p className="mt-2 text-sm leading-7 text-emerald-900/80">
                    Vendors register in one place, admins track registrations in one dashboard, and the event can be reused every year by updating event content rather than rebuilding the process.
                  </p>
                </div>

                {event?.registration && (
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">Registration window</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {formatEventDate(event.registration.openDate)} - {formatEventDate(event.registration.closeDate)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Status: {event.registration.isOpen ? "Open" : "Closed"}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section id="packages" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Sponsorship & entry"
          title="Packages built for flexibility"
          subtitle="Allow vendors to enter teams, sponsor holes, donate prizes, or support the charity with a clean, modern selection flow."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          {packageOptions.map((pkg) => (
            <Card key={pkg.id} className="flex h-full flex-col p-6">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Option</p>
                <div>
                  <h3 className="text-xl font-bold text-slate-950">{pkg.title}</h3>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {pkg.priceLabel || (pkg.price ? formatCurrency(pkg.price) : "Flexible")}
                  </p>
                </div>
                <p className="text-sm leading-7 text-slate-600">{pkg.description}</p>
              </div>
              <div className="mt-6 space-y-3">
                {(pkg.benefits || []).map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {benefit}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4">
                <button
                  onClick={() => {
                    setForm((prev) => ({ ...prev, sponsorTier: pkg.id }));
                    document.getElementById("register")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
                >
                  Select Package
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="register" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-6">
            <SectionTitle
              eyebrow="Registration"
              title="Complete event registration"
              subtitle="Capture interest, company details, team entries, prize donations, and catering preferences in a structured multi-section form."
            />

            <Card className="p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Registration steps</p>
              <div className="mt-5 space-y-4">
                {[
                  "Choose participation options",
                  "Enter company and invoicing details",
                  "Add teams and player details",
                  "Capture dinner and dietary needs",
                  "Preview tee times and submit",
                ].map((step, index) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm text-slate-600">{step}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-sm font-semibold text-slate-900">Live preview</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Selected package</span>
                  <span className="font-semibold text-slate-900">{selectedPackage?.title || "-"}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Teams</span>
                  <span className="font-semibold text-slate-900">{form.teams.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Total players</span>
                  <span className="font-semibold text-slate-900">{form.teams.length * 4}</span>
                </div>
              </div>
            </Card>

            {error && (
              <Card className="border-rose-200 bg-rose-50 p-6">
                <p className="text-sm font-semibold text-rose-700">{error}</p>
              </Card>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <BadgeInfo className="h-5 w-5" />
                <h3 className="text-lg font-bold">Participation options</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { key: "teamEntry", label: "Enter a Team", icon: Users },
                  { key: "sponsorHole", label: "Sponsor a Hole", icon: Trophy },
                  { key: "donatePrizes", label: "Donate Prizes", icon: Gift },
                  { key: "charityDonation", label: "Charity Donation", icon: HeartHandshake },
                ].map((item) => {
                  const Icon = item.icon;
                  const checked = form.participation[item.key];
                  return (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => updateParticipation(item.key)}
                      className={`rounded-3xl border p-5 text-left transition ${
                        checked
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="mb-4 h-5 w-5" />
                      <p className="font-semibold">{item.label}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <Select
                  label="Selected sponsorship / entry package"
                  value={form.sponsorTier}
                  onChange={(e) => setForm((prev) => ({ ...prev, sponsorTier: e.target.value }))}
                >
                  {packageOptions.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.title}
                    </option>
                  ))}
                </Select>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <Building2 className="h-5 w-5" />
                <h3 className="text-lg font-bold">Company details</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Company name"
                  required
                  value={form.company.companyName}
                  onChange={(e) => updateCompany("companyName", e.target.value)}
                  placeholder="Enter company name"
                />
                <Input
                  label="Contact person"
                  required
                  value={form.company.contactPerson}
                  onChange={(e) => updateCompany("contactPerson", e.target.value)}
                  placeholder="Full name"
                />
                <Input
                  label="Email"
                  required
                  type="email"
                  value={form.company.email}
                  onChange={(e) => updateCompany("email", e.target.value)}
                  placeholder="name@company.com"
                />
                <Input
                  label="Phone"
                  required
                  value={form.company.phone}
                  onChange={(e) => updateCompany("phone", e.target.value)}
                  placeholder="012 345 6789"
                />
                <Input
                  label="VAT number"
                  value={form.company.vatNumber}
                  onChange={(e) => updateCompany("vatNumber", e.target.value)}
                  placeholder="VAT registration"
                />
                <Input
                  label="Internal reference"
                  value={form.company.internalReference}
                  onChange={(e) => updateCompany("internalReference", e.target.value)}
                  placeholder="Optional PO or billing reference"
                />
              </div>
              <div className="mt-4">
                <TextArea
                  label="Notes for the event team"
                  value={form.company.notes}
                  onChange={(e) => updateCompany("notes", e.target.value)}
                  placeholder="Anything the organizers should know"
                />
              </div>
            </Card>

            {(form.participation.donatePrizes || form.participation.charityDonation) && (
              <Card className="p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Gift className="h-5 w-5" />
                  <h3 className="text-lg font-bold">Donation details</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {form.participation.donatePrizes && (
                    <>
                      <Input
                        label="Prize description"
                        value={form.donation.prizeDescription}
                        onChange={(e) => updateDonation("prizeDescription", e.target.value)}
                        placeholder="e.g. 4 x branded golf bags"
                      />
                      <Input
                        label="Prize quantity"
                        type="number"
                        min="1"
                        value={form.donation.prizeQuantity}
                        onChange={(e) => updateDonation("prizeQuantity", e.target.value)}
                      />
                    </>
                  )}
                  {form.participation.charityDonation && (
                    <Input
                      label="Charity amount"
                      value={form.donation.charityAmount}
                      onChange={(e) => updateDonation("charityAmount", e.target.value)}
                      placeholder="R"
                    />
                  )}
                </div>
              </Card>
            )}

            {form.participation.teamEntry && (
              <Card className="p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    <h3 className="text-lg font-bold">Team registration</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addTeam}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Add team
                  </button>
                </div>

                <div className="space-y-6">
                  {form.teams.map((team, teamIndex) => (
                    <div key={team.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h4 className="text-base font-bold text-slate-900">
                          {team.teamName || `Team ${teamIndex + 1}`}
                        </h4>
                        {form.teams.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTeam(team.id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <Input
                          label="Team name"
                          value={team.teamName}
                          onChange={(e) => updateTeam(team.id, "teamName", e.target.value)}
                          placeholder="Enter team name"
                        />
                        <Input
                          label="Carts required"
                          type="number"
                          min="0"
                          value={team.carts}
                          onChange={(e) => updateTeam(team.id, "carts", e.target.value)}
                        />
                        <Input
                          label="Trolleys required"
                          type="number"
                          min="0"
                          value={team.trolleys}
                          onChange={(e) => updateTeam(team.id, "trolleys", e.target.value)}
                        />
                      </div>

                      <div className="mt-5 space-y-4">
                      {team.players.map((player, playerIndex) => (
  <div key={player.id} className="rounded-3xl border border-white bg-white p-4 shadow-sm">
    <p className="mb-4 text-sm font-semibold text-slate-900">
      Player {playerIndex + 1}
    </p>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Input
        label="First name"
        required
        value={player.firstName}
        onChange={(e) => updatePlayer(team.id, player.id, "firstName", e.target.value)}
        placeholder="First name"
      />
      <Input
        label="Last name"
        required
        value={player.lastName}
        onChange={(e) => updatePlayer(team.id, player.id, "lastName", e.target.value)}
        placeholder="Last name"
      />
      <Input
        label="Email"
        required
        type="email"
        value={player.email}
        onChange={(e) => updatePlayer(team.id, player.id, "email", e.target.value)}
        placeholder="player@email.com"
      />
      <Input
        label="Phone"
        required
        value={player.phone}
        onChange={(e) => updatePlayer(team.id, player.id, "phone", e.target.value)}
        placeholder="012 345 6789"
      />
      <Input
        label="Handicap"
        type="number"
        min="0"
        max="54"
        value={player.handicap}
        onChange={(e) => updatePlayer(team.id, player.id, "handicap", e.target.value)}
        placeholder="Optional"
      />
      <Select
        label="Halfway house meal"
        value={player.meal}
        onChange={(e) => updatePlayer(team.id, player.id, "meal", e.target.value)}
      >
        {halfwayHouseOptions.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </Select>
      <Select
        label="Dinner meal"
        value={player.dinnerMeal}
        onChange={(e) => updatePlayer(team.id, player.id, "dinnerMeal", e.target.value)}
      >
        {dinnerOptions.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </Select>
      <Input
        label="Dietary requirements"
        value={player.dietary}
        onChange={(e) => updatePlayer(team.id, player.id, "dietary", e.target.value)}
        placeholder="Optional"
      />
    </div>
  </div>
))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <UtensilsCrossed className="h-5 w-5" />
                <h3 className="text-lg font-bold">Event & catering notes</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Halfway house preference"
                  value={form.catering.halfwayHousePreference}
                  onChange={(e) => updateCatering("halfwayHousePreference", e.target.value)}
                >
                  {halfwayHouseOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Evening dinner attendance"
                  value={form.catering.eveningDinnerAttendance}
                  onChange={(e) => updateCatering("eveningDinnerAttendance", e.target.value)}
                >
                  <option>Yes</option>
                  <option>No</option>
                </Select>
              </div>
              <div className="mt-4">
                <TextArea
                  label="General dietary notes"
                  value={form.catering.generalDietaryNotes}
                  onChange={(e) => updateCatering("generalDietaryNotes", e.target.value)}
                  placeholder="Capture any team-level catering notes here"
                />
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <Clock3 className="h-5 w-5" />
                <h3 className="text-lg font-bold">Tee time preview</h3>
              </div>
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="grid grid-cols-3 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                  <span>Team</span>
                  <span>Time</span>
                  <span>Starting hole</span>
                </div>
                {generatedTeeTimes.map((slot) => (
                  <div
                    key={`${slot.teamName}-${slot.time}`}
                    className="grid grid-cols-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-700"
                  >
                    <span>{slot.teamName}</span>
                    <span>{slot.time}</span>
                    <span>{slot.hole}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={submitting || (event?.registration && !event.registration.isOpen)}
                className="inline-flex items-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Registration"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>
      </section>

      <section id="confirmation" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {submitted && (
          <Card className="border-emerald-200 bg-emerald-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-emerald-600 p-3 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-950">
                    {successMessage || "Registration submitted successfully"}
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-emerald-900/80">
                    A confirmation email can be triggered from the backend with sponsorship details, invoice information, and tee time allocations.
                  </p>
                </div>
              </div>
              <button type="button" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-900 shadow-sm">
                Download Summary
              </button>
            </div>
          </Card>
        )}
      </section>

      <section id="tee-times" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="On the day"
          title="Public tee sheet preview"
          subtitle="A clean, sponsor-friendly tee sheet gives teams instant visibility into their start time and tee-off hole."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-slate-950">Tee-off schedule</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Teams are assigned to the next available slot. In production, this could be generated automatically from submitted registrations.
            </p>
            <div className="mt-6 space-y-3">
              {generatedTeeTimes.map((slot) => (
                <div
                  key={`${slot.teamName}-${slot.time}-public`}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{slot.teamName}</p>
                    <p className="text-sm text-slate-500">{slot.hole}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm">
                    {slot.time}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-950">Event information board</h3>
              <p className="mt-2 text-sm text-slate-600">
                Use this section for rules, notices, sponsor comms, and event reminders.
              </p>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              {[
                ["Arrival", event?.information?.rules || "Please arrive 45 minutes before your tee time for check-in and sponsor pack collection."],
                ["Dress code", event?.information?.additionalNotes || "Standard golf attire applies. Branded sponsor gear is welcome."],
                ["Setup", event?.information?.setupInstructions || "Hole sponsors should complete setup before the first tee-off slot."],
                ["Dinner", "Dinner service begins after the final teams return from play."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{copy}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section id="course" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Course"
          title="Venue and course information"
          subtitle="Keep the event details dynamic by pulling them directly from the current event API."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5" />
                <h3 className="text-xl font-bold text-slate-950">{event?.venue?.name || "Atlantic Beach Golf Club"}</h3>
              </div>
              <p className="text-sm leading-7 text-slate-600">
                {event?.venue?.address
                  ? `${event.venue.address}, ${event.venue.city}, ${event.venue.country}`
                  : "Venue details will appear here from the event API."}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Contact email</p>
                  <p className="mt-2 text-sm text-slate-600">{event?.contact?.email || "golfday@tfg.co.za"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Contact phone</p>
                  <p className="mt-2 text-sm text-slate-600">{event?.contact?.phone || "+27210000000"}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            {event?.course?.courseImageUrl ? (
              <img
                src={event.course.courseImageUrl}
                alt="Course layout"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[280px] items-center justify-center bg-slate-100 p-6 text-center text-sm text-slate-500">
                Course image will render here when <code className="mx-1 rounded bg-white px-2 py-1">courseImageUrl</code> is returned.
              </div>
            )}
          </Card>
        </div>
      </section>

      <section id="dashboard" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5" />
          <SectionTitle
            eyebrow="Admin"
            title="Simple dashboard preview"
            subtitle="This stays as a frontend preview for now, while registrations are posted to the API."
          />
        </div>

        <div className="mt-10 grid gap-6">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-950">Registrations</h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("registrations")}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                      activeTab === "registrations" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Registrations
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("contacts")}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                      activeTab === "contacts" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Contacts
                  </button>
                </div>
              </div>
            </div>

            {activeTab === "registrations" ? (
              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-700">
                    <span>Company</span>
                    <span>Contact</span>
                    <span>Team</span>
                    <span>Players</span>
                    <span>Status</span>
                  </div>

                  {loadingRegistrations ? (
                    <div className="px-6 py-8 text-center text-sm text-slate-500">
                      Loading registrations...
                    </div>
                  ) : adminRegistrations.length === 0 ? (
                    <div className="px-6 py-8 text-center text-sm text-slate-500">
                      No registrations yet. Be the first to register!
                    </div>
                  ) : (
                    adminRegistrations.map((row) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-5 border-b border-slate-100 px-6 py-4 text-sm text-slate-600"
                      >
                        <span>{row.company}</span>
                        <span>{row.contact}</span>
                        <span>{row.team}</span>
                        <button
                            onClick={() => setSelectedRegistration(
                              registrations.find((r) => r.id === row.id)
                            )}
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                          >
                            <Users className="h-3 w-3" />
                            {row.players} players
                          </button>
                        <span>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              row.status === "Confirmed"
                                ? "bg-emerald-100 text-emerald-800"
                                : row.status === "Cancelled"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {row.status}
                          </span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 p-6 md:grid-cols-2">
                <button className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm font-semibold text-slate-800">
                  {event?.contact?.email || "golfday@tfg.co.za"}
                  <Mail className="h-4 w-4" />
                </button>
                <button className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm font-semibold text-slate-800">
                  {event?.contact?.phone || "+27210000000"}
                  <Phone className="h-4 w-4" />
                </button>
                {["Registration export", "Sponsor list export", "Tee sheet PDF"].map((item) => (
                  <button
                    key={item}
                    className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm font-semibold text-slate-800"
                  >
                    {item}
                    <Download className="h-4 w-4" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="font-semibold text-slate-800">TFG Charity Golf Day Portal</p>
            <p className="mt-1">
              Reusable annual event frontend with registration, course info, tee times, and admin dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#overview" className="hover:text-slate-900">Overview</a>
            <a href="#register" className="hover:text-slate-900">Register</a>
            <a href="#dashboard" className="hover:text-slate-900">Admin</a>
          </div>
        </div>
      </footer>
      
          {/* ← Player modal goes HERE — after footer, before root closing div */}
          <PlayerModal
        registration={selectedRegistration}
        onClose={() => setSelectedRegistration(null)}
      />
    </div>   
  );
}