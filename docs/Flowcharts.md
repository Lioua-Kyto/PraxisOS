# Flowcharts

Diagrams for the flows where the behaviour is not obvious from the code. The
straightforward CRUD panels are omitted deliberately.

## Application startup

```mermaid
flowchart TD
    A[app launch] --> B[registerMediaScheme<br/>before app.whenReady]
    B --> C[app.whenReady]
    C --> D[open SQLite in userData]
    D --> E[run idempotent DDL<br/>CREATE TABLE IF NOT EXISTS]
    E --> F{new columns<br/>missing?}
    F -->|yes| G[ALTER TABLE ADD COLUMN]
    F -->|no| H
    G --> H[seed / top up<br/>reference data]
    H --> I[registerAll IPC handlers]
    I --> J[registerMediaProtocolHandler]
    J --> K[create BrowserWindow<br/>contextIsolation on]
    K --> L[preload injects window.api]
    L --> M[renderer boots React]
```

The scheme must be registered *before* `whenReady` — privileged schemes cannot
be declared once the app is running. The handler is registered after, because it
needs the app to be ready to resolve paths.

Seeding is a *top up*, not a one-shot. An early version only seeded when the
table was empty, which meant existing installs never received categories added
in later versions. Reference data is now reconciled on every start: missing rows
are inserted, existing rows are left alone.

---

## Focus session lifecycle

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Running : clock in
    Running --> Paused : pause
    Paused --> Running : resume
    Running --> Completed : clock out
    Paused --> Completed : clock out
    Completed --> Running : reopen (mis-click)
    Completed --> [*]

    note right of Running
        last_started_at = now
        elapsed = accumulated_seconds
                + (now - last_started_at)
    end note

    note right of Paused
        accumulated_seconds += run length
        last_started_at = null
    end note
```

### Editing the start time of a running session

```mermaid
flowchart TD
    A[user edits start_time] --> B{session running?}
    B -->|no| C[write the field<br/>recompute duration]
    B -->|yes| D[shift = old start − new start]
    D --> E[accumulated_seconds += shift<br/>clamped at 0]
    E --> F[live display jumps<br/>to the corrected elapsed time]
```

Without the shift, the stored start time changes but the ticking display keeps
counting from `last_started_at`, so correcting a session started at 08:30 but
clocked in at 09:30 would still read 30 seconds.

### Starting a workout while focusing

```mermaid
flowchart TD
    A[start workout] --> B{focus session<br/>already running?}
    B -->|no| D[start training session]
    B -->|yes| C[stop the running session<br/>replaceActive = true]
    C --> D
```

---

## Workout session engine

```mermaid
flowchart TD
    A[Preview<br/>next exercise or superset] --> B{time-based?}
    B -->|all active exercises<br/>are time-based| C[Work: countdown]
    B -->|reps, or a mixed group| D[Work: manual]
    C --> E[Set log<br/>reps / weight]
    D --> E
    E --> F{more sets<br/>in this group?}
    F -->|yes| G[Rest<br/>pausable, length editable]
    G --> A
    F -->|no| H{more groups<br/>in the day?}
    H -->|yes| G
    H -->|no| I[Session complete]
```

Two rules that are easy to get wrong:

- **Mixed supersets.** A group only auto-runs a countdown if *every* exercise
  still active in the current set is time-based. One rep-based exercise in the
  group forces manual confirmation for the whole group, otherwise the set log is
  skipped and the reps go unrecorded.
- **Uneven set counts.** An exercise whose `sets` is lower than the current set
  number drops out of the group and is shown as finished, rather than silently
  disappearing or being asked for again.

---

## Theme preset resolution

```mermaid
flowchart TD
    A[preset selected] --> B[clear every override<br/>property from :root]
    B --> C[apply data-theme = base theme]
    C --> D[compute accent tokens<br/>--primary, --primary-foreground, --ring]
    D --> E{foreground<br/>overridden?}
    E -->|yes| F[override text tokens]
    E -->|no| G
    F --> G{background<br/>overridden?}
    G -->|no| H[done — surfaces come<br/>entirely from the base theme]
    G -->|yes| I[derive surfaces from background<br/>card, sunken, border, muted, secondary]
    I --> H
```

The unconditional clear in the first step matters: a preset that inherits its
background emits no surface properties at all, so without it the previously
applied preset's background would survive on the root element and bleed into the
new one.

---

## Backup and restore

```mermaid
flowchart TD
    subgraph Export
        A[read every table] --> B[wrap in envelope<br/>kind: praxisos-backup<br/>formatVersion: 1]
        B --> C[save dialog → write JSON]
    end

    subgraph Restore
        D[open dialog → read JSON] --> E{envelope valid?}
        E -->|no| F[abort with a message<br/>database untouched]
        E -->|yes| G[confirm: this replaces everything]
        G -->|cancel| F
        G -->|confirm| H[BEGIN TRANSACTION]
        H --> I[delete all rows]
        I --> J[insert rows from backup]
        J --> K[COMMIT]
        K --> L[report row count<br/>+ missing media files]
    end
```

Restore is all-or-nothing. A malformed or partial file leaves the existing
database exactly as it was.

---

## Note search indexing

```mermaid
flowchart LR
    A[notes table] -->|AFTER INSERT| B[(notes_fts)]
    A -->|AFTER UPDATE| B
    A -->|AFTER DELETE| B
    C[search query] --> D[MATCH with prefix]
    D --> B
    B --> E[rank by bm25]
    E --> F[results]
```

The triggers keep the virtual table in sync, so no application code has to
remember to reindex after a write.
