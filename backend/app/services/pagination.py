import base64
import json
from datetime import datetime

from sqlalchemy import and_, or_

from app.api.errors import ApiError


def encode_cursor(value: datetime | int, key: str) -> str:
    raw = [value.isoformat() if isinstance(value, datetime) else value, key]
    return base64.urlsafe_b64encode(json.dumps(raw).encode()).decode().rstrip("=")


def cursor_filter(cursor: str, column, id_column, *, numeric: bool = False):
    try:
        if len(cursor) > 512:
            raise ValueError()
        value, key = json.loads(
            base64.b64decode(cursor + "=" * (-len(cursor) % 4), altchars=b"-_", validate=True)
        )
        if not isinstance(key, str) or len(key) != 36:
            raise ValueError()
        if numeric:
            if type(value) is not int or not 1 <= value <= 9223372036854775807:
                raise ValueError()
        else:
            value = datetime.fromisoformat(value)
            if value.tzinfo is not None:
                raise ValueError()
    except (ValueError, TypeError, UnicodeDecodeError):
        raise ApiError(422, "invalid_cursor", "This page cursor is invalid.") from None
    return or_(column < value, and_(column == value, id_column < key))
