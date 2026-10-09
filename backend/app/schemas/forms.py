from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StrictBool,
    StrictInt,
    StrictStr,
    StringConstraints,
    model_validator,
)

Key = Annotated[str, StringConstraints(pattern=r"^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$")]
Title = Annotated[str, StringConstraints(max_length=200)]
Color = Annotated[str, StringConstraints(pattern=r"^#[0-9a-fA-F]{6}$")]


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid")


class QuestionType(StrEnum):
    SHORT_TEXT = "short_text"
    LONG_TEXT = "long_text"
    MULTIPLE_CHOICE = "multiple_choice"
    DROPDOWN = "dropdown"
    EMAIL = "email"
    NUMBER = "number"
    YES_NO = "yes_no"
    RATING = "rating"


class OptionDefinition(Contract):
    option_key: Key
    label: Annotated[StrictStr, Field(max_length=500)] = ""


class QuestionDefinition(Contract):
    question_key: Key
    type: QuestionType
    title: Annotated[StrictStr, Field(max_length=2000)] = ""
    description: Annotated[StrictStr, Field(max_length=2000)] = ""
    required: StrictBool = False
    rating_max: Annotated[StrictInt, Field(ge=1, le=10)] | None = None
    options: list[OptionDefinition] = Field(default_factory=list, max_length=100)

    @model_validator(mode="after")
    def validate_settings(self):
        if self.type == QuestionType.RATING:
            self.rating_max = self.rating_max or 5
        elif self.rating_max is not None:
            raise ValueError("Only rating questions have a rating maximum")
        if self.options and self.type not in {QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN}:
            raise ValueError("Only choice questions have options")
        if len({option.option_key for option in self.options}) != len(self.options):
            raise ValueError("Option keys must be unique within a question")
        return self


class ThemeSettings(Contract):
    font: Literal["inter"] = "inter"
    background: Color = "#ffffff"
    text: Color = "#2a222b"
    accent: Color = "#2563eb"


class EndingSettings(Contract):
    title: Annotated[StrictStr, Field(max_length=200)] = "Thank you!"
    description: Annotated[StrictStr, Field(max_length=2000)] = "Your response has been recorded."


class DraftDefinition(Contract):
    title: Title
    questions: list[QuestionDefinition] = Field(default_factory=list, max_length=100)
    theme_settings: ThemeSettings = Field(default_factory=ThemeSettings)
    ending_settings: EndingSettings = Field(default_factory=EndingSettings)

    @model_validator(mode="after")
    def unique_questions(self):
        if len({q.question_key for q in self.questions}) != len(self.questions):
            raise ValueError("Question keys must be unique within a form")
        return self


class CreateForm(Contract):
    title: Title = "Untitled form"


class RenameForm(Contract):
    title: Title


class SaveDraft(Contract):
    mutation_id: Key
    definition: DraftDefinition


class FormMetadata(Contract):
    id: str
    title: str
    is_published: bool
    public_slug: str | None
    draft_revision: int
    last_save_mutation_id: str | None
    created_at: datetime
    updated_at: datetime
    response_count: int
    seed_response_count: int


class FormDetail(Contract):
    form: FormMetadata
    draft: DraftDefinition


class FormList(Contract):
    items: list[FormMetadata]
    next_cursor: str | None


class SessionInfo(Contract):
    workspace_id: str
    workspace_name: str
    expires_at: datetime


class VersionInfo(Contract):
    id: str
    version_number: int
    title: str
    source_draft_revision: int
    published_at: datetime
    response_count: int


class VersionList(Contract):
    items: list[VersionInfo]
    next_cursor: str | None


class PublicForm(Contract):
    version_id: str
    version_number: int
    definition: DraftDefinition


class SubmittedAnswer(Contract):
    question_key: Key
    value: StrictStr | StrictInt | StrictBool | None


class SubmitResponse(Contract):
    version_id: Key
    submission_key: Key
    answers: list[SubmittedAnswer] = Field(max_length=100)


class SubmissionReceipt(Contract):
    id: str
    version_id: str
    submitted_at: datetime


class AnswerView(Contract):
    question_key: str
    type: QuestionType
    title: str
    value: str | int | bool | None
    display_value: str | int | bool | None
    skipped: bool


class ResponseItem(SubmissionReceipt):
    version_number: int
    is_seed: bool
    preview: list[AnswerView]


class ResponseList(Contract):
    items: list[ResponseItem]
    next_cursor: str | None


class ResponseDetail(SubmissionReceipt):
    version_number: int
    form_title: str
    is_seed: bool
    answers: list[AnswerView]


class DistributionItem(Contract):
    value: str | int | bool
    label: str
    count: int
    percentage: float


class QuestionSummary(Contract):
    question_key: str
    type: QuestionType
    title: str
    answered_count: int
    skipped_count: int
    distribution: list[DistributionItem] = Field(default_factory=list)
    minimum: int | None = None
    maximum: int | None = None
    mean: float | None = None


class FormSummary(Contract):
    version_id: str | None
    version_number: int | None
    title: str
    response_count: int
    seed_response_count: int
    questions: list[QuestionSummary]


class OperationResult(Contract):
    status: Literal["deleted"] = "deleted"
