# Product Requirement Document (PRD) v2

## Project Name: LLD Speedrun Gamifier (Blueprint Assembly Edition)

### 1. Product Overview

The LLD Speedrun Gamifier is an interactive, browser-based pedagogical tool designed to teach software engineers low-level system design patterns in 10–15 minutes. Instead of studying static, pre-rendered architecture documents, players dynamically construct an entire system's UML diagram from a blank canvas. By answering structured questions correctly, users inject classes, attributes, visibility modifiers, enums, and relationships directly into a live-updating visual canvas.

### 2. Core Objectives

- **Constructive Learning:** Shift the user from passive observer to active architect by making the UML diagram the reward for passing a question.
- **Skill-Driven Progression:** Every question explicitly isolates and assesses a distinct LLD competency (e.g., Encapsulation, State Modeling, Multiplicity).
- **Zero Asset Dependency:** Eliminate the need for pre-cropped image files by using text-to-diagram generation (Mermaid.js) rendered directly in the UI.

---

### 3. The Blueprint Assembly Journey

Unlike static quizzes, the game state accumulates structural syntax over time.

```
[Start Game]
     |
     v
[Question 1: Define Entity]  ──(Correct Answer)──> Live Canvas adds: `class ParkingTicket`
     |
     v
[Question 2: Access Control] ──(Correct Answer)──> Live Canvas adds: `- LocalDateTime issuedAt`
     |
     v
[Level Complete]             ──(Final Output)───> Fully rendered system model
```

---

### 4. Functional Requirements

#### 4.1 Game State & Mutation Engine (Frontend)

- **Canvas state:** React holds the running Mermaid string per session, initialized from `initial_canvas` on the config or level.
- **Mutation application:** On a correct validation response, the client applies the question's `uml_mutation` (snapshot, style, or incremental merge).
  - *Insertion mutations:* Append a new class block or association line.
  - *Update mutations:* Replace an existing class block with an expanded version.
- **Retry buffer:** Incorrect answers return failure from the API without changing local canvas state.

See [architecture.md](architecture.md) for mutation engine design details.

#### 4.2 Dynamic UI Rendering (Frontend)

- **Live Diagram Component:** The frontend must natively process and draw visual class diagrams on-the-fly using Markdown blocks wrapped in code fences:

````markdown
```mermaid
classDiagram
%% Dynamic updates injection zone
```
````

- **Adaptive Input Layouts:** Form elements (radio buttons for single choices, checkboxes for multi-selection) must clear out and reconstruct automatically when transitioning between questions.

#### 4.3 Skill Mapping & Diagnostics

- Every question must log its target `skill_tag` to the user interface.
- If a question is failed, the system must render an explicit explanation contextualizing why that design decision fails the respective LLD skill constraint.

---

### 5. Unified Technical Stack

- **Frontend:** React, Vite, Tailwind CSS, Mermaid.js (live canvas + question UI; client-side mutation engine).
- **Game Engine API:** Node.js, Express (stateless track discovery, config sanitization, answer validation).
- **Data Definition Layer:** JSON quiz configs under `content/{lld,hld,clean_code}/`.

```
+--------------------------------------------------+
|              React + Vite Frontend               |
| (Live Mermaid canvas, meters, question forms)    |
+------------------------+-------------------------+
                         |  /api REST
                         v
+--------------------------------------------------+
|              Express API (server/)               |
| (Track discovery, validation, config sanitization) |
+------------------------+-------------------------+
                         |  Reads
                         v
                  [quiz_config.json]
```

See [architecture.md](architecture.md) for component responsibilities and API surface.

---

### 6. Final Data Contract Schema (`quiz_config.json`)

To facilitate the mutation logic, the layout splits updates into distinct structural additions (`uml_mutation` inserts syntax directly into the game canvas):

```json
{
  "system_id": "parking_lot_dynamic",
  "system_title": "Dynamic Parking Lot Design",
  "levels": [
    {
      "level_index": 1,
      "title": "Level 1: Core Entity Definition",
      "questions": [
        {
          "question_id": "l1_q1",
          "skill_tag": "Entity Identification",
          "type": "radio",
          "text": "What core domain entity represents a customer's proof of entry and tracks time constraints?",
          "choices": ["ParkingTicket", "ReceiptLogger", "TimeCounter"],
          "correct_answer": "ParkingTicket",
          "explanation": "A ParkingTicket is a core domain entity with a unique life cycle and identity tracking identity over time.",
          "uml_mutation": "class ParkingTicket {\n}\n"
        },
        {
          "question_id": "l1_q2",
          "skill_tag": "Attribute Visibility",
          "type": "radio",
          "text": "The creation timestamp on the ticket must not be modified by external classes post-issuance. What visibility fits best?",
          "choices": ["+ LocalDateTime issuedAt", "- LocalDateTime issuedAt", "# LocalDateTime issuedAt"],
          "correct_answer": "- LocalDateTime issuedAt",
          "explanation": "Private visibility (-) enforces structural encapsulation, allowing readers via accessors while locking mutations out.",
          "uml_mutation": "class ParkingTicket {\n    - LocalDateTime issuedAt\n}\n"
        }
      ]
    }
  ]
}
```

See [quiz-config-schema.md](quiz-config-schema.md) for the full schema specification.

---

### 7. Scope Boundaries (Out of Scope for MVP)

- **No Backward Deletions:** If a user passes a question, they cannot roll back to change past answers within the current execution sequence.
- **No Manual Text Coding:** Users never write raw code or Mermaid text themselves; they make strategic architectural choices, and the system translates those choices into visual syntax.
- **No Authentication:** No login or persistent user accounts. Sessions live purely in-memory on the active application.
- **No Leaderboards:** The only goal is achieving a 100% completion rate and a fully assembled diagram.
