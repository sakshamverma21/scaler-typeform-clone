import base64
import copy
import json
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Barrier, Event
from uuid import uuid4

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from fastapi.testclient import TestClient
from sqlalchemy import event, func, select, text
from sqlalchemy.exc import IntegrityError, OperationalError

from app.db.migrations import migration_config, upgrade_database
from app.db.models import Answer, Base, CreatorSession, Form, FormResponse, Question, QuestionOption
from app.db.session import create_database_engine
from app.main import create_app
from app.services import submissions
from app.services.common import now

ORIGIN = {"Origin": "http://localhost:3000"}
CREATOR = "/api/v1/creator"
PUBLIC = "/api/v1/public/forms"


def write(client, method, path, *, revision=None, **kwargs):
    headers = {**ORIGIN}
    if revision is not None:
        headers["If-Match"] = f'"{revision}"'
    return client.request(method, path, headers=headers, **kwargs)


@pytest.fixture
def creator(client):
    assert write(client, "POST", f"{CREATOR}/session").status_code == 200
    return client


def question(kind="short_text", *, required=True, choices=None):
    result = {
        "question_key": str(uuid4()),
        "type": kind,
        "title": f"Prompt: {kind}",
        "description": "Help text",
        "required": required,
        "options": [{"option_key": str(uuid4()), "label": label} for label in choices or []],
    }
    if kind == "rating":
        result["rating_max"] = 5
    return result


def all_types():
    return [
        question(
            kind, choices=["First", "Second"] if kind in {"multiple_choice", "dropdown"} else None
        )
        for kind in [
            "short_text",
            "long_text",
            "multiple_choice",
            "dropdown",
            "email",
            "number",
            "yes_no",
            "rating",
        ]
    ]


def save(client, form_id, definition, revision, mutation=None):
    return write(
        client,
        "PUT",
        f"{CREATOR}/forms/{form_id}/draft",
        revision=revision,
        json={"mutation_id": mutation or str(uuid4()), "definition": definition},
    )


def create(client, questions=None):
    created = write(client, "POST", f"{CREATOR}/forms", json={"title": "Integration form"})
    assert created.status_code == 201, created.text
    form_id = created.json()["form"]["id"]
    definition = created.json()["draft"]
    definition["questions"] = questions if questions is not None else [question()]
    saved = save(client, form_id, definition, 0)
    assert saved.status_code == 200, saved.text
    return form_id, saved.json()["draft"]


def publish(client, form_id, revision=1):
    response = write(client, "POST", f"{CREATOR}/forms/{form_id}/publish", revision=revision)
    assert response.status_code == 200, response.text
    slug = response.json()["public_slug"]
    return slug, client.get(f"{PUBLIC}/{slug}").json()


def payload(version, questions, values):
    return {
        "version_id": version["version_id"],
        "submission_key": str(uuid4()),
        "answers": [
            {"question_key": q["question_key"], "value": value}
            for q, value in zip(questions, values, strict=True)
        ],
    }


def post_response(client, slug, body):
    return write(client, "POST", f"{PUBLIC}/{slug}/responses", json=body)


def test_seed_bootstrap_isolated_once_and_deleted_samples_stay_deleted(creator):
    first = write(creator, "POST", f"{CREATOR}/session").json()
    forms = creator.get(f"{CREATOR}/forms").json()["items"]
    assert len(forms) == 3
    assert sorted(f["response_count"] for f in forms) == [0, 8, 12]
    assert all(f["seed_response_count"] == f["response_count"] for f in forms)
    types = set()
    for form in forms:
        detail = creator.get(f"{CREATOR}/forms/{form['id']}").json()
        types.update(q["type"] for q in detail["draft"]["questions"])
        if form["is_published"]:
            summary = creator.get(f"{CREATOR}/forms/{form['id']}/summary").json()
            assert summary["seed_response_count"] == form["response_count"]
            responses = creator.get(f"{CREATOR}/forms/{form['id']}/responses").json()["items"]
            assert all(r["is_seed"] for r in responses)
    assert types == {q["type"] for q in all_types()}
    for form in forms:
        assert write(creator, "DELETE", f"{CREATOR}/forms/{form['id']}").status_code == 200
    assert write(creator, "POST", f"{CREATOR}/session").json() == first
    assert creator.get(f"{CREATOR}/forms").json()["items"] == []
    old_cookie = creator.cookies.get("typeform_creator")
    creator.cookies.clear()
    second = write(creator, "POST", f"{CREATOR}/session").json()
    assert second["workspace_id"] != first["workspace_id"]
    assert creator.cookies.get("typeform_creator") != old_cookie
    assert len(creator.get(f"{CREATOR}/forms").json()["items"]) == 3


def test_session_cookie_hash_expiry_and_secure_production(settings):
    settings.environment = "production"
    with TestClient(create_app(settings), base_url="https://testserver") as client:
        response = write(client, "POST", f"{CREATOR}/session")
        cookie = response.headers["set-cookie"]
        assert "HttpOnly" in cookie and "Secure" in cookie and "SameSite=lax" in cookie
        assert "Path=/" in cookie and "Max-Age=2592000" in cookie
        token = client.cookies.get("typeform_creator")
        old_workspace = response.json()["workspace_id"]
        with client.app.state.session_factory() as db:
            row = db.scalar(select(CreatorSession))
            assert row.token_hash != token and len(row.token_hash) == 64
            row.expires_at = now() - timedelta(seconds=1)
            db.commit()
        assert client.get(f"{CREATOR}/forms").status_code == 401
        assert write(client, "POST", f"{CREATOR}/session").json()["workspace_id"] != old_workspace


def test_existing_session_concurrent_bootstrap_does_not_duplicate_seeds(creator):
    gate = Barrier(4)

    def bootstrap(_):
        gate.wait()
        return write(creator, "POST", f"{CREATOR}/session").json()["workspace_id"]

    with ThreadPoolExecutor(max_workers=4) as pool:
        assert len(set(pool.map(bootstrap, range(4)))) == 1
    assert len(creator.get(f"{CREATOR}/forms").json()["items"]) == 3


def test_missing_auth_and_disallowed_origin(client):
    assert client.get(f"{CREATOR}/forms").status_code == 401
    assert client.post(f"{CREATOR}/session").status_code == 403
    assert (
        client.post(f"{CREATOR}/session", headers={"Origin": "https://foreign.example"}).status_code
        == 403
    )
    assert client.get(f"{PUBLIC}/missing").status_code == 404


def test_crud_reorder_duplicate_independence_and_cascades(creator):
    form_id, definition = create(creator, all_types())
    definition["questions"] = list(reversed(definition["questions"]))
    saved = save(creator, form_id, definition, 1)
    assert saved.status_code == 200 and saved.headers["etag"] == '"2"'
    assert creator.get(f"{CREATOR}/forms/{form_id}").json()["draft"] == definition
    slug, version = publish(creator, form_id, 2)
    assert version["definition"] == definition
    copy_response = write(creator, "POST", f"{CREATOR}/forms/{form_id}/duplicate", revision=2)
    clone = copy_response.json()
    assert clone["form"]["response_count"] == 0 and not clone["form"]["is_published"]
    assert clone["form"]["public_slug"] is None
    assert [q["type"] for q in clone["draft"]["questions"]] == [
        q["type"] for q in definition["questions"]
    ]
    assert {q["question_key"] for q in clone["draft"]["questions"]}.isdisjoint(
        q["question_key"] for q in definition["questions"]
    )
    clone["draft"]["questions"].pop()
    assert save(creator, clone["form"]["id"], clone["draft"], 0).status_code == 200
    assert len(creator.get(f"{CREATOR}/forms/{form_id}").json()["draft"]["questions"]) == 8
    renamed = write(
        creator, "PATCH", f"{CREATOR}/forms/{form_id}", revision=2, json={"title": "Renamed"}
    )
    assert renamed.json()["form"]["public_slug"] == slug
    assert renamed.json()["draft"]["title"] == "Renamed"
    assert creator.get(f"{PUBLIC}/{slug}").json()["definition"]["title"] == "Integration form"
    assert write(creator, "DELETE", f"{CREATOR}/forms/{form_id}").status_code == 200
    assert creator.get(f"{PUBLIC}/{slug}").status_code == 404
    with creator.app.state.session_factory() as db:
        assert db.get(Form, form_id) is None
        assert (
            db.scalar(
                select(func.count(Question.id)).where(Question.version_id == version["version_id"])
            )
            == 0
        )
        assert db.execute(text("PRAGMA foreign_key_check")).all() == []
    assert creator.get(f"{CREATOR}/forms/{clone['form']['id']}").status_code == 200


def test_save_retry_conflicts_and_out_of_order_revisions(creator):
    form_id, definition = create(creator)
    mutation = str(uuid4())
    definition["questions"][0]["title"] = "Changed"
    assert save(creator, form_id, definition, 1, mutation).status_code == 200
    assert save(creator, form_id, definition, 1, mutation).json()["form"]["draft_revision"] == 2
    definition["title"] = "Other payload"
    assert save(creator, form_id, definition, 2, mutation).status_code == 409
    assert save(creator, form_id, definition, 1).status_code == 412
    assert save(creator, form_id, definition, 2).status_code == 200
    assert save(creator, form_id, definition, 2, mutation).status_code == 412
    for method, suffix, body in [
        ("PATCH", "", {"title": "Stale"}),
        ("POST", "/duplicate", None),
        ("POST", "/publish", None),
    ]:
        assert (
            write(
                creator, method, f"{CREATOR}/forms/{form_id}{suffix}", revision=2, json=body
            ).status_code
            == 412
        )
    assert (
        write(
            creator, "PATCH", f"{CREATOR}/forms/{form_id}", json={"title": "No revision"}
        ).status_code
        == 428
    )
    assert (
        creator.patch(
            f"{CREATOR}/forms/{form_id}",
            headers={**ORIGIN, "If-Match": "3"},
            json={"title": "Bad header"},
        ).status_code
        == 422
    )


@pytest.mark.parametrize(
    "mutate",
    [
        lambda d: d.update(title=""),
        lambda d: d.update(questions=[]),
        lambda d: d["questions"][0].update(title=" "),
        lambda d: d["questions"][0].update(type="multiple_choice", options=[]),
        lambda d: d["questions"][0].update(
            type="dropdown", options=[{"option_key": str(uuid4()), "label": " "}]
        ),
    ],
)
def test_incomplete_drafts_save_but_cannot_publish(creator, mutate):
    form_id, definition = create(creator)
    mutate(definition)
    assert save(creator, form_id, definition, 1).status_code == 200
    failed = write(creator, "POST", f"{CREATOR}/forms/{form_id}/publish", revision=2)
    assert failed.status_code == 422 and failed.json()["errors"]
    assert not creator.get(f"{CREATOR}/forms/{form_id}").json()["form"]["is_published"]


@pytest.mark.parametrize(
    "mutate",
    [
        lambda d: d["questions"].append(copy.deepcopy(d["questions"][0])),
        lambda d: d["questions"][0].update(type="file_upload"),
        lambda d: d["questions"][0].update(required="false"),
        lambda d: d["questions"][0].update(rating_max=5),
        lambda d: d["questions"][0].update(options=[{"option_key": str(uuid4()), "label": "X"}]),
        lambda d: d.update(title="x" * 201),
        lambda d: d.update(theme_settings={"font": "arbitrary"}),
        lambda d: d.update(extra="unsupported"),
    ],
)
def test_structurally_invalid_drafts_rejected_without_changes(creator, mutate):
    form_id, definition = create(creator)
    previous = copy.deepcopy(definition)
    mutate(definition)
    assert save(creator, form_id, definition, 1).status_code == 422
    assert creator.get(f"{CREATOR}/forms/{form_id}").json()["draft"] == previous


def test_all_types_roundtrip_and_exact_summary(creator):
    form_id, definition = create(creator, all_types())
    slug, version = publish(creator, form_id)
    qs = definition["questions"]
    values = [
        "  Saksham  ",
        "First line\nSecond line",
        qs[2]["options"][0]["option_key"],
        qs[3]["options"][1]["option_key"],
        "  person@example.com  ",
        0,
        False,
        5,
    ]
    body = payload(version, qs, values)
    creator.cookies.clear()  # Public endpoints do not require creator authentication.
    response = post_response(creator, slug, body)
    assert response.status_code == 201, response.text
    assert post_response(creator, slug, body).json() == response.json()
    # Read storage directly because this browser deliberately dropped its creator cookie.
    with creator.app.state.session_factory() as db:
        row = db.get(FormResponse, response.json()["id"])
        assert row and not row.is_seed
        answers = db.scalars(select(Answer).where(Answer.response_id == row.id)).all()
        assert len(answers) == 8
        assert any(a.integer_value == 0 for a in answers)
        assert any(a.boolean_value is False for a in answers)
        assert any(a.text_value == "Saksham" for a in answers)


def test_statistics_skips_zero_false_choice_counts_and_empty_summary(creator):
    qs = all_types()
    for q in qs:
        q["required"] = False
    form_id, definition = create(creator, qs)
    slug, version = publish(creator, form_id)
    empty = creator.get(f"{CREATOR}/forms/{form_id}/summary").json()
    assert empty["response_count"] == 0 and all(q["mean"] is None for q in empty["questions"])
    qs = definition["questions"]
    for number, boolean, rating in [(0, False, 1), (4, True, 5)]:
        values = [
            "Text",
            "Text\nAgain",
            qs[2]["options"][0]["option_key"],
            qs[3]["options"][1]["option_key"],
            "person@example.com",
            number,
            boolean,
            rating,
        ]
        assert post_response(creator, slug, payload(version, qs, values)).status_code == 201
    skipped = {"version_id": version["version_id"], "submission_key": str(uuid4()), "answers": []}
    assert post_response(creator, slug, skipped).status_code == 201
    summary = creator.get(f"{CREATOR}/forms/{form_id}/summary").json()
    assert summary["response_count"] == 3 and summary["seed_response_count"] == 0
    stats = {q["type"]: q for q in summary["questions"]}
    assert all(q["answered_count"] == 2 and q["skipped_count"] == 1 for q in stats.values())
    assert (
        stats["number"]["minimum"] == 0
        and stats["number"]["maximum"] == 4
        and stats["number"]["mean"] == 2
    )
    assert stats["rating"]["mean"] == 3
    assert [b["count"] for b in stats["multiple_choice"]["distribution"]] == [2, 0]
    assert [b["percentage"] for b in stats["yes_no"]["distribution"]] == [50, 50]
    assert [b["value"] for b in stats["yes_no"]["distribution"]] == [True, False]
    listed = creator.get(f"{CREATOR}/forms/{form_id}/responses").json()["items"]
    assert len(listed) == 3 and all(len(r["preview"]) == 3 for r in listed)
    detail = creator.get(f"{CREATOR}/forms/{form_id}/responses/{listed[0]['id']}").json()
    assert len(detail["answers"]) == 8 and all(a["skipped"] for a in detail["answers"])
    assert creator.get(f"{CREATOR}/forms/{form_id}").json()["form"]["response_count"] == 3
    unpub, _ = create(creator)
    assert creator.get(f"{CREATOR}/forms/{unpub}/summary").json()["version_id"] is None


@pytest.mark.parametrize(
    ("kind", "value"),
    [
        ("short_text", " "),
        ("short_text", "x" * 1000),
        ("short_text", "two\nlines"),
        ("short_text", 1),
        ("long_text", "x" * 10001),
        ("long_text", False),
        ("email", "no-at-sign"),
        ("email", "a..b@example.com"),
        ("email", "a@-bad.com"),
        ("number", -1),
        ("number", 1.5),
        ("number", True),
        ("number", "5"),
        ("number", 10**15),
        ("yes_no", "false"),
        ("yes_no", 0),
        ("rating", 0),
        ("rating", 6),
        ("rating", 1.5),
        ("multiple_choice", str(uuid4())),
        ("dropdown", "First"),
    ],
)
def test_invalid_direct_answers_rejected(creator, kind, value):
    form_id, definition = create(
        creator,
        [
            question(
                kind,
                choices=["First", "Second"] if kind in {"multiple_choice", "dropdown"} else None,
            )
        ],
    )
    slug, version = publish(creator, form_id)
    failed = post_response(creator, slug, payload(version, definition["questions"], [value]))
    assert failed.status_code == 422, failed.text
    assert all(
        e.get("question_key") == definition["questions"][0]["question_key"]
        for e in failed.json()["errors"]
    )
    assert creator.get(f"{CREATOR}/forms/{form_id}").json()["form"]["response_count"] == 0


@pytest.mark.parametrize(
    ("kind", "value"),
    [
        ("short_text", "✓" * 999),
        ("long_text", "x" * 10000),
        ("email", "a+b@例え.テスト"),
        ("number", 999999999999999),
        ("yes_no", False),
        ("rating", 1),
    ],
)
def test_valid_boundaries_accepted(creator, kind, value):
    form_id, definition = create(creator, [question(kind)])
    slug, version = publish(creator, form_id)
    assert (
        post_response(creator, slug, payload(version, definition["questions"], [value])).status_code
        == 201
    )


def test_required_unknown_duplicate_and_wrong_version_answers(creator):
    form_id, definition = create(creator, all_types())
    slug, version = publish(creator, form_id)
    body = {"version_id": version["version_id"], "submission_key": str(uuid4()), "answers": []}
    assert len(post_response(creator, slug, body).json()["errors"]) == 8
    body["answers"] = [{"question_key": str(uuid4()), "value": "Unknown"}]
    assert post_response(creator, slug, body).status_code == 422
    body["answers"] = [
        {"question_key": definition["questions"][0]["question_key"], "value": "A"}
    ] * 2
    assert "twice" in str(post_response(creator, slug, body).json())
    other, _ = create(creator)
    _, other_version = publish(creator, other)
    body["version_id"] = other_version["version_id"]
    assert post_response(creator, slug, body).status_code == 422
    body["version_id"] = creator.get(f"{CREATOR}/forms/{form_id}").json()["form"]["id"]
    assert post_response(creator, slug, body).status_code == 422


def test_publication_history_old_answers_epochs_and_retry_after_close(creator):
    form_id, definition = create(
        creator, [question("multiple_choice", choices=["Original", "Second"])]
    )
    slug, old = publish(creator, form_id)
    body = payload(
        old, definition["questions"], [definition["questions"][0]["options"][0]["option_key"]]
    )
    receipt = post_response(creator, slug, body)
    assert receipt.status_code == 201
    publish(creator, form_id)  # Publishing unchanged content is idempotent.
    assert len(creator.get(f"{CREATOR}/forms/{form_id}/versions").json()["items"]) == 1
    definition["questions"] = [question("number")]
    assert save(creator, form_id, definition, 1).status_code == 200
    assert creator.get(f"{PUBLIC}/{slug}").json() == old
    same_slug, new = publish(creator, form_id, 2)
    assert same_slug == slug and new["version_number"] == 2
    older = copy.deepcopy(body)
    older["submission_key"] = str(uuid4())
    assert post_response(creator, slug, older).status_code == 201  # Still the same open period.
    detail = creator.get(f"{CREATOR}/forms/{form_id}/responses/{receipt.json()['id']}").json()
    assert detail["answers"][0]["display_value"] == "Original"
    assert creator.get(f"{CREATOR}/forms/{form_id}/summary").json()["response_count"] == 0
    assert (
        creator.get(f"{CREATOR}/forms/{form_id}/summary?version_id={old['version_id']}").json()[
            "response_count"
        ]
        == 2
    )
    assert write(creator, "POST", f"{CREATOR}/forms/{form_id}/unpublish").status_code == 200
    assert creator.get(f"{PUBLIC}/{slug}").status_code == 410
    assert post_response(creator, slug, body).json() == receipt.json()
    older["submission_key"] = str(uuid4())
    assert post_response(creator, slug, older).status_code == 410
    assert publish(creator, form_id, 2)[0] == slug
    assert post_response(creator, slug, older).status_code == 410
    current = creator.get(f"{PUBLIC}/{slug}").json()
    assert current["version_number"] == 3
    assert (
        post_response(creator, slug, payload(current, definition["questions"], [0])).status_code
        == 201
    )


def test_retry_normalization_conflict_and_concurrent_duplicates(creator):
    form_id, definition = create(creator)
    slug, version = publish(creator, form_id)
    body = payload(version, definition["questions"], ["  Same answer  "])
    gate = Barrier(6)

    def submission(_):
        gate.wait()
        return post_response(creator, slug, body)

    with ThreadPoolExecutor(max_workers=6) as pool:
        receipts = list(pool.map(submission, range(6)))
    assert all(r.status_code == 201 for r in receipts)
    assert len({r.json()["id"] for r in receipts}) == 1
    body["answers"][0]["value"] = "Same answer"
    assert post_response(creator, slug, body).status_code == 201
    body["answers"][0]["value"] = "Different"
    assert post_response(creator, slug, body).status_code == 409
    assert creator.get(f"{CREATOR}/forms/{form_id}").json()["form"]["response_count"] == 1


def test_competing_draft_saves_and_different_submission_payloads(creator):
    form_id, definition = create(creator)
    gate = Barrier(2)

    def competing_save(title):
        candidate = copy.deepcopy(definition)
        candidate["title"] = title
        gate.wait()
        return save(creator, form_id, candidate, 1)

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(competing_save, ["First tab", "Second tab"]))
    assert sorted(r.status_code for r in results) == [200, 412]
    persisted = creator.get(f"{CREATOR}/forms/{form_id}").json()
    assert persisted["form"]["draft_revision"] == 2
    assert persisted["draft"]["title"] == next(
        r.json()["draft"]["title"] for r in results if r.status_code == 200
    )
    slug, version = publish(creator, form_id, 2)
    first = payload(version, definition["questions"], ["First answer"])
    second = copy.deepcopy(first)
    second["answers"][0]["value"] = "Other answer"
    gate = Barrier(2)

    def competing_submission(body):
        gate.wait()
        return post_response(creator, slug, body)

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(competing_submission, [first, second]))
    assert sorted(r.status_code for r in results) == [201, 409]
    assert creator.get(f"{CREATOR}/forms/{form_id}").json()["form"]["response_count"] == 1


def test_deleting_sample_form_cascades_responses_and_preserves_other_samples(creator):
    samples = creator.get(f"{CREATOR}/forms").json()["items"]
    form = next(f for f in samples if f["response_count"] == 12)
    with creator.app.state.session_factory() as db:
        response_ids = list(
            db.scalars(select(FormResponse.id).where(FormResponse.form_id == form["id"]))
        )
    assert write(creator, "DELETE", f"{CREATOR}/forms/{form['id']}").status_code == 200
    with creator.app.state.session_factory() as db:
        assert (
            db.scalar(select(func.count(FormResponse.id)).where(FormResponse.id.in_(response_ids)))
            == 0
        )
        assert (
            db.scalar(select(func.count(Answer.id)).where(Answer.response_id.in_(response_ids)))
            == 0
        )
        assert db.scalar(select(func.count(FormResponse.id))) == 8
        assert db.execute(text("PRAGMA foreign_key_check")).all() == []


def test_version_pagination_and_choice_keys_are_scoped_to_question(creator):
    qs = [
        question("multiple_choice", choices=["First", "Second"]),
        question("dropdown", choices=["Third"]),
    ]
    form_id, definition = create(creator, qs)
    slug, old = publish(creator, form_id)
    wrong = payload(
        old,
        definition["questions"],
        [qs[1]["options"][0]["option_key"], qs[1]["options"][0]["option_key"]],
    )
    assert post_response(creator, slug, wrong).status_code == 422
    for revision in [1, 2]:
        definition["questions"][0]["title"] += " edit"
        assert save(creator, form_id, definition, revision).status_code == 200
        publish(creator, form_id, revision + 1)
    path = f"{CREATOR}/forms/{form_id}/versions"
    one = creator.get(path, params={"limit": 2}).json()
    two = creator.get(path, params={"limit": 2, "cursor": one["next_cursor"]}).json()
    assert [v["version_number"] for v in one["items"] + two["items"]] == [3, 2, 1]
    assert two["next_cursor"] is None


def test_seed_failure_rolls_back_entire_workspace(client):
    engine = client.app.state.engine

    def fail_answers(connection, cursor, statement, parameters, context, executemany):
        if statement.startswith("INSERT INTO answers"):
            raise OperationalError(statement, parameters, RuntimeError("seed failure"))

    event.listen(engine, "before_cursor_execute", fail_answers)
    try:
        response = write(client, "POST", f"{CREATOR}/session")
        assert response.status_code == 503 and "set-cookie" not in response.headers
    finally:
        event.remove(engine, "before_cursor_execute", fail_answers)
    with engine.connect() as db:
        for table in ["workspaces", "creator_sessions", "forms", "responses", "answers"]:
            assert db.execute(text(f"SELECT count(*) FROM {table}")).scalar() == 0
    assert write(client, "POST", f"{CREATOR}/session").status_code == 200


def test_unpublish_waits_for_inflight_write_and_blocks_later_submission(creator, monkeypatch):
    form_id, definition = create(creator)
    slug, version = publish(creator, form_id)
    body = payload(version, definition["questions"], ["Before close"])
    entered, release = Event(), Event()
    original = submissions.submit

    def held(*args, **kwargs):
        entered.set()
        assert release.wait(3)
        return original(*args, **kwargs)

    monkeypatch.setattr(submissions, "submit", held)
    with ThreadPoolExecutor(max_workers=2) as pool:
        response = pool.submit(post_response, creator, slug, body)
        assert entered.wait(3)
        closing = pool.submit(write, creator, "POST", f"{CREATOR}/forms/{form_id}/unpublish")
        release.set()
        assert response.result().status_code == 201
        assert closing.result().status_code == 200
    body["submission_key"] = str(uuid4())
    assert post_response(creator, slug, body).status_code == 410


def test_submission_failure_rolls_back_response_and_answers(creator):
    form_id, definition = create(creator)
    slug, version = publish(creator, form_id)

    def fail_answer(connection, cursor, statement, parameters, context, executemany):
        if statement.startswith("INSERT INTO answers"):
            raise OperationalError(statement, parameters, RuntimeError("simulated disk failure"))

    engine = creator.app.state.engine
    event.listen(engine, "before_cursor_execute", fail_answer)
    body = payload(version, definition["questions"], ["Keep me"])
    try:
        assert post_response(creator, slug, body).status_code == 503
    finally:
        event.remove(engine, "before_cursor_execute", fail_answer)
    assert creator.get(f"{CREATOR}/forms/{form_id}").json()["form"]["response_count"] == 0
    assert post_response(creator, slug, body).status_code == 201


def test_commit_failure_never_returns_success(creator):
    def fail_commit(connection):
        raise OperationalError("COMMIT", None, RuntimeError("simulated commit failure"))

    engine = creator.app.state.engine
    before = creator.get(f"{CREATOR}/forms").json()
    event.listen(engine, "commit", fail_commit)
    try:
        failed = write(creator, "POST", f"{CREATOR}/forms", json={"title": "Cannot commit"})
        assert failed.status_code == 503
    finally:
        event.remove(engine, "commit", fail_commit)
    assert creator.get(f"{CREATOR}/forms").json() == before


def test_creator_ownership_all_endpoints_and_nested_resources(creator):
    owner_cookie = creator.cookies.get("typeform_creator")
    form_id, definition = create(creator)
    slug, version = publish(creator, form_id)
    receipt = post_response(creator, slug, payload(version, definition["questions"], ["Private"]))
    creator.cookies.clear()
    assert write(creator, "POST", f"{CREATOR}/session").status_code == 200
    for method, suffix, body in [
        ("GET", "", None),
        ("PATCH", "", {"title": "Foreign"}),
        ("DELETE", "", None),
        ("POST", "/duplicate", None),
        ("POST", "/publish", None),
        ("POST", "/unpublish", None),
        ("PUT", "/draft", {"mutation_id": str(uuid4()), "definition": definition}),
        ("GET", "/versions", None),
        ("GET", "/responses", None),
        ("GET", "/summary", None),
        ("GET", f"/responses/{receipt.json()['id']}", None),
    ]:
        assert (
            write(
                creator, method, f"{CREATOR}/forms/{form_id}{suffix}", revision=1, json=body
            ).status_code
            == 404
        )
    owned, _ = create(creator)
    assert (
        creator.get(f"{CREATOR}/forms/{owned}/responses/{receipt.json()['id']}").status_code == 404
    )
    for suffix in ["summary", "responses"]:
        assert (
            creator.get(
                f"{CREATOR}/forms/{owned}/{suffix}?version_id={version['version_id']}"
            ).status_code
            == 404
        )
    creator.cookies.clear()
    creator.cookies.set("typeform_creator", owner_cookie)
    assert creator.get(f"{CREATOR}/forms/{form_id}").status_code == 200


def test_cursor_pagination_and_invalid_inputs(creator):
    ids, cursor = [], None
    while True:
        page = creator.get(
            f"{CREATOR}/forms", params={"limit": 1, **({"cursor": cursor} if cursor else {})}
        ).json()
        ids += [f["id"] for f in page["items"]]
        cursor = page["next_cursor"]
        if cursor is None:
            break
    assert len(ids) == len(set(ids)) == 3
    forms = creator.get(f"{CREATOR}/forms").json()["items"]
    sample = next(f for f in forms if f["response_count"] == 12)
    path = f"{CREATOR}/forms/{sample['id']}/responses"
    page1 = creator.get(path, params={"limit": 7}).json()
    page2 = creator.get(path, params={"limit": 7, "cursor": page1["next_cursor"]}).json()
    assert len(page1["items"]) == 7 and len(page2["items"]) == 5 and page2["next_cursor"] is None
    assert len({r["id"] for r in page1["items"] + page2["items"]}) == 12
    for bad in ["invalid", "!!!!", "", "e30"]:
        if bad:
            assert creator.get(path, params={"cursor": bad}).status_code == 422
    assert creator.get(path, params={"limit": 0}).status_code == 422
    assert creator.get(path, params={"limit": 101}).status_code == 422
    for invalid_number in [True, 0, 10**100]:
        cursor = (
            base64.urlsafe_b64encode(json.dumps([invalid_number, str(uuid4())]).encode())
            .decode()
            .rstrip("=")
        )
        versions = f"{CREATOR}/forms/{sample['id']}/versions"
        assert creator.get(versions, params={"cursor": cursor}).status_code == 422


def test_database_constraints_reject_foreign_option_version_and_multiple_values(creator):
    samples = [f for f in creator.get(f"{CREATOR}/forms").json()["items"] if f["is_published"]]
    with creator.app.state.session_factory() as db:
        response = db.scalar(select(FormResponse).where(FormResponse.form_id == samples[0]["id"]))
        option = db.scalar(
            select(QuestionOption).join(Question).where(Question.version_id == response.version_id)
        )
        answer = db.scalar(
            select(Answer).where(Answer.response_id == response.id, Answer.option_id.is_not(None))
        )
        wrong_option = db.scalar(
            select(QuestionOption).where(QuestionOption.question_id != answer.question_id)
        )
        response_id, question_id, version_id = response.id, option.question_id, response.version_id
        # Updating a stored answer to an option from another question must fail in SQLite itself.
        with pytest.raises(IntegrityError):
            db.execute(
                text("UPDATE answers SET option_id=:option WHERE id=:answer"),
                {"option": wrong_option.id, "answer": answer.id},
            )
        db.rollback()
        for change in [
            "text_value='two values'",
            "version_id='foreign-version'",
            "integer_value=-1",
        ]:
            with pytest.raises(IntegrityError):
                db.execute(
                    text(
                        f"UPDATE answers SET {change} "
                        "WHERE response_id=:response AND question_id=:question"
                    ),
                    {"response": response_id, "question": question_id},
                )
            db.rollback()
        assert version_id


def test_restart_preserves_cookie_definitions_responses_and_deleted_seed(settings):
    app = create_app(settings)
    with TestClient(app) as first:
        write(first, "POST", f"{CREATOR}/session")
        token = first.cookies.get("typeform_creator")
        form_id, definition = create(first, [question("number")])
        slug, version = publish(first, form_id)
        receipt = post_response(first, slug, payload(version, definition["questions"], [0])).json()
        sample = first.get(f"{CREATOR}/forms").json()["items"][-1]
        write(first, "DELETE", f"{CREATOR}/forms/{sample['id']}")
    with TestClient(create_app(settings)) as restarted:
        restarted.cookies.set("typeform_creator", token)
        assert write(restarted, "POST", f"{CREATOR}/session").status_code == 200
        assert restarted.get(f"{CREATOR}/forms/{form_id}").json()["draft"] == definition
        assert (
            restarted.get(f"{CREATOR}/forms/{form_id}/responses/{receipt['id']}").json()["answers"][
                0
            ]["value"]
            == 0
        )
        assert restarted.get(f"{CREATOR}/forms/{sample['id']}").status_code == 404
        assert restarted.get(f"{CREATOR}/forms/{form_id}/summary").json()["response_count"] == 1


def test_migrations_match_metadata_upgrade_downgrade_and_preserve_probe(settings):
    engine = create_database_engine(settings)
    config = migration_config()
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "0001_foundation_probe")
        connection.execute(
            text(
                "INSERT INTO foundation_probes VALUES ('probe', 'hash', '2026-10-09', '2026-11-09')"
            )
        )
    upgrade_database(engine)
    with engine.connect() as connection:
        assert compare_metadata(MigrationContext.configure(connection), Base.metadata) == []
        assert connection.execute(text("SELECT id FROM foundation_probes")).scalar() == "probe"
        assert connection.execute(text("PRAGMA foreign_key_check")).all() == []
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.downgrade(config, "0001_foundation_probe")
    upgrade_database(engine)
    engine.dispose()
