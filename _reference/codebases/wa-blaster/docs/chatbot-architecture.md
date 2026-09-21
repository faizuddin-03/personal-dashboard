# Chatbot Architecture

How the AI chatbot module is wired, how a message flows through it, the exact decision tree, the
conversation state machine, and the module dependency graph. Diagrams are Mermaid (render on GitHub
or any Mermaid viewer).

See also: [README-chatbot.md](./README-chatbot.md) · [chatbot-runbook.md](./chatbot-runbook.md).

---

## 1. Data flow

A Meta webhook arrives, the (feature-flagged) bridge hands text inbounds to the orchestrator, the
orchestrator asks the decision engine what to do, persists the decision, then carries out the
verdict. Resolution capture runs asynchronously in the worker process.

```mermaid
sequenceDiagram
    autonumber
    participant Meta as Meta WhatsApp
    participant WH as WebhookController
    participant CB as ChatbotService<br/>(orchestrator)
    participant CV as ConversationService
    participant DE as DecisionEngine
    participant KB as Classifier / Retrieval / Drafter / Guardrails
    participant DB as Postgres (+pgvector)
    participant WA as ChatbotWhatsappService

    Meta->>WH: POST /api/webhooks/meta (signed)
    Note over WH: verify signature;<br/>skip unless CHATBOT_ENABLED=true
    WH->>CB: handleInbound({contacts, message})
    CB->>DB: find contact by phone (skip if unknown / non-text)
    CB->>CV: handleInbound() → find/create conversation + inbound msg
    CB->>CV: getCsWindowOpen()
    CB->>DE: decide({body, optedIn, csWindowOpen, businessName, conversationId})
    DE->>KB: classify → retrieve (embed + vector search) → draft → guardrails
    KB-->>DE: intent / chunks / draft / pass·fail
    DE-->>CB: Decision (kind, subKind, reason, draftBody?, sideEffects?, telemetry)
    CB->>DB: persist ChatbotDecision (audit) + log structured line
    alt AUTO_SEND
        CB->>WA: sendTextMessage(phone, draftBody)
        CB->>CV: recordAutoReply / recordEscalationOffer / clearOfferState
        CB->>DB: BotDraft (SENT) + citations  (rag_answer only)
    else ESCALATE
        CB->>CV: recordEscalation → PENDING BotDraft, state=ESCALATED
        opt consent_accepted_escalate
            CB->>WA: send ack first, then escalate original question
        end
    else IGNORE
        Note over CB: decision already persisted; nothing else
    end
```

**Resolution capture (separate, async):**

```mermaid
sequenceDiagram
    autonumber
    participant API as ConversationService.close()
    participant Q as BullMQ queue<br/>(chatbot-resolution-capture)
    participant WP as CaptureProcessor<br/>(worker process)
    participant RC as ResolutionCaptureService
    participant DB as Postgres

    API->>DB: state=RESOLVED + ResolutionCapture(status=pending)
    API->>Q: enqueue { captureId, conversationId } (attempts 3, backoff)
    Q->>WP: job
    WP->>RC: capture() — rebuild input from the row
    RC->>DB: dedup vs LIVE KB → KnowledgeDocument + chunks
    RC-->>WP: status=captured_live | captured_draft | skipped_* | failed
    Note over WP: re-throw on 'failed' so BullMQ retries
```

---

## 2. Decision tree

The exact order of checks in `DecisionEngine.decide()`. The first matching branch wins; later
branches never run. (`safety_escalate` is one sub-kind; its `reason` records the specific cause.)

```mermaid
flowchart TD
    A[inbound] --> B{enabled?}
    B -- no --> IG1[IGNORE / ignore_disabled]
    B -- yes --> C{disable_auto_reply?}
    C -- yes --> ES1[ESCALATE / safety_escalate<br/>kill_switch_active]
    C -- no --> D{contact opted in?}
    D -- no --> IG2[IGNORE / ignore_opted_out]
    D -- yes --> E{CS window open?}
    E -- no --> ES2[ESCALATE / safety_escalate<br/>cs_window_expired]
    E -- yes --> F{pending escalation?}
    F -- yes --> F1{confident RAG answer?}
    F1 -- yes --> RA1[AUTO_SEND / rag_answer]
    F1 -- no --> SP[AUTO_SEND / still_being_processed]
    F -- no --> G{offering escalation?}
    G -- yes --> G1{YES / NO / ambiguous?}
    G1 -- yes --> CAE[ESCALATE / consent_accepted_escalate]
    G1 -- no --> DEC[AUTO_SEND / escalation_declined_ack]
    G1 -- ambiguous --> H[clear offer, treat as new]
    G -- no --> H
    H --> I[classify]
    I -- LLM exhausted --> ESL[ESCALATE / safety_escalate<br/>llm_exhausted]
    I --> J{opt-out keywords?}
    J -- yes --> ESO[ESCALATE / safety_escalate<br/>opt_out_requested]
    J -- no --> K{complaint keywords?}
    K -- yes --> ESC[ESCALATE / safety_escalate<br/>complaint]
    K -- no --> L{intent confidence ≥ 0.6?}
    L -- no --> ESLO[ESCALATE / safety_escalate<br/>low_intent_confidence]
    L -- yes --> M[retrieve chunks]
    M -- embeddings exhausted --> ESE[ESCALATE / safety_escalate<br/>embeddings_exhausted]
    M --> N{any chunks?}
    N -- no --> CO1[AUTO_SEND / consent_offer<br/>no_kb + set offer state]
    N -- yes --> O[draft reply]
    O --> P{draft confidence ≥ threshold?}
    P -- no --> CO2[AUTO_SEND / consent_offer<br/>low_conf + set offer state]
    P -- yes --> R{guardrails pass?}
    R -- no --> ESG[ESCALATE / safety_escalate<br/>guardrail_*]
    R -- yes --> S{within business hours?}
    S -- no --> ESH[ESCALATE / safety_escalate<br/>out_of_hours]
    S -- yes --> RA2[AUTO_SEND / rag_answer<br/>approved]
```

---

## 3. Conversation state machine

`ConversationState` transitions. `handleInbound` never moves state on a follow-up — only the
engine's recorded outputs do. A conversation is closable (→ `RESOLVED`) from `REPLIED`,
`ESCALATED`, or `AWAITING_REPLY`.

```mermaid
stateDiagram-v2
    [*] --> NEW: first inbound
    NEW --> AUTO_REPLIED: rag_answer
    NEW --> ESCALATION_OFFERED: consent_offer
    NEW --> ESCALATED: safety_escalate
    AUTO_REPLIED --> ESCALATION_OFFERED: consent_offer
    AUTO_REPLIED --> ESCALATED: safety_escalate
    ESCALATION_OFFERED --> ESCALATED: customer says YES<br/>(consent_accepted_escalate)
    ESCALATION_OFFERED --> NEW: customer says NO<br/>(clear offer)
    ESCALATION_OFFERED --> AUTO_REPLIED: NO, with a prior substantive reply
    ESCALATED --> ESCALATED: follow-up → still_being_processed
    ESCALATED --> REPLIED: operator reply / draft approved
    ESCALATED --> AWAITING_REPLY: draft rejected
    REPLIED --> RESOLVED: close()
    ESCALATED --> RESOLVED: close()
    AWAITING_REPLY --> RESOLVED: close()
    RESOLVED --> [*]
```

---

## 4. Module dependencies

The orchestrator (`ChatbotModule`) and the REST surface (`ChatbotApiModule`) are registered in
`AppModule`; the capture processor runs only in `WorkerAppModule`. The BullMQ root is app-global
(supplied by `BlastsModule` / `BlastWorkerModule`), so the chatbot modules only *register the queue*,
never a second root.

```mermaid
flowchart TD
    App[AppModule] --> CBM[ChatbotModule<br/>ChatbotService]
    App --> CBA[ChatbotApiModule<br/>6 controllers]
    App --> CKM[chatbot KnowledgeModule]

    CBM --> CVM[ConversationsModule]
    CBM --> DM[DecisionModule]
    CBM --> WAM[ChatbotWhatsappModule]
    CBM --> SM[ChatbotSettingsModule]

    DM --> CLM[ClassifierModule]
    DM --> CKM
    DM --> DRM[DrafterModule]
    DM --> GM[GuardrailsModule]
    DM --> CVM
    DM --> SM

    CLM --> LLM[LlmModule<br/>router + Ollama/mock]
    DRM --> LLM
    CKM --> EMB[EmbeddingsModule<br/>bge-m3 / mock]
    CKM --> PG[(Postgres + pgvector)]
    CVM --> Q[[BullMQ: chatbot-resolution-capture]]

    Worker[WorkerAppModule] --> CWM[CaptureWorkerModule<br/>CaptureProcessor]
    CWM --> CKM
    CWM --> Q
    Q -. drained by .-> CWM
```

**Notes**

- `ChatbotService` is the only orchestrator entry point (`handleInbound`); it sequences side-effects
  the engine signals via `decision.sideEffects` and owns the chatbot's *own* Meta client (never the
  blasting one).
- `DecisionEngine` is pure logic — it never sends or persists; the orchestrator does.
- Retrieval is pure pgvector cosine similarity over `LIVE` documents' chunks (HNSW index).
- The worker process is the sole consumer of the capture queue; the API side only produces to it.
