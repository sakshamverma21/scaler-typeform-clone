from uuid import uuid4

from sqlalchemy.orm import Session

from app.db.models import Workspace
from app.schemas.forms import DraftDefinition, SaveDraft, SubmitResponse
from app.services.common import now
from app.services.forms import create_form, save_draft
from app.services.publishing import publish
from app.services.submissions import submit


def question(kind: str, title: str, choices: list[str] | None = None, *, required=True):
    return {
        "question_key": str(uuid4()),
        "type": kind,
        "title": title,
        "required": required,
        "description": "Sample question — edit this to make it your own.",
        "options": [{"option_key": str(uuid4()), "label": label} for label in choices or []],
    }


def seed_workspace(session: Session, workspace: Workspace) -> None:
    """Called inside the session-bootstrap transaction, never as a startup reset."""
    if workspace.seeded_at is not None:
        return
    definitions = [
        DraftDefinition(
            title="Sample: Product feedback",
            questions=[
                question("short_text", "What should we call you?"),
                question("email", "Where can we follow up?"),
                question(
                    "multiple_choice",
                    "How do you use the product?",
                    ["Work", "Learning", "Personal"],
                ),
                question("yes_no", "Would you recommend it?"),
                question("rating", "How was your experience?"),
                question("long_text", "What could we improve?", required=False),
            ],
        ),
        DraftDefinition(
            title="Sample: Event registration",
            questions=[
                question("short_text", "What is your name?"),
                question("email", "What is your email address?"),
                question(
                    "dropdown", "Which session interests you?", ["Design", "Engineering", "Product"]
                ),
                question("number", "How many guests will you bring?"),
                question("multiple_choice", "How will you attend?", ["In person", "Online"]),
                question("long_text", "Anything else we should know?", required=False),
            ],
        ),
    ]
    for dataset, definition in enumerate(definitions):
        form = create_form(session, workspace.id, definition.title)
        save_draft(session, form, SaveDraft(mutation_id=str(uuid4()), definition=definition), 0)
        version = publish(session, form, form.draft_revision)
        for index in range(12 if dataset == 0 else 8):
            answers = []
            for q in definition.questions:
                if not q.required and index % 3 == 0:
                    continue
                value = {
                    "short_text": f"Sample participant {index + 1}",
                    "email": f"person{index + 1}@example.com",
                    "long_text": "Synthetic response for the demo.\nNo real respondent data.",
                    "number": index % 4,
                    "yes_no": index % 3 != 0,
                    "rating": index % 5 + 1,
                }.get(q.type)
                if q.options:
                    value = q.options[index % len(q.options)].option_key
                answers.append({"question_key": q.question_key, "value": value})
            submit(
                session,
                form,
                SubmitResponse(version_id=version.id, submission_key=str(uuid4()), answers=answers),
                is_seed=True,
            )
    draft = create_form(session, workspace.id, "Sample: Your next idea")
    definition = DraftDefinition(
        title=draft.title,
        questions=[question("short_text", "What would you like to ask?", required=False)],
    )
    save_draft(session, draft, SaveDraft(mutation_id=str(uuid4()), definition=definition), 0)
    workspace.seeded_at = now()
    session.flush()
