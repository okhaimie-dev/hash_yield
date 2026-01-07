#!/usr/bin/env python3
"""
Validate test coverage mapping for TDD scaffolding.

Checks:
- All TEST-IDs in TEST_MANIFEST.md are well-formed.
- Each TEST-ID appears in at least one BTT tree file.
- Each TEST-ID appears in at least one test stub via `TEST-ID:` marker.
- Invariants referenced in the manifest exist in invariants.md.
- Risks referenced in the manifest exist in risk-matrix.md, and are mapped to the test.
- No orphan TEST-IDs exist in trees or stubs.

All paths are configurable via CLI args to support any repo layout.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

TEST_ID_RE = re.compile(r"TEST-[A-Z0-9]+-[0-9]{3}")
TEST_ID_MARKER_RE = re.compile(r"TEST-ID:\s*(TEST-[A-Z0-9]+-[0-9]{3})")
INV_RE = re.compile(r"INV-\d+")
RISK_RE = re.compile(r"R-\d+")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_manifest(path: Path):
    text = read_text(path)
    sections = re.split(r"^####\s+", text, flags=re.M)
    tests = {}

    for section in sections[1:]:
        lines = section.splitlines()
        if not lines:
            continue
        heading = lines[0].strip()
        test_id = heading.split(":")[0].strip()
        if not TEST_ID_RE.fullmatch(test_id):
            tests[test_id] = {"invalid": True, "invariants": set(), "risks": set()}
            continue

        body = "\n".join(lines[1:])
        invs = set(INV_RE.findall(body))
        risks = set(RISK_RE.findall(body))
        tests[test_id] = {"invalid": False, "invariants": invs, "risks": risks}

    all_ids = set(re.findall(TEST_ID_RE, text))
    return tests, all_ids


def parse_invariants(path: Path) -> set[str]:
    text = read_text(path)
    invs = set(re.findall(INV_RE, text))
    return invs


def parse_risk_matrix(path: Path) -> tuple[set[str], dict[str, set[str]]]:
    text = read_text(path)
    risks = set(re.findall(RISK_RE, text))
    risk_to_tests: dict[str, set[str]] = {r: set() for r in risks}
    for risk in risks:
        for m in re.finditer(risk + r".*", text):
            line = m.group(0)
            for tid in re.findall(TEST_ID_RE, line):
                risk_to_tests[risk].add(tid)
    return risks, risk_to_tests


def parse_btt_trees(tree_dir: Path) -> set[str]:
    ids = set()
    for path in tree_dir.rglob("*.tree"):
        ids.update(re.findall(TEST_ID_RE, read_text(path)))
    return ids


def parse_stub_tests(tests_dir: Path) -> set[str]:
    ids = set()
    for path in tests_dir.rglob("*.cairo"):
        text = read_text(path)
        for m in TEST_ID_MARKER_RE.findall(text):
            ids.add(m)
    return ids


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".", help="Repo root")
    parser.add_argument("--spec-docs-dir", help="Directory with TEST_MANIFEST.md and related docs")
    parser.add_argument("--manifest", help="Path to TEST_MANIFEST.md")
    parser.add_argument("--invariants", help="Path to invariants.md")
    parser.add_argument("--risk-matrix", help="Path to risk-matrix.md")
    parser.add_argument("--btt", help="Path to BTT tree directory")
    parser.add_argument("--tests", help="Path to tests root directory")
    args = parser.parse_args()

    root = Path(args.root).resolve()

    if args.spec_docs_dir:
        spec_docs_dir = root / args.spec_docs_dir
        manifest_path = spec_docs_dir / "TEST_MANIFEST.md"
        invariants_path = spec_docs_dir / "invariants.md"
        risk_matrix_path = spec_docs_dir / "risk-matrix.md"
    else:
        manifest_path = Path(args.manifest) if args.manifest else None
        invariants_path = Path(args.invariants) if args.invariants else None
        risk_matrix_path = Path(args.risk_matrix) if args.risk_matrix else None

    btt_dir = Path(args.btt) if args.btt else None
    tests_dir = Path(args.tests) if args.tests else None

    errors = []

    if manifest_path is None or invariants_path is None or risk_matrix_path is None:
        errors.append(
            "Missing spec-docs paths. Provide --spec-docs-dir or explicit "
            "--manifest/--invariants/--risk-matrix."
        )
    if btt_dir is None:
        errors.append("Missing BTT dir. Provide --btt.")
    if tests_dir is None:
        errors.append("Missing tests dir. Provide --tests.")

    if errors:
        print("Coverage validation failed:\\n")
        for e in errors:
            print(f"- {e}")
        return 1

    manifest_path = (root / manifest_path).resolve() if not manifest_path.is_absolute() else manifest_path
    invariants_path = (root / invariants_path).resolve() if not invariants_path.is_absolute() else invariants_path
    risk_matrix_path = (root / risk_matrix_path).resolve() if not risk_matrix_path.is_absolute() else risk_matrix_path
    btt_dir = (root / btt_dir).resolve() if not btt_dir.is_absolute() else btt_dir
    tests_dir = (root / tests_dir).resolve() if not tests_dir.is_absolute() else tests_dir

    if not manifest_path.exists():
        errors.append(f"Missing manifest: {manifest_path}")
    if not invariants_path.exists():
        errors.append(f"Missing invariants file: {invariants_path}")
    if not risk_matrix_path.exists():
        errors.append(f"Missing risk matrix: {risk_matrix_path}")
    if not btt_dir.exists():
        errors.append(f"Missing BTT dir: {btt_dir}")
    if not tests_dir.exists():
        errors.append(f"Missing tests dir: {tests_dir}")

    if errors:
        print("Coverage validation failed:\n")
        for e in errors:
            print(f"- {e}")
        return 1

    tests_map, manifest_ids = parse_manifest(manifest_path)
    if not tests_map:
        errors.append("No TEST-IDs found in manifest headings.")

    invalid_ids = [tid for tid, meta in tests_map.items() if meta.get("invalid")]
    if invalid_ids:
        errors.append(f"Invalid TEST-ID format in manifest headings: {', '.join(sorted(invalid_ids))}")

    inv_ids = parse_invariants(invariants_path) if invariants_path.exists() else set()
    risk_ids, risk_to_tests = (
        parse_risk_matrix(risk_matrix_path) if risk_matrix_path.exists() else (set(), {})
    )
    btt_ids = parse_btt_trees(btt_dir) if btt_dir.exists() else set()
    stub_ids = parse_stub_tests(tests_dir) if tests_dir.exists() else set()

    # Coverage checks
    for tid, meta in tests_map.items():
        if meta.get("invalid"):
            continue
        if tid not in btt_ids:
            errors.append(f"Missing TEST-ID in BTT trees: {tid}")
        if tid not in stub_ids:
            errors.append(f"Missing TEST-ID in test stubs: {tid}")

        for inv in meta["invariants"]:
            if inv not in inv_ids:
                errors.append(f"Invariant {inv} referenced by {tid} but not defined")

        for risk in meta["risks"]:
            if risk not in risk_ids:
                errors.append(f"Risk {risk} referenced by {tid} but not defined")
            elif tid not in risk_to_tests.get(risk, set()):
                errors.append(f"Risk {risk} does not map to {tid} in risk matrix")

    # Orphan IDs
    for tid in sorted(btt_ids - manifest_ids):
        errors.append(f"Orphan TEST-ID in BTT trees (not in manifest): {tid}")
    for tid in sorted(stub_ids - manifest_ids):
        errors.append(f"Orphan TEST-ID in stubs (not in manifest): {tid}")

    if errors:
        print("Coverage validation failed:\n")
        for e in errors:
            print(f"- {e}")
        return 1

    print("Coverage validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
