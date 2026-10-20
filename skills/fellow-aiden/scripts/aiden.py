#!/usr/bin/env python3
"""Read Fellow Aiden state and create hot-coffee brew profiles."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

BASE_URL = "https://l8qtmnc692.execute-api.us-west-2.amazonaws.com/v2"
USER_AGENT = "Fellow/5 CFNetwork/1568.300.101 Darwin/24.2.0"
PROFILE_FIELDS = (
    "profileType",
    "title",
    "ratio",
    "bloomEnabled",
    "bloomRatio",
    "bloomDuration",
    "bloomTemperature",
    "overallTemperature",
    "ssPulsesEnabled",
    "ssPulsesNumber",
    "ssPulsesInterval",
    "ssPulseTemperatures",
    "batchPulsesEnabled",
    "batchPulsesNumber",
    "batchPulsesInterval",
    "batchPulseTemperatures",
)
TITLE = re.compile(r"[A-Za-z0-9 !@#$%&*\-+?/.,:)(]+\Z")


class AidenError(Exception):
    """A safe error message for CLI output."""


def request(
    method: str, path: str, token: str | None = None, payload: dict | None = None
):
    headers = {"User-Agent": USER_AGENT}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if payload is not None:
        headers["Content-Type"] = "application/json"
    req = Request(
        BASE_URL + path,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers=headers,
        method=method,
    )
    try:
        with urlopen(req, timeout=20) as response:
            body = response.read()
            return json.loads(body) if body else None
    except HTTPError as exc:
        if path == "/auth/login" and exc.code in (400, 401, 403):
            raise AidenError(
                f"Fellow rejected the account login (HTTP {exc.code})"
            ) from None
        if method == "POST" and path.endswith("/profiles"):
            try:
                body = json.loads(exc.read(2048))
                message = body.get("message") if isinstance(body, dict) else None
            except (ValueError, OSError):
                message = None
            if isinstance(message, str) and message:
                raise AidenError(
                    f"Fellow rejected the profile (HTTP {exc.code}): {message[:300]}"
                ) from None
        raise AidenError(
            f"Fellow returned HTTP {exc.code} for {method} {path}"
        ) from None
    except (URLError, TimeoutError):
        if method == "POST" and path.endswith("/profiles"):
            raise AidenError(
                "Profile creation outcome is unknown. List profiles before retrying."
            ) from None
        raise AidenError(f"Could not reach Fellow for {method} {path}") from None


def login() -> str:
    email = os.environ.get("FELLOW_EMAIL", "").strip()
    password = os.environ.get("FELLOW_PASSWORD", "")
    if not email or not password:
        raise AidenError(
            "Set FELLOW_EMAIL and FELLOW_PASSWORD through a secret manager"
        )
    result = request(
        "POST",
        "/auth/login",
        payload={
            "email": email,
            "password": password,
            "timezone": os.environ.get("FELLOW_TIMEZONE", "UTC"),
        },
    )
    if not isinstance(result, dict) or not isinstance(result.get("accessToken"), str):
        raise AidenError("Fellow login returned no access token")
    return result["accessToken"]


def devices(token: str) -> list[dict]:
    result = request("GET", "/devices?dataType=real", token=token)
    if not isinstance(result, list):
        raise AidenError("Fellow returned an unexpected device list")
    return [item for item in result if isinstance(item, dict)]


def select_device(items: list[dict], device_id: str | None) -> dict:
    if device_id:
        matches = [item for item in items if item.get("id") == device_id]
        if len(matches) != 1:
            raise AidenError("The selected device ID is not linked to this account")
        return matches[0]
    if len(items) != 1:
        raise AidenError(
            f"Expected one linked Aiden, found {len(items)}. Run status and pass --device-id."
        )
    return items[0]


def profiles(token: str, device_id: str) -> list[dict]:
    result = request(
        "GET", f"/devices/{quote(device_id, safe='')}/profiles", token=token
    )
    if not isinstance(result, list):
        raise AidenError("Fellow returned an unexpected profile list")
    return [item for item in result if isinstance(item, dict)]


def editable(profile: dict) -> dict:
    return {field: profile[field] for field in PROFILE_FIELDS if field in profile}


def validate_profile(profile: object) -> dict:
    if not isinstance(profile, dict):
        raise AidenError("Profile JSON must be an object")
    missing = set(PROFILE_FIELDS) - set(profile)
    extra = set(profile) - set(PROFILE_FIELDS)
    if missing or extra:
        raise AidenError(
            f"Profile fields differ from the supported schema; missing={sorted(missing)}, extra={sorted(extra)}"
        )
    if type(profile["profileType"]) is not int or profile["profileType"] != 0:
        raise AidenError("This helper creates hot-coffee profiles (profileType 0) only")
    title = profile["title"]
    if (
        not isinstance(title, str)
        or not 1 <= len(title) <= 50
        or not TITLE.fullmatch(title)
    ):
        raise AidenError("Title must be 1-50 supported ASCII characters")

    def number(name: str, minimum: float, maximum: float, step: float) -> None:
        value = profile[name]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise AidenError(f"{name} must be a number")
        units = (value - minimum) / step
        if not minimum <= value <= maximum or abs(units - round(units)) > 1e-8:
            raise AidenError(f"{name} must be {minimum}-{maximum} in {step} steps")

    def integer(name: str, minimum: int, maximum: int) -> None:
        value = profile[name]
        if type(value) is not int or not minimum <= value <= maximum:
            raise AidenError(f"{name} must be an integer from {minimum} to {maximum}")

    number("ratio", 14, 20, 0.5)
    number("bloomRatio", 1, 3, 0.5)
    integer("bloomDuration", 1, 120)
    number("bloomTemperature", 50, 99, 0.5)
    number("overallTemperature", 50, 99, 0.5)
    for prefix in ("ss", "batch"):
        enabled = f"{prefix}PulsesEnabled"
        count = f"{prefix}PulsesNumber"
        interval = f"{prefix}PulsesInterval"
        temperatures = (
            "ssPulseTemperatures" if prefix == "ss" else "batchPulseTemperatures"
        )
        if type(profile[enabled]) is not bool:
            raise AidenError(f"{enabled} must be a boolean")
        integer(count, 1, 10)
        integer(interval, 5, 60)
        values = profile[temperatures]
        if not isinstance(values, list):
            raise AidenError(f"{temperatures} must be an array")
        for value in values:
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise AidenError(f"{temperatures} must contain temperatures")
            if not 50 <= value <= 99 or abs(value * 2 - round(value * 2)) > 1e-8:
                raise AidenError(f"{temperatures} must use 50-99°C in 0.5°C steps")
        if profile[enabled] and len(values) != profile[count]:
            raise AidenError(f"{temperatures} must contain {profile[count]} values")
    if type(profile["bloomEnabled"]) is not bool:
        raise AidenError("bloomEnabled must be a boolean")
    return profile


def print_json(value: object) -> None:
    print(json.dumps(value, indent=2, sort_keys=True))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--device-id", help="Required when the account has multiple brewers"
    )
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("status", help="List linked brewers and their connection state")
    commands.add_parser("profiles", help="List profile IDs and titles")
    profile_command = commands.add_parser(
        "profile", help="Print editable fields of one profile"
    )
    profile_command.add_argument("profile_id")
    create_command = commands.add_parser(
        "create", help="Create a profile from a JSON file or stdin"
    )
    create_command.add_argument("source", help="JSON path, or - for stdin")
    create_command.add_argument(
        "--dry-run", action="store_true", help="Validate and print without connecting"
    )
    args = parser.parse_args()

    if args.command == "create":
        try:
            raw = (
                sys.stdin.read()
                if args.source == "-"
                else Path(args.source).read_text()
            )
            candidate = validate_profile(json.loads(raw))
        except (OSError, json.JSONDecodeError) as exc:
            raise AidenError(f"Could not read profile JSON: {exc}") from None
        if args.dry_run:
            print_json(candidate)
            return

    token = login()
    items = devices(token)
    if args.command == "status":
        print_json(
            [
                {
                    "id": item.get("id"),
                    "name": item.get("displayName"),
                    "connected": item.get("isConnected"),
                }
                for item in items
            ]
        )
        return

    device = select_device(items, args.device_id)
    device_id = str(device["id"])
    current = profiles(token, device_id)
    if args.command == "profiles":
        print_json(
            [
                {
                    "id": item.get("id"),
                    "title": item.get("title"),
                    "default": item.get("isDefaultProfile"),
                }
                for item in current
            ]
        )
        return
    if args.command == "profile":
        matches = [item for item in current if item.get("id") == args.profile_id]
        if len(matches) != 1:
            raise AidenError("Profile ID was not found")
        print_json(editable(matches[0]))
        return

    if device.get("isConnected") is False:
        raise AidenError(
            "Aiden reports offline; reconnect it before creating a profile"
        )
    duplicates = [
        item
        for item in current
        if str(item.get("title", "")).casefold() == candidate["title"].casefold()
    ]
    if duplicates:
        raise AidenError(
            f"A profile with this title already exists ({duplicates[0].get('id')})"
        )
    result = request(
        "POST",
        f"/devices/{quote(device_id, safe='')}/profiles",
        token=token,
        payload=candidate,
    )
    if not isinstance(result, dict) or not result.get("id"):
        raise AidenError(
            "Fellow did not return a new profile ID; list profiles before retrying"
        )
    profile_id = result["id"]
    for attempt in range(3):
        if any(item.get("id") == profile_id for item in profiles(token, device_id)):
            print_json(
                {
                    "id": profile_id,
                    "title": candidate["title"],
                    "visible_in_fellow_account": True,
                    "device_connected": device.get("isConnected"),
                }
            )
            return
        if attempt < 2:
            time.sleep(1)
    raise AidenError(
        f"Profile {profile_id} was created but is not yet visible in the account. List profiles before retrying."
    )


if __name__ == "__main__":
    try:
        main()
    except AidenError as exc:
        print(f"aiden: {exc}", file=sys.stderr)
        raise SystemExit(1) from None
