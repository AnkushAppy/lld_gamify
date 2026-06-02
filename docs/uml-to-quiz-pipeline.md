# UML → Quiz Config Pipeline

To generate a `quiz_config.json` from an existing UML diagram, use a **reverse-engineering pipeline**. Since the game engine uses **Mermaid.js** syntax, the cleanest workflow is to feed your UML (raw Mermaid/PlantUML text or a diagram screenshot) into an LLM with a strict structural prompt that outputs the exact schema defined in the PRD.

Two approaches are supported:

| Approach | Best for | Output |
|----------|----------|--------|
| **LLM prompt** | Full quiz with skill tags, distractors, and explanations | Production-ready `quiz_config.json` |
| **Skeleton script** | Text-based `.mmd` files | Scaffold JSON with placeholder questions around real `uml_mutation` lines |

See also: [quiz-config-schema.md](quiz-config-schema.md), [content-structure.md](content-structure.md).

---

## LLM Prompt: Convert UML into Game JSON

Copy and paste the prompt below into an LLM (GPT-4o, Gemini Pro, etc.). Provide your source UML as **raw text** (PlantUML/Mermaid) or **upload a screenshot** of the diagram.

````text
You are an expert Low-Level Design (LLD) instructor. Your job is to analyze the provided UML diagram and reverse-engineer it into a structured, step-by-step game configuration JSON file based on the concept of "Blueprint Assembly".

Break the diagram down into 3-4 progressive levels.
- Level 1 must focus purely on leaf entities, their attributes, enums, and basic encapsulation.
- Level 2 must focus on structural relations (Composition, Aggregation, Inheritance).
- Level 3 must focus on interface behaviors, method signatures, or design patterns.
- Level 4 must focus on the main controller or system dashboard orchestrator.

Every question must have a 'skill_tag' matching the LLD Skill Matrix:
- Entity Identification
- Attribute Visibility
- State Modeling
- Multiplicity Mapping
- Structural Dependency
- Behavioral Polymorphism
- Method Signature Design

CRITICAL RULE FOR 'uml_mutation':
The game engine starts with a blank canvas ("classDiagram\n"). Each question's 'uml_mutation' must provide valid Mermaid.js syntax that increments the diagram.
- If a class is introduced for the first time, use: "class ClassName {\n}\n"
- If fields are added to an existing class, provide the updated class block containing those fields so it overwrites/updates the class block, or provide the fields directly depending on sequential composition.
- If a relationship is introduced, use valid lines like: "ClassName1 --> ClassName2 : relationship_name\n"

Output ONLY valid JSON matching this exact structure:
{
  "system_id": "unique_string_id",
  "system_title": "Human Readable Title",
  "levels": [
    {
      "level_index": 1,
      "title": "Level Title",
      "questions": [
        {
          "question_id": "l1_q1",
          "skill_tag": "Skill Name",
          "type": "radio",
          "text": "The multiple choice question text targeting the skill?",
          "choices": ["Option A", "Option B", "Option C"],
          "correct_answer": "Option A",
          "explanation": "Deep conceptual explanation of why Option A is correct based on LLD principles.",
          "uml_mutation": "The specific raw Mermaid string to append/inject into the diagram upon answering correctly."
        }
      ]
    }
  ]
}

Here is the UML input to parse:
[PASTE YOUR MERMAID TEXT / PLANTUML TEXT HERE OR UPLOAD IMAGE]
````

### After generation

1. Save the output to `content/<system_id>/quiz_config.json`.
2. Validate against [quiz-config-schema.md](quiz-config-schema.md).
3. Optionally run the skeleton validator script to sanity-check mutation sequencing (see below).

---

## Automated Script: Build and Validate Mutations

For text-based `.mmd` (Mermaid) files, use the Python utility at [`scripts/generate_skeleton_config.py`](../scripts/generate_skeleton_config.py) to scaffold a raw skeleton JSON. You (or an LLM) can then fill in questions, skill tags, and explanations around the actual mutation lines.

### Usage

```bash
# From a Mermaid file
python scripts/generate_skeleton_config.py \
  --system-id parking_lot \
  --title "Dynamic Parking Lot Design" \
  --input path/to/diagram.mmd \
  --output content/parking_lot/quiz_config.json

# From inline example (no file)
python scripts/generate_skeleton_config.py \
  --system-id parking_lot \
  --title "Parking Lot" \
  --demo
```

The script parses each non-empty Mermaid line (after `classDiagram`) into a placeholder question with the correct `uml_mutation` pre-filled.

---

## Pro-Tip: Managing `uml_mutation`

Mermaid handles duplicate class declarations gracefully. If question `l1_q1` injects:

```
class User {
}
```

and `l1_q2` injects:

```
class User {
    -String email
}
```

Mermaid.js will combine them or prioritize properties in the latest block. This makes writing mutations forgiving—prefer **full updated class blocks** for enrichment questions rather than worrying about exact line-level diffs.

### Authoring checklist

- [ ] First mention of a class → empty block (`class Foo {\n}\n`)
- [ ] Adding fields → full updated class block
- [ ] Relationships → append after both classes exist
- [ ] Each `skill_tag` maps to one LLD Skill Matrix entry
- [ ] Levels follow progression: entities → relations → behavior → orchestrator

---

## LLD Skill Matrix (reference)

| Skill tag | Typical level | What it assesses |
|-----------|---------------|------------------|
| Entity Identification | 1 | Naming and isolating core domain objects |
| Attribute Visibility | 1 | `+`, `-`, `#` encapsulation choices |
| State Modeling | 1–2 | Enums, state fields, lifecycle |
| Multiplicity Mapping | 2–3 | Cardinality on associations |
| Structural Dependency | 2 | Composition, aggregation, inheritance |
| Behavioral Polymorphism | 3 | Interfaces, abstract methods, overrides |
| Method Signature Design | 3–4 | Parameters, return types, contracts |
