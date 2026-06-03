# Quiz Config Schema

This document defines the JSON contract between content authors and the game engine. The Node.js API validates configs against this spec at runtime.

## Top-Level Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `system_id` | `string` | yes | Unique identifier; must match the content folder name |
| `system_title` | `string` | yes | Human-readable title shown in the system selector |
| `levels` | `Level[]` | yes | Ordered list of levels (1-indexed via `level_index`) |

## Level Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `level_index` | `integer` | yes | 1-based level number; must be sequential |
| `title` | `string` | yes | Display title (e.g. "Level 1: Core Entity Definition") |
| `questions` | `Question[]` | yes | At least one question per level |

## Question Types

All questions share these common fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question_id` | `string` | yes | Unique within the system (e.g. `l1_q1`) |
| `skill_tag` | `string` | yes | LLD competency being assessed; displayed in UI |
| `type` | `string` | yes | One of: `radio`, `checkbox` |
| `text` | `string` | yes | The question prompt |
| `explanation` | `string` | yes | Design tip shown on incorrect answer, contextualized to the skill |
| `uml_mutation` | `string` | yes | Mermaid syntax applied to canvas on correct answer |

Type-specific fields are documented below.

### `radio` — Single Choice

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `choices` | `string[]` | yes | Answer options (min 2) |
| `correct_answer` | `string` | yes | Must exactly match one entry in `choices` |

```json
{
  "question_id": "l1_q1",
  "skill_tag": "Entity Identification",
  "type": "radio",
  "text": "What core domain entity represents a customer's proof of entry?",
  "choices": ["ParkingTicket", "ReceiptLogger", "TimeCounter"],
  "correct_answer": "ParkingTicket",
  "explanation": "A ParkingTicket is a core domain entity with a unique life cycle.",
  "uml_mutation": "class ParkingTicket {\n}\n"
}
```

### `checkbox` — Multiple Choice

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `choices` | `string[]` | yes | Answer options (min 2) |
| `correct_answers` | `string[]` | yes | Subset of `choices`; order does not matter |

```json
{
  "question_id": "l2_q1",
  "skill_tag": "Multiplicity Constraints",
  "type": "checkbox",
  "text": "Which multiplicities correctly describe ParkingLot to ParkingSpot?",
  "choices": ["1 to *", "* to 1", "1 to 1", "* to *"],
  "correct_answers": ["1 to *"],
  "explanation": "A ParkingLot contains many spots but each spot belongs to exactly one lot.",
  "uml_mutation": "ParkingLot \"1\" --> \"*\" ParkingSpot\n"
}
```

## `uml_mutation` Field

The mutation string is Mermaid class diagram syntax (without the `classDiagram` header). The backend prepends the header and manages the accumulated canvas.

### Insert Mutations

Append a new class block or relationship line:

```
class ParkingTicket {
}

ParkingLot "1" --> "*" ParkingSpot
```

### Update Mutations

Replace an existing class block with an expanded version. The mutation must include the **complete** updated block:

```
class ParkingTicket {
    - LocalDateTime issuedAt
}
```

The mutation engine matches on class name to determine insert vs. update.

## Validation Rules

1. `system_id` must be non-empty and match the parent folder name.
2. `levels` must contain at least one level with sequential `level_index` values starting at 1.
3. Each level must contain at least one question.
4. All `question_id` values must be unique within a system pack.
5. All questions must have a non-empty `skill_tag` and `uml_mutation`.
6. `correct_answer` / `correct_answers` values must reference entries defined in `choices`.
7. `uml_mutation` strings must be valid Mermaid class diagram syntax.

## LLD Skill Matrix

When authoring or generating configs, every question's `skill_tag` should map to one of these competencies:

| Skill tag | Typical level | What it assesses |
|-----------|---------------|------------------|
| Entity Identification | 1 | Naming and isolating core domain objects |
| Attribute Visibility | 1 | `+`, `-`, `#` encapsulation choices |
| State Modeling | 1–2 | Enums, state fields, lifecycle |
| Multiplicity Mapping | 2–3 | Cardinality on associations |
| Structural Dependency | 2 | Composition, aggregation, inheritance |
| Behavioral Polymorphism | 3 | Interfaces, abstract methods, overrides |
| Method Signature Design | 3–4 | Parameters, return types, contracts |

To auto-generate configs from existing UML, see [uml-to-quiz-pipeline.md](uml-to-quiz-pipeline.md).

## Full Example

See [examples/parking_lot/quiz_config.example.json](examples/parking_lot/quiz_config.example.json).
