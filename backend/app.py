from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import os
import re
from typing import Any

from utils.allocation import get_allocation
from utils.projection import generate_projection 

app=FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status":"backend is running"}


def _humanize_pfm(pfm: str) -> str:
    mapping = {
        "adityabirla": "Aditya Birla",
        "axis": "Axis",
        "dsp": "DSP",
        "hdfc": "HDFC",
    }
    if pfm in mapping:
        return mapping[pfm]
    return pfm.replace("_", " ").title()


def _tier_label(tier: str) -> str:
    m = re.match(r"^tier(\d+)$", tier)
    if not m:
        return tier.replace("_", " ").title()
    num = m.group(1)
    if num == "1":
        return "Tier I"
    if num == "2":
        return "Tier II"
    return f"Tier {num}"


def _detect_columns(df: pd.DataFrame) -> tuple[str, str]:
    cols = [str(c).strip() for c in df.columns]
    lowered = {c: c.lower() for c in cols}

    date_candidates = [
        "date of nav",
        "nav date",
        "date",
    ]
    nav_candidates = [
        "nav value",
        "nav",
    ]

    date_col = None
    for cand in date_candidates:
        for c in cols:
            if lowered[c] == cand:
                date_col = c
                break
        if date_col:
            break
    if not date_col:
        for c in cols:
            if "date" in lowered[c]:
                date_col = c
                break

    nav_col = None
    for cand in nav_candidates:
        for c in cols:
            if lowered[c] == cand:
                nav_col = c
                break
        if nav_col:
            break
    if not nav_col:
        for c in cols:
            if "nav" in lowered[c] and ("value" in lowered[c] or lowered[c].strip() == "nav"):
                nav_col = c
                break
    if not nav_col:
        for c in cols:
            if "nav" in lowered[c]:
                nav_col = c
                break

    if not date_col or not nav_col:
        raise ValueError(f"Could not detect required columns. Found columns: {cols}")

    return date_col, nav_col


def _load_nps_nav_data() -> dict[str, Any]:
    base_dir = os.path.dirname(__file__)
    data_dir = os.path.join(base_dir, "data", "nps")
    if not os.path.isdir(data_dir):
        return {"schemes": []}

    schemes: list[dict[str, Any]] = []
    for filename in os.listdir(data_dir):
        if not filename.lower().endswith(".xls"):
            continue

        m = re.match(r"^(?P<pfm>[^_]+)_(?P<scheme>[^_]+)_(?P<tier>tier\d+)_last12m\.xls$", filename, re.IGNORECASE)
        if not m:
            continue

        pfm = m.group("pfm").lower()
        scheme = m.group("scheme").lower()
        tier = m.group("tier").lower()
        scheme_id = f"{pfm}_{scheme}_{tier}"

        path = os.path.join(data_dir, filename)
        df = pd.read_csv(path, sep="\t")
        date_col, nav_col = _detect_columns(df)

        df = df[[date_col, nav_col]].copy()
        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
        df[nav_col] = pd.to_numeric(df[nav_col], errors="coerce")
        df = df.dropna(subset=[date_col, nav_col])

        if not df.empty:
            max_date = df[date_col].max()
            cutoff = max_date - pd.DateOffset(months=12)
            df = df[df[date_col] >= cutoff]

        df = df.sort_values(date_col)

        label = f"{_humanize_pfm(pfm)} – Scheme {scheme.upper()} {_tier_label(tier)}"
        points = [
            {
                "date": d.strftime("%Y-%m-%d"),
                "nav": float(v),
            }
            for d, v in zip(df[date_col].dt.date, df[nav_col])
        ]

        schemes.append(
            {
                "id": scheme_id,
                "label": label,
                "points": points,
            }
        )

    schemes.sort(key=lambda s: s["id"])
    return {"schemes": schemes}


@app.get("/api/nps/nav-data")
def get_nps_nav_data():
    return _load_nps_nav_data()

saving_capacity_model = joblib.load("models/saving_capacity_model.pkl")
risk_profile_model = joblib.load("models/risk_profile_model.pkl")
le_savings = joblib.load("models/le_savings.pkl")
le_allocation = joblib.load("models/le_allocation.pkl")

class UserInput(BaseModel):
    Income: int 
    Age: int
    Dependents: int
    Occupation: str
    City_Tier: str
    Rent: int
    Loan_Repayment: int
    Insurance: int
    Groceries: int
    Transport: int
    Eating_Out: int
    Entertainment: int
    Utilities: int
    Healthcare: int
    Education: int
    Miscellaneous: int

@app.post("/investment-graph")
def investment_graph(user: UserInput):
    df = pd.DataFrame([user.dict()])

    saving_capacity_enc = saving_capacity_model.predict(df)
    risk_profile_enc = risk_profile_model.predict(df)

    saving_capacity = le_savings.inverse_transform(saving_capacity_enc)[0]
    risk_profile = le_allocation.inverse_transform(risk_profile_enc)[0]

    expenses = df.drop(columns=["Income", "Age", "Dependents", "Occupation", "City_Tier"]).sum(axis=1).iloc[0]
    monthly_savings = int(df["Income"].iloc[0] - expenses)

    sip_pct, rd_pct, fd_pct = get_allocation(saving_capacity, risk_profile)

    sip_m = float(monthly_savings * sip_pct / 100)
    rd_m = float(monthly_savings * rd_pct / 100)
    fd_m = float(monthly_savings * fd_pct / 100)

    projection = generate_projection(sip_m, rd_m, fd_m)

    return {
        "saving_capacity": saving_capacity,
        "risk_profile": risk_profile,
        "monthly_savings": round(monthly_savings, 2),
        "monthly_investment": {
            "sip": round(sip_m, 2),
            "rd": round(rd_m, 2),
            "fd": round(fd_m, 2),
        },
        "yearly_projection": projection
    }
