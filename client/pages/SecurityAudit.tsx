name: Secure Audit – Nary/Nimrev

on:
  push:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read
  actions: read
  pull-requests: write
  id-token: write

jobs:
  audit:
    runs-on: ubuntu-22.04
    timeout-minutes: 90

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install Node (for Foundry/Echidna harnesses if present)
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install Foundry (forge/cast)
        uses: foundry-rs/foundry-toolchain@v1
        with:
          version: nightly

      - name: Install solc-select + common solc versions
        run: |
          sudo snap install solc --classic || true
          pip install solc-select
          solc-select install 0.8.26
          solc-select install 0.8.20
          solc-select install 0.7.6
          solc-select use 0.8.26

      - name: Install scanners (Slither, Mythril, Semgrep, Echidna)
        run: |
          pip install slither-analyzer==0.10.4 mythril==0.24.5 semgrep==1.85.0 jinja2==3.1.4
          sudo apt-get update -y
          sudo apt-get install -y docker.io libprotobuf-dev protobuf-compiler
          pip install pyyaml
          # Echidna via Docker (trailofbits/eth-security-toolbox)
          docker pull trailofbits/eth-security-toolbox:latest

      - name: Prepare audit scaffold
        run: |
          mkdir -p audit_out/raw audit_out/report
          # Copy helper configs if repo doesn't have them
          if [ ! -f .semgrep/solidity.yml ]; then
            mkdir -p .semgrep
            cat > .semgrep/solidity.yml <<'EOF'
rules:
  - id: solidity-hardcoded-address
    languages: [solidity]
    severity: WARNING
    message: "Hardcoded address detected. Verify it's safe, updatable, and multi-sig controlled."
    patterns:
      - pattern-regex: "0x[a-fA-F0-9]{40}"
  - id: solidity-tx-origin
    languages: [solidity]
    severity: ERROR
    message: "Use of tx.origin for auth is unsafe"
    pattern: tx.origin
  - id: solidity-delegatecall-user-controlled
    languages: [solidity]
    severity: ERROR
    message: "delegatecall target should never be user-controlled"
    patterns:
      - pattern: |
          (address $A).delegatecall($X)
      - metavariable-regex:
          metavariable: $X
          regex: (msg\.data|_calldata|_selector|params|\binput\b)
EOF
          fi

          if [ ! -f echidna.yaml ]; then
            cat > echidna.yaml <<'EOF'
testMode: assertion
coverage: true
shrinkLimit: 200
deployer: "0x30000"
sender: ["0x10000","0x20000"]
# Add properties via solidity assertions or Echidna property functions.
EOF
          fi

          if [ ! -f audit.config.yaml ]; then
            cat > audit.config.yaml <<'EOF'
project:
  name: "${{ github.repository }}"
  score_weights:
    critical: 40
    high: 25
    medium: 15
    low: 5
    informational: 1
scan:
  solc_versions: ["0.8.26","0.8.20","0.7.6"]
  include_patterns: ["contracts/**/*.sol","src/**/*.sol"]
  exclude_patterns: ["node_modules/**","lib/**","test/**","script/**","mocks/**"]
EOF
          fi

      - name: Run Slither
        continue-on-error: true
        run: |
          slither . --json audit_out/raw/slither.json --sarif audit_out/raw/slither.sarif || true

      - name: Run Semgrep
        continue-on-error: true
        run: |
          semgrep --config .semgrep/solidity.yml --json --output audit_out/raw/semgrep.json || true

      - name: Compile with Foundry (if present)
        continue-on-error: true
        run: |
          if [ -f foundry.toml ]; then
            forge --version
            forge build || true
          fi

      - name: Run Echidna (Dockerized) – optional short fuzz
        continue-on-error: true
        env:
          WORKDIR: ${{ github.workspace }}
        run: |
          # Short budgeted fuzz to collect quick signals; full fuzz can be a separate job/profile
          if ls contracts/*.sol src/*.sol 1> /dev/null 2>&1; then
            docker run --rm -v "$WORKDIR":/share trailofbits/eth-security-toolbox \
              bash -lc "cd /share && timeout 600 echidna-test . --config echidna.yaml --format json > audit_out/raw/echidna.json || true"
          else
            echo '{}' > audit_out/raw/echidna.json
          fi

      - name: Aggregate & score → JSON + HTML
        run: |
          python - <<'PY'
import json, os, re, hashlib, datetime, glob, yaml
from jinja2 import Template

# --- Load configs ---
cfg = {}
if os.path.exists("audit.config.yaml"):
    cfg = yaml.safe_load(open("audit.config.yaml"))

weights = cfg.get("project",{}).get("score_weights",{
    "critical":40,"high":25,"medium":15,"low":5,"informational":1
})

def read_json(path):
    try:
        return json.load(open(path))
    except Exception:
        return {}

raw = {
    "slither": read_json("audit_out/raw/slither.json"),
    "semgrep": read_json("audit_out/raw/semgrep.json"),
    "echidna": read_json("audit_out/raw/echidna.json"),
}
repo   = os.getenv("GITHUB_REPOSITORY","unknown")
commit = os.getenv("GITHUB_SHA","unknown")
now    = datetime.datetime.utcnow().isoformat()+"Z"

findings = []

# --- Helpers ---
def mk_id(seed):
    h = hashlib.sha1(seed.encode()).hexdigest()[:7].upper()
    return f"NARY-{datetime.datetime.utcnow().year}-{h}"

def severity_norm(s):
    s = (s or "").lower()
    if "crit" in s: return "CRITICAL"
    if "high" in s: return "HIGH"
    if "med" in s:  return "MEDIUM"
    if "low" in s:  return "LOW"
    return "INFORMATIONAL"

def push_finding(**kw):
    findings.append(kw)

# --- Slither normalization ---
sl = raw.get("slither", {})
for issue in sl.get("results", {}).get("detectors", []):
    title = issue.get("check", "Slither finding")
    sev = severity_norm(issue.get("impact",""))
    conf = "MEDIUM"
    elements = issue.get("elements", []) or []
    locs = []
    for e in elements:
        src = e.get("source_mapping",{})
        locs.append({
            "file": src.get("filename_relative", src.get("filename")),
            "line_start": src.get("lines", [None])[0],
            "line_end": src.get("lines", [None])[-1],
            "contract": e.get("type",""),
            "function": e.get("name","")
        })
    loc = locs[0] if locs else {"file": None}
    push_finding(
      id = mk_id(title + json.dumps(loc)),
      title = title,
      severity = sev,
      confidence = conf,
      location = loc,
      type = issue.get("check",""),
      description = issue.get("description",""),
      impact = issue.get("impact",""),
      evidence = {"tool":"slither","raw": issue},
      poc = None,
      suggested_fix = issue.get("recommendation",""),
      status = "open",
      references = []
    )

# --- Semgrep normalization ---
sg = raw.get("semgrep", {})
for res in sg.get("results", []):
    rule_id = res.get("check_id","semgrep-rule")
    title = res.get("extra",{}).get("message", rule_id)
    sev = severity_norm(res.get("extra",{}).get("severity","info"))
    path = res.get("path")
    start = res.get("start",{}).get("line")
    end   = res.get("end",{}).get("line")
    push_finding(
      id = mk_id(rule_id + path + str(start)),
      title = title,
      severity = sev,
      confidence = "MEDIUM",
      location = {"file": path, "line_start": start, "line_end": end, "contract": None, "function": None},
      type = "Pattern",
      description = f"Semgrep rule {rule_id} triggered.",
      impact = "",
      evidence = {"tool":"semgrep","raw": res},
      poc = None,
      suggested_fix = "",
      status = "open",
      references = []
    )

# --- Echidna normalization ---
ec = raw.get("echidna", {})
# Echidna JSON formats vary; capture failures/properties if present
def dig(d, *keys):
    for k in keys:
        if isinstance(d, dict): d = d.get(k, {})
        else: return {}
    return d

props = dig(ec, "contracts")
if isinstance(props, dict):
    for c, data in props.items():
        failures = data.get("failures") or []
        for f in failures:
            name = f.get("name","echidna_property_fail")
            msg  = f.get("msg","Property failed")
            push_finding(
              id = mk_id(c + name),
              title = f"Echidna property failed: {name}",
              severity = "HIGH",
              confidence = "HIGH",
              location = {"file": None, "line_start": None, "line_end": None, "contract": c, "function": name},
              type = "PropertyFailure",
              description = msg,
              impact = "A specified safety property does not hold under fuzzing.",
              evidence = {"tool":"echidna","raw": f},
              poc = "fuzz seeds available in echidna logs",
              suggested_fix = "Strengthen invariants or fix violating logic.",
              status = "open",
              references = []
            )

# --- Hardcoded address sweep (extra pass for your specific need) ---
hex_addr_re = re.compile(r"0x[a-fA-F0-9]{40}")
for root in ["contracts","src"]:
    if not os.path.isdir(root): continue
    for path in glob.glob(root + "/**/*.sol", recursive=True):
        with open(path, "r", errors="ignore") as fh:
            for i, line in enumerate(fh, 1):
                for m in hex_addr_re.findall(line):
                    push_finding(
                      id = mk_id(path + m + str(i)),
                      title = f"Hardcoded address: {m}",
                      severity = "MEDIUM",
                      confidence = "HIGH",
                      location = {"file": path, "line_start": i, "line_end": i, "contract": None, "function": None},
                      type = "HardcodedAddress",
                      description = "Hardcoded address found. Verify it is intended, upgradable via governance, and multi-sig controlled.",
                      impact = "If compromised or deprecated, funds/logic could be at risk.",
                      evidence = {"snippet": line.strip()},
                      poc = None,
                      suggested_fix = "Load from immutable constructor param, config registry, or governed storage.",
                      status = "open",
                      references = []
                    )

# --- Scoring ---
sev_counts = {"critical":0,"high":0,"medium":0,"low":0,"informational":0}
for f in findings:
    sev_counts[f["severity"].lower()] += 1

# Basic 0–100 scoring (penalty-based)
penalty = sum(sev_counts[k]*weights[k] for k in sev_counts)
score = max(0, 100 - min(100, penalty))  # clamp to [0,100]

# Build per-function mini-summaries (public/external heuristics)
func_summaries = []
sig_re = re.compile(r"(function|fallback|receive)\s+([A-Za-z0-9_]+)?\s*\((.*?)\)\s*(external|public)")
for root in ["contracts","src"]:
    if not os.path.isdir(root): continue
    for path in glob.glob(root + "/**/*.sol", recursive=True):
        try:
            content = open(path, "r", errors="ignore").read()
            for m in sig_re.finditer(content):
                name = m.group(2) or (m.group(1))  # fallback/receive
                func_summaries.append({
                    "file": path,
                    "function": name,
                    "visibility": m.group(4),
                    "notes": []
                })
        except Exception:
            pass

report = {
  "scan_id": hashlib.sha1((repo+commit+now).encode()).hexdigest()[:12],
  "client": "Nary/Nimrev",
  "repo": repo,
  "commit": commit,
  "scan_time": now,
  "tools": ["slither","semgrep","echidna"],
  "summary": {
    "score": score,
    "counts": sev_counts,
    "top_issues": [f["id"] for f in sorted(findings, key=lambda x: ["CRITICAL","HIGH","MEDIUM","LOW","INFORMATIONAL"].index(x["severity"]))[:3]]
  },
  "findings": findings,
  "functions": func_summaries
}

os.makedirs("audit_out/report", exist_ok=True)
json.dump(report, open("audit_out/report/audit.json","w"), indent=2)

# --- HTML render (colors + badges) ---
template = Template(r"""
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Security Audit – {{ repo }} @ {{ commit[:7] }}</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 24px; line-height: 1.5; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .badge { padding: 2px 8px; border-radius: 12px; color: #fff; font-weight: 600; font-size: 12px; }
  .CRITICAL { background: #8B0000; }
  .HIGH { background: #FF4500; }
  .MEDIUM { background: #FFA500; color: #111; }
  .LOW { background: #F5DEB3; color: #111; }
  .INFORMATIONAL { background: #2F4F4F; }
  .PASS { background: #2E8B57; }
  .card { border: 1px solid #e5e7eb; border-left: 6px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 12px; }
  .card.CRITICAL { border-left-color: #8B0000; }
  .card.HIGH { border-left-color: #FF4500; }
  .card.MEDIUM { border-left-color: #FFA500; }
  .card.LOW { border-left-color: #F5DEB3; }
  .card.INFORMATIONAL { border-left-color: #2F4F4F; }
  code, pre { background: #0b1020; color: #e0e6ff; padding: 12px; display: block; border-radius: 8px; overflow:auto; }
  h1 { margin-top: 0; }
  .muted { color: #6b7280; }
  .kpi { padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
</style>
</head>
<body>
  <h1>Security Audit</h1>
  <p class="muted">{{ repo }} @ {{ commit }} · {{ scan_time }}</p>

  <div class="grid">
    <div class="kpi">
      <h3>Overall Score</h3>
      <div style="font-size: 40px; font-weight: 800;">{{ summary.score }}</div>
    </div>
    <div class="kpi">
      <h3>Severity Counts</h3>
      <div>CRITICAL: {{ summary.counts.critical }} · HIGH: {{ summary.counts.high }} · MEDIUM: {{ summary.counts.medium }} · LOW: {{ summary.counts.low }} · INFO: {{ summary.counts.informational }}</div>
    </div>
  </div>

  <h2>Top Issues</h2>
  <ul>
  {% for tid in summary.top_issues %}<li>{{ tid }}</li>{% endfor %}
  </ul>

  <h2>Findings</h2>
  {% for f in findings %}
    <div class="card {{ f.severity }}">
      <h3>{{ f.id }} — {{ f.title }}</h3>
      <p><span class="badge {{ f.severity }}">{{ f.severity }}</span> &nbsp; Confidence: <strong>{{ f.confidence }}</strong></p>
      <p><strong>Location:</strong> {{ f.location.file }}{% if f.location.line_start %}:{{ f.location.line_start }}{% endif %} · Contract: {{ f.location.contract }} · Function: {{ f.location.function }}</p>
      <p><strong>Type:</strong> {{ f.type }}</p>
      <p><strong>Description:</strong> {{ f.description }}</p>
      {% if f.impact %}<p><strong>Impact:</strong> {{ f.impact }}</p>{% endif %}
      {% if f.suggested_fix %}<p><strong>Suggested fix:</strong> {{ f.suggested_fix }}</p>{% endif %}
      <details><summary>Evidence</summary>
        <pre>{{ f.evidence | tojson(indent=2) }}</pre>
      </details>
      <p class="muted">Status: {{ f.status }}</p>
    </div>
  {% endfor %}

  <h2>Function-by-Function (Public/External)</h2>
  <div>
    {% for fn in functions %}
    <div class="card INFORMATIONAL">
      <strong>{{ fn.function }}</strong> — {{ fn.visibility }} · <span class="muted">{{ fn.file }}</span>
    </div>
    {% endfor %}
  </div>

  <h2>Tools</h2>
  <p>slither, semgrep, echidna</p>
</body>
</html>
""")

html = template.render(**report)
open("audit_out/report/audit.html","w").write(html)

print("Wrote audit_out/report/audit.json and audit.html")
PY

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: nary-nimrev-audit
          path: |
            audit_out/report/audit.json
            audit_out/report/audit.html
            audit_out/raw/*.json
            audit_out/raw/*.sarif

      - name: PR comment (summary)
        if: ${{ github.event_name == 'pull_request' }}
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          SCORE=$(jq '.summary.score' audit_out/report/audit.json)
          CRIT=$(jq '.summary.counts.critical' audit_out/report/audit.json)
          HIGH=$(jq '.summary.counts.high' audit_out/report/audit.json)
          MED=$(jq '.summary.counts.medium' audit_out/report/audit.json)
          LOW=$(jq '.summary.counts.low' audit_out/report/audit.json)
          echo "### 🔐 Audit Summary
          **Score:** $SCORE  
          **Findings:** CRIT $CRIT · HIGH $HIGH · MED $MED · LOW $LOW

          👉 Download the full **HTML report** and **JSON** from the workflow artifacts.
          " > pr_comment.md
          gh pr comment ${{ github.event.pull_request.number }} -F pr_comment.md || true

      - name: Fail build on criticals (policy gate)
        run: |
          CRIT=$(jq '.summary.counts.critical' audit_out/report/audit.json)
          if [ "$CRIT" -gt "0" ]; then
            echo "Critical issues present: $CRIT"
            exit 1
          fi