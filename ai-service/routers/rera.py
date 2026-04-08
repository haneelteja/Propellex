"""
RERA Auto-Verification router.

Scrapes rera.telangana.gov.in using httpx (no Playwright — too heavy for Render free tier).
The portal is server-rendered ASP.NET; we POST the RERA number and parse the HTML response.

If scraping fails (portal down / JS-gated / rate-limit), we return status='unknown' — never
crash the caller. The backend cron treats 'unknown' as a soft failure and retries after 7 days.
"""
import re
import traceback
from typing import Optional

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/rera", tags=["rera"])

RERA_BASE = "https://rera.telangana.gov.in"
SEARCH_URL = f"{RERA_BASE}/ProjectSearch.aspx"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Propellex-Bot/1.0; +https://propellex.in)",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-IN,en;q=0.9",
}


class ReraVerifyRequest(BaseModel):
    property_id: str
    rera_number: Optional[str] = None


class ReraVerifyResponse(BaseModel):
    property_id: str
    rera_number: Optional[str]
    rera_status: str   # 'verified' | 'pending' | 'not_registered' | 'unknown'
    details: Optional[str] = None


def _extract_hidden_fields(html: str) -> dict[str, str]:
    """Extract ASP.NET ViewState and EventValidation hidden inputs."""
    fields: dict[str, str] = {}
    for m in re.finditer(r'<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"', html, re.IGNORECASE):
        name, value = m.group(1), m.group(2)
        if name.startswith("__") or "viewstate" in name.lower():
            fields[name] = value
    return fields


def _parse_rera_status(html: str, rera_number: str) -> tuple[str, Optional[str]]:
    """
    Parse RERA verification result from HTML.
    Returns (status, details).
    """
    lower = html.lower()

    # No results found
    if "no records found" in lower or "no project found" in lower or "not found" in lower:
        return "not_registered", None

    # Look for the RERA number in the response table
    if rera_number and rera_number.lower() in lower:
        # Look for status indicators
        if any(w in lower for w in ["registered", "approved", "valid"]):
            return "verified", None
        if any(w in lower for w in ["pending", "under review", "in progress"]):
            return "pending", None
        if any(w in lower for w in ["revoked", "lapsed", "expired", "cancelled"]):
            return "not_registered", "Registration revoked or expired"
        # RERA number found but status unclear
        return "verified", None

    return "unknown", None


async def _scrape_rera(rera_number: str) -> tuple[str, Optional[str]]:
    """
    Attempt to scrape RERA portal. Returns (status, details).
    Falls back to 'unknown' on any error.
    """
    timeout = httpx.Timeout(30.0, connect=10.0)

    async with httpx.AsyncClient(headers=HEADERS, timeout=timeout, follow_redirects=True) as client:
        # Step 1: GET the search page to collect ASP.NET form tokens
        try:
            resp = await client.get(SEARCH_URL)
            resp.raise_for_status()
        except Exception as e:
            print(f"[RERA] GET search page failed: {e}")
            return "unknown", None

        html = resp.text
        hidden = _extract_hidden_fields(html)

        if not hidden:
            # Portal may require JavaScript or has changed structure
            print("[RERA] No hidden fields found — portal may be JS-gated")
            return "unknown", None

        # Step 2: POST with RERA number
        # Try common field names used by Telangana RERA portal
        form_data = {
            **hidden,
            # Known field names from the portal (may change with site updates)
            "txtRegNo": rera_number,
            "txtProjectName": "",
            "txtPromoterName": "",
            "ddlDistrict": "0",
            "__EVENTTARGET": "btnSearch",
            "__EVENTARGUMENT": "",
        }

        try:
            resp2 = await client.post(SEARCH_URL, data=form_data)
            resp2.raise_for_status()
        except Exception as e:
            print(f"[RERA] POST search failed: {e}")
            return "unknown", None

        status, details = _parse_rera_status(resp2.text, rera_number)
        return status, details


@router.post("/verify", response_model=ReraVerifyResponse)
async def verify_rera(req: ReraVerifyRequest) -> ReraVerifyResponse:
    """
    Verify a property's RERA registration status.
    Called by the backend cron job — never directly by the frontend.
    """
    if not req.rera_number or not req.rera_number.strip():
        return ReraVerifyResponse(
            property_id=req.property_id,
            rera_number=None,
            rera_status="not_registered",
            details="No RERA number provided",
        )

    rera_num = req.rera_number.strip().upper()
    print(f"[RERA] Verifying {rera_num} for property {req.property_id}")

    try:
        status, details = await _scrape_rera(rera_num)
    except Exception:
        traceback.print_exc()
        status, details = "unknown", None

    print(f"[RERA] Result for {rera_num}: {status}")

    return ReraVerifyResponse(
        property_id=req.property_id,
        rera_number=rera_num,
        rera_status=status,
        details=details,
    )
