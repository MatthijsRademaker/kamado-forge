# Vision & Goals

This project is a personal kamado BBQ learning SPA. It helps its owner plan
cooking days, follow live guidance during a cook, ask context-aware LLM
questions, and build a memory of techniques, preferences, mistakes, and
progress over time.

## Identity

The product is a **kamado-first BBQ coach and learning companion**. It helps one
user become confident at driving a kamado: building and controlling the fire,
sequencing techniques, choosing targets and rubs, and learning from every cook.

The core experience is not a generic recipe site. It is a personal,
LLM-assisted interface for planning and running real kamado sessions, then
turning those sessions into durable learning.

## Strategic Goals

- **Plan complete kamado sessions.** Help design a full cooking day with
  multiple phases, such as low-and-slow ribs, then reverse-seared steak, then
  direct grilling.
- **Guide the user live during a cook.** Provide an outdoor-friendly session
  mode that clearly shows the current step, target temperatures, vent/fire
  guidance, and what comes next.
- **Answer context-aware questions.** Let the user ask questions like “what
  temperature should I aim for?”, “when should I put the steak on?”, “what rub
  fits this?”, or “how do I transition to searing?” without re-explaining the
  active session.
- **Teach kamado technique.** Build structured learning around fire management,
  vent control, low and slow cooking, smoking, reverse searing, direct grilling,
  heat transitions, and troubleshooting.
- **Remember progress.** Maintain memory of discussed topics, current learning
  level, cook logs, preferences, recurring issues, and lessons learned.

## Scope & Boundaries

### In scope

- Single-user personal SPA.
- LLM-assisted chat coach.
- Session planner for kamado cooking days.
- Live guidance mode for active cooks.
- Cook logs with planned vs. actual timing, notes, results, and lessons learned.
- Structured kamado learning section with guide/book-style content.
- Learning content produced from a mix of manually curated material and
  LLM-assisted explanations.

### Out of scope for now

- Multi-user accounts or community features.
- Marketplace, social recipe sharing, or public content platform behavior.
- Generic BBQ coverage that is not oriented around kamado cooking.
- Hardware integrations such as temperature probes or controllers, unless
  introduced later.

## Guiding Principles

- **Kamado-first.** Every major feature should assume the user is cooking on a
  kamado and needs guidance on fire, vents, ceramics, heat retention, and
  temperature transitions.
- **Session-centered UX.** The strongest product loop is: plan a session, follow
  live guidance, ask questions, log what happened, and learn for next time.
- **Glanceable during cooking.** Live mode should be easy to navigate while
  cooking outdoors, with clear current actions and minimal friction.
- **Memory improves coaching.** The assistant should get more useful as it
  learns the user’s skill level, preferences, previous cooks, and recurring
  challenges.
- **Learning is practical.** Guides should connect directly to action, such as
  planning a reverse sear session from the reverse searing guide.

## Target Users

The initial target user is the project owner: a kamado BBQ learner who wants to
become skilled at planning and managing real cooking sessions.

Primary jobs to serve:

- Decide what to cook and in what order.
- Understand target dome and food temperatures.
- Choose rubs, techniques, and timing.
- Manage fire, vents, deflectors, heat zones, and transitions.
- Recover from live-session problems such as temperature spikes, drops, delays,
  or timing conflicts.
- Review previous cooks and improve over time.

## Technical Context

The desired product shape is a single-page web application with five primary
areas:

1. **Today** — start or continue the active kamado session.
2. **Plan** — build a cooking-day timeline and receive suggested ordering,
   targets, setup, and prep guidance.
3. **Coach** — chat with an LLM assistant that understands the active session
   and memory.
4. **Learn** — browse kamado-oriented learning books/guides.
5. **Logbook** — review cook logs, notes, outcomes, and lessons learned.

The MVP should prioritize session planning, live guidance, context-aware chat,
basic cook logs, and a small kamado learning section.

## Anti-Goals

- Do not become a broad cooking or generic grilling website.
- Do not optimize first for public publishing, community features, or recipe
  marketplace mechanics.
- Do not bury the active cook behind complex navigation.
- Do not make the user repeatedly re-enter session context that the app should
  already know.
- Do not treat memory as an afterthought; progress tracking is part of the core
  coaching value.
