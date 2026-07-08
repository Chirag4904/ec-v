import argparse
import re
import time
from urllib.parse import urljoin, urlparse, urlunparse

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright



NAV_TIMEOUT_MS = 8000
PAGE_LOAD_WAIT_MS = 1200
CLICK_NAV_WAIT_MS = 2500
SPA_ROUTE_WAIT_MS = 500
MAX_DRILLDOWN_DEPTH = 5  

CTA_SELECTOR = "a[href], button, [onclick], [role='button']"

CLOSE_DIALOG_SELECTORS = [
    "[aria-label='Close']", ".modal-close", ".close-button",
    "button:has-text('Close')", "button:has-text('Cancel')",
    "button:has-text('✕')", "button:has-text('×')",
]

ONCLICK_URL_RE = re.compile(
    r"""(?:location\.href|location\.assign|window\.location(?:\.href)?)\s*=?\(?\s*['"]([^'"]+)['"]"""
)




def normalise(url: str) -> str:
    p = urlparse(url)
    path = p.path.rstrip("/") or "/"
    return urlunparse((p.scheme or "https", p.netloc.lower(), path, "", "", ""))


def get_host(url: str) -> str:
    return urlparse(url).netloc.lower().replace("www.", "")




def close_any_open_dialog(page):
    for selector in CLOSE_DIALOG_SELECTORS:
        try:
            el = page.query_selector(selector)
            if el and el.is_visible():
                el.click(timeout=1000)
                return True
        except Exception:
            pass
    try:
        page.keyboard.press("Escape")
    except Exception:
        pass
    return False


def try_href(el, base_url):
    try:
        href = el.get_attribute("href")
    except Exception:
        return None
    if href and href != "#" and not href.startswith("javascript:"):
        return urljoin(base_url, href)
    return None


def try_onclick_regex(el, base_url):
    try:
        onclick = el.get_attribute("onclick")
    except Exception:
        return None
    if not onclick:
        return None
    match = ONCLICK_URL_RE.search(onclick)
    if match:
        return urljoin(base_url, match.group(1))
    return None


def follow_destination(context, url: str):
    """Check where `url` really lands, walking the redirect chain manually so
    we can report the status code of the initial request, any intermediate
    hop(s), and the final destination's status — without opening a real
    browser page.
    """
    chain = []  
    current_url = url

    for _ in range(10):
        try:
            resp = context.request.get(current_url, timeout=NAV_TIMEOUT_MS, max_redirects=0)
        except Exception:
            return None
        status = resp.status
        chain.append((current_url, status))

        if 300 <= status < 400:
            location = resp.headers.get("location")
            if not location:
                break
            current_url = urljoin(current_url, location)
            continue
        break

    if not chain:
        return None

    initial_status = chain[0][1]
    final_url, final_status = chain[-1]
    intermediate_hops = chain[1:-1]  # excludes the initial request and the final landing page
    intermediate_url = " → ".join(f"{u} ({s})" for u, s in intermediate_hops)

    return {
        "final_destination": normalise(final_url),
        "is_redirect": "Y" if len(chain) > 1 else "N",
        "initial_status": initial_status,
        "intermediate_url": intermediate_url,
        "final_status": final_status,
    }





def mark_new_elements(page, uid_counter_start: int) -> int:
    """Tag every not-yet-tagged CTA-matching element with a unique
    data-cta-uid attribute. Returns the updated counter."""
    return page.evaluate(
        """([selector, start]) => {
            let counter = start;
            document.querySelectorAll(selector).forEach(el => {
                if (!el.hasAttribute('data-cta-uid')) {
                    el.setAttribute('data-cta-uid', 'uid-' + (counter++));
                }
            });
            return counter;
        }""",
        [CTA_SELECTOR, uid_counter_start],
    )


def get_marked_uids(page) -> set:
    try:
        return set(page.eval_on_selector_all(
            "[data-cta-uid]", "els => els.map(e => e.getAttribute('data-cta-uid'))"
        ))
    except Exception:
        return set()


class PageResolver:
    """Resolves all CTAs (including nested/drill-down) for a single page."""

    def __init__(self, context, page, source_url, origin_host, destination_cache=None, verbose=True):
        self.context = context
        self.page = page
        self.source_url = source_url
        self.origin_host = origin_host
        self.resolved = []
        self.unresolved = []
        self.uid_counter = 0
        self.visited_uids = set()
        # Shared across ALL pages in the run: avoids re-resolving the same
        # destination (nav/footer/social links repeated on every page) with a
        # fresh browser navigation each time.
        self.destination_cache = destination_cache if destination_cache is not None else {}
        self.verbose = verbose

    def run(self):
        self.uid_counter = mark_new_elements(self.page, self.uid_counter)
        processed_keys = set()

        while True:
            uids_now = sorted(get_marked_uids(self.page), key=lambda u: int(u.split("-")[1]))
            name_counts = {}
            next_uid, next_key = None, None

            for uid in uids_now:
                el = self._get_element(uid)
                if el is None:
                    continue
                try:
                    name = (el.inner_text() or "").strip()[:80] or el.get_attribute("aria-label") or "(no label)"
                except Exception:
                    name = "(no label)"
                occurrence = name_counts.get(name, 0)
                name_counts[name] = occurrence + 1
                key = (name, occurrence)
                if key not in processed_keys:
                    next_uid, next_key = uid, key
                    break

            if next_uid is None:
                break  # nothing left unprocessed at the top level

            processed_keys.add(next_key)
            reloaded = self._process_uid(next_uid, breadcrumb=[], depth=0)
            if reloaded:
                # A real page navigation happened and we returned to source_url —
                # every uid marker on the page was wiped by that reload, so the
                # next loop iteration re-scans fresh instead of trusting stale ids.
                # (name, occurrence) pairs stay valid across the reload since the
                # page re-renders identically, so processed_keys is still correct.
                self.uid_counter = mark_new_elements(self.page, self.uid_counter)

    def _get_element(self, uid):
        try:
            return self.page.query_selector(f"[data-cta-uid='{uid}']")
        except Exception:
            return None

    DISMISS_NAMES = {"close", "cancel", "×", "✕", "x"}

    def _process_uid(self, uid, breadcrumb, depth):
        if uid in self.visited_uids:
            return False
        self.visited_uids.add(uid)

        el = self._get_element(uid)
        if el is None:
            return False  # element no longer present (e.g. its parent menu closed)

        try:
            name = (el.inner_text() or "").strip()[:80] or el.get_attribute("aria-label") or "(no label)"
        except Exception:
            name = "(no label)"

        if name.strip().lower() in self.DISMISS_NAMES:
            return False  # dialog-dismissal control, not a real CTA — skip silently

        full_name = " > ".join(breadcrumb + [name]) if breadcrumb else name
        selector_desc = f"[data-cta-uid='{uid}']"

        # Tier 1/2: cheap, no click needed
        dest = try_href(el, self.source_url)
        method = "static_href" if dest else None
        if dest is None:
            dest = try_onclick_regex(el, self.source_url)
            method = "onclick_regex" if dest else None

        if dest is not None:
            self._record_resolved(full_name, selector_desc, dest, method)
            return False

        # Tier 3: click and see what happens
        if depth >= MAX_DRILLDOWN_DEPTH:
            self.unresolved.append({
                "source_url": self.source_url, "cta_name": full_name,
                "reason": f"max drill-down depth ({MAX_DRILLDOWN_DEPTH}) reached",
            })
            return False

        try:
            uids_before = get_marked_uids(self.page)
            url_before = self.page.url

            try:
                with self.page.expect_navigation(timeout=CLICK_NAV_WAIT_MS):
                    el.click(timeout=2000)
                # real navigation happened
                dest_url = self.page.url
                self._record_resolved(full_name, selector_desc, dest_url, "click_simulated")
                self.page.goto(self.source_url, timeout=NAV_TIMEOUT_MS, wait_until="domcontentloaded")
                self.page.wait_for_timeout(PAGE_LOAD_WAIT_MS)
                return True  # signal: full reload happened, uid markers are gone
            except PlaywrightTimeoutError:
                pass

            # no full navigation — check SPA soft route change
            self.page.wait_for_timeout(SPA_ROUTE_WAIT_MS)
            if self.page.url != url_before:
                dest_url = self.page.url
                self._record_resolved(full_name, selector_desc, dest_url, "click_simulated")
                self.page.go_back(timeout=NAV_TIMEOUT_MS)
                self.page.wait_for_timeout(PAGE_LOAD_WAIT_MS)
                return False

            # no navigation at all — did new elements appear? (drill down)
            self.uid_counter = mark_new_elements(self.page, self.uid_counter)
            uids_after = get_marked_uids(self.page)
            new_uids = uids_after - uids_before

            if new_uids:
                before_count = len(self.resolved) + len(self.unresolved)
                for new_uid in sorted(new_uids, key=lambda u: int(u.split("-")[1])):
                    child_reloaded = self._process_uid(new_uid, breadcrumb + [name], depth + 1)
                    if child_reloaded:
                        return True  # bail out of this branch, page already reloaded
                close_any_open_dialog(self.page)  # tidy up before the next sibling

                if len(self.resolved) + len(self.unresolved) == before_count:
                    # every "new" element was just a dismissal control (e.g. a
                    # modal's Close button) — the toggle itself led nowhere,
                    # so log it explicitly rather than letting it vanish.
                    self.unresolved.append({
                        "source_url": self.source_url, "cta_name": full_name,
                        "reason": "opened a dialog/modal with no reachable destination",
                    })
                return False

            closed = close_any_open_dialog(self.page)
            reason = "opened a dialog/modal (closed)" if closed else "no navigation and no new elements (non-navigating control)"
            self.unresolved.append({"source_url": self.source_url, "cta_name": full_name, "reason": reason})
            return False

        except Exception as e:
            self.unresolved.append({
                "source_url": self.source_url, "cta_name": full_name,
                "reason": f"unexpected error: {e}",
            })
            return False

    def _record_resolved(self, name, selector_desc, dest, method):
        cache_key = normalise(dest)
        cached = self.destination_cache.get(cache_key)

        if cached is not None:
            result = cached
            if self.verbose:
                print(f"      [cache hit] {name[:60]} -> {result['final_destination']}")
        else:
            if self.verbose:
                print(f"      resolving: {name[:60]} ...", end=" ", flush=True)
            result = follow_destination(self.context, dest)
            self.destination_cache[cache_key] = result
            if self.verbose:
                print("failed" if result is None else "ok")

        if result is None:
            self.unresolved.append({
                "source_url": self.source_url, "cta_name": name,
                "reason": f"resolved to '{dest}' but destination failed to load",
            })
            return

        final = result["final_destination"]
        is_external = "Y" if get_host(final) != self.origin_host else "N"

        self.resolved.append({
            "source_url": self.source_url,
            "cta_name": name,
            "cta_assigned_url": dest,
            "cta_destination": final,
            "is_external": is_external,
            "is_redirect": result["is_redirect"],
            "initial_status": result["initial_status"],
            "intermediate_url": result["intermediate_url"],
            "final_status": result["final_status"],
            "resolution_method": method,
        })


# ----------------------------------------------------------------------------
# Input: read URLs from an Excel file
# ----------------------------------------------------------------------------


def load_urls_from_excel(path: str, column: str | None) -> list[str]:
    wb = load_workbook(path, read_only=True)
    sheet_name = "Included" if "Included" in wb.sheetnames else wb.sheetnames[0]
    ws = wb[sheet_name]

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []
    header = [str(h).strip().lower() if h else "" for h in rows[0]]

    col_idx = 0
    if column:
        try:
            col_idx = header.index(column.lower())
        except ValueError:
            col_idx = 0
    elif "url" in header:
        col_idx = header.index("url")

    urls = [row[col_idx] for row in rows[1:] if row and row[col_idx]]
    return urls


# ----------------------------------------------------------------------------
# Output: single color-coded Excel workbook, 3 sheets
# ----------------------------------------------------------------------------

HEADER_FILL = PatternFill("solid", fgColor="1F4E78")
HEADER_FONT = Font(bold=True, color="FFFFFF")
THIN_BORDER = Border(*(Side(style="thin", color="D9D9D9"),) * 4)

GREEN = PatternFill("solid", fgColor="C6EFCE")
YELLOW = PatternFill("solid", fgColor="FFEB9C")
ORANGE = PatternFill("solid", fgColor="FCD5B4")
RED = PatternFill("solid", fgColor="FFC7CE")
BLUE = PatternFill("solid", fgColor="DDEBF7")
GREY = PatternFill("solid", fgColor="F2F2F2")


def _write_header(ws, headers):
    ws.append(headers)
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(vertical="center")
    ws.freeze_panes = "A2"


def _autosize(ws, headers, max_width=70):
    for col_idx, header in enumerate(headers, start=1):
        best = len(str(header))
        for row_cells in ws.iter_rows(min_col=col_idx, max_col=col_idx, min_row=2):
            for cell in row_cells:
                if cell.value:
                    best = max(best, len(str(cell.value)))
        ws.column_dimensions[get_column_letter(col_idx)].width = min(best + 2, max_width)


def write_resolved_sheet(wb, resolved):
    ws = wb.create_sheet("Resolved CTAs")
    headers = ["source_url", "cta_name", "cta_assigned_url", "cta_destination", "is_external", "is_redirect",
               "initial_status", "intermediate_url", "final_status", "resolution_method"]
    _write_header(ws, headers)
    method_fill = {"static_href": GREEN, "onclick_regex": YELLOW, "click_simulated": ORANGE}
    for r in resolved:
        ws.append([r.get(h, "") for h in headers])
        row_num = ws.max_row
        for c in range(1, len(headers) + 1):
            ws.cell(row=row_num, column=c).border = THIN_BORDER
        ws.cell(row=row_num, column=headers.index("resolution_method") + 1).fill = method_fill.get(r["resolution_method"], GREY)
        if r["is_external"] == "Y":
            ws.cell(row=row_num, column=headers.index("is_external") + 1).fill = RED
        if r["is_redirect"] == "Y":
            ws.cell(row=row_num, column=headers.index("is_redirect") + 1).fill = YELLOW
        try:
            if int(r["final_status"]) != 200:
                ws.cell(row=row_num, column=headers.index("final_status") + 1).fill = RED
        except (ValueError, TypeError):
            pass
    _autosize(ws, headers)


def write_unresolved_sheet(wb, unresolved):
    ws = wb.create_sheet("Unresolved CTAs")
    headers = ["source_url", "cta_name", "reason"]
    _write_header(ws, headers)
    for r in unresolved:
        ws.append([r.get(h, "") for h in headers])
        row_num = ws.max_row
        for c in range(1, len(headers) + 1):
            cell = ws.cell(row=row_num, column=c)
            cell.fill = RED
            cell.border = THIN_BORDER
    _autosize(ws, headers)


def write_external_domains_sheet(wb, resolved):
    ws = wb.create_sheet("External Domains")
    headers = ["domain", "source", "final_url"]
    _write_header(ws, headers)

    seen_domains = {}
    for r in resolved:
        if r["is_external"] != "Y":
            continue
        domain = get_host(r["cta_destination"])
        if domain not in seen_domains:
            seen_domains[domain] = {"domain": domain, "source": r["source_url"], "final_url": r["cta_destination"]}

    for i, entry in enumerate(sorted(seen_domains.values(), key=lambda d: d["domain"])):
        ws.append([entry[h] for h in headers])
        row_num = ws.max_row
        fill = BLUE if i % 2 == 0 else GREY
        for c in range(1, len(headers) + 1):
            cell = ws.cell(row=row_num, column=c)
            cell.fill = fill
            cell.border = THIN_BORDER
    _autosize(ws, headers)


def write_workbook(path, resolved, unresolved):
    wb = Workbook()
    wb.remove(wb.active)
    write_resolved_sheet(wb, resolved)
    write_unresolved_sheet(wb, unresolved)
    write_external_domains_sheet(wb, resolved)
    wb.save(path)
    print(f"  Workbook -> {path}  ({len(resolved)} resolved, {len(unresolved)} unresolved)")


# ----------------------------------------------------------------------------
# Entry point
# ----------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Resolve CTA destinations for a list of URLs from an Excel file.")
    parser.add_argument("excel_file", help="Path to the .xlsx containing URLs")
    parser.add_argument("--column", default=None, help="Column name containing URLs (default: auto-detect 'url')")
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N URLs (for testing)")
    parser.add_argument("--out", default="cta_report.xlsx", help="Output workbook path")
    args = parser.parse_args()

    urls = load_urls_from_excel(args.excel_file, args.column)
    if args.limit:
        urls = urls[: args.limit]
    if not urls:
        print("No URLs found.")
        return

    origin_host = get_host(urls[0])
    print(f"\n  Pages to scan: {len(urls)}")
    print(f"  Origin host  : {origin_host}\n")

    all_resolved, all_unresolved = [], []
    destination_cache = {}  # shared across every page — this is the key speedup
    run_start = time.time()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()

        for i, url in enumerate(urls, start=1):
            page_start = time.time()
            print(f"  [{i}/{len(urls)}] {url}")
            try:
                response = page.goto(url, timeout=NAV_TIMEOUT_MS, wait_until="domcontentloaded")
                page.wait_for_timeout(PAGE_LOAD_WAIT_MS)
                if response is None or response.status != 200:
                    all_unresolved.append({"source_url": url, "cta_name": "", "reason": "page failed to load"})
                    print(f"      page failed to load ({round(time.time() - page_start, 1)}s)")
                    continue
            except Exception as e:
                all_unresolved.append({"source_url": url, "cta_name": "", "reason": f"page failed to load: {e}"})
                print(f"      page failed to load ({round(time.time() - page_start, 1)}s)")
                continue

            resolver = PageResolver(context, page, url, origin_host, destination_cache=destination_cache)
            resolver.run()
            all_resolved.extend(resolver.resolved)
            all_unresolved.extend(resolver.unresolved)
            page_elapsed = round(time.time() - page_start, 1)
            elapsed_total = round(time.time() - run_start, 1)
            print(f"      -> {len(resolver.resolved)} resolved, {len(resolver.unresolved)} unresolved "
                  f"(cache size: {len(destination_cache)})  [page: {page_elapsed}s | total elapsed: {elapsed_total}s]")

        context.close()
        browser.close()

    total_elapsed = time.time() - run_start
    mins, secs = divmod(total_elapsed, 60)
    hrs, mins = divmod(mins, 60)
    print(f"\n  Total: {len(all_resolved)} resolved, {len(all_unresolved)} unresolved")
    print(f"  Time taken: {int(hrs)}h {int(mins)}m {round(secs, 1)}s  ({round(total_elapsed, 1)}s total)")
    write_workbook(args.out, all_resolved, all_unresolved)
    print("  Done.\n")


if __name__ == "__main__":
    main()