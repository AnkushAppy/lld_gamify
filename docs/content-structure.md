# Content Structure

Each LLD system is a self-contained **system pack**—a folder containing a single JSON config file. The game engine discovers packs by scanning the `content/` directory. No static image assets are required; all UML output is generated dynamically via Mermaid mutations.

## Directory Layout

```
content/
├── lld/
│   └── <system_id>/
│       └── quiz_config.json
├── hld/
│   └── <system_id>/
│       └── quiz_config.json
└── clean_code/
    └── <system_id>/
        └── quiz_config.json
```

## File Responsibilities

### `quiz_config.json`

The single source of truth for a system pack. Defines:

- System metadata (`system_id`, `system_title`)
- Ordered list of levels with progression rules
- Questions with `skill_tag`, choices, correct answers, explanations
- `uml_mutation` strings applied on the client when the player answers correctly

Validated against the schema in [quiz-config-schema.md](quiz-config-schema.md).

## How Blueprint Assembly Works

Each question carries an `uml_mutation`—a fragment of Mermaid class diagram syntax. When the player answers correctly:

1. The client applies the mutation to local canvas state.
2. Mermaid re-renders the updated diagram.

When the player answers incorrectly, the canvas is untouched—the player retries until correct.

## Adding a New LLD System

1. Create `content/<system_id>/`.
2. Write `quiz_config.json` following the schema—design questions so each `uml_mutation` builds toward the final diagram.
3. Restart the API server—the new system appears on the dashboard automatically.

### Generating config from existing UML

If you already have a UML diagram (Mermaid, PlantUML, or screenshot), use the [UML → Quiz Pipeline](uml-to-quiz-pipeline.md):

- **LLM prompt** — full reverse-engineering into production-ready JSON with skill tags and explanations.
- **Copy an existing track** — duplicate a folder under `content/lld/`, `content/hld/`, or `content/clean_code/` and edit questions in place.

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| System folder | `snake_case` | `parking_lot`, `splitwise`, `elevator` |
| `system_id` in JSON | Must match folder name | `"system_id": "parking_lot"` |
| Question IDs | `l<level>_q<index>` | `l1_q1`, `l2_q3` |
| Skill tags | Title Case, descriptive | `"Entity Identification"`, `"Attribute Visibility"` |

## Authoring Tips for `uml_mutation`

- **Start with inserts:** First question for a class should use an empty class block (`class Foo {\n}\n`).
- **Use updates for enrichment:** Subsequent questions for the same class should supply the full updated block.
- **Add relationships last:** Association/composition lines are insertion mutations appended after classes exist.
- **Test mutations sequentially:** Each mutation should produce valid Mermaid when combined with all prior mutations.

## Example Pack

See [examples/parking_lot/quiz_config.example.json](examples/parking_lot/quiz_config.example.json) for a reference config demonstrating insert and update mutations.
