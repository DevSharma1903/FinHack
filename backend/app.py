from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import os
import re
from typing import Any
from datetime import datetime
import google.generativeai as genai

from models.schemas import (
    UserInput,
    VariableIncomeInput,
    MissedPaymentInput,
    DebtTrapInput,
    InsuranceInput,
    AdviceHashRequest,
    AdviceHashResponse
)

from utils.allocation import get_allocation
from utils.projection import generate_projection 
from utils.insurance_gap import insurance_gap_analysis
from utils.insurance_bundle import recommend_insurance_bundle
from utils.monte_carlo import mc_impact
from utils.rural_income import generate_variable_income_schedule
from utils.rural_projection import generate_variable_projection
from utils.debt_trap import detect_debt_trap
from utils.advice_hash import hash_advice

app=FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE"))

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
insurance_model = joblib.load("models/model.pkl")

ML_FEATURES = [
    "Income", "Age", "Dependents", "Occupation", "City_Tier",
    "Rent", "Loan_Repayment", "Insurance", "Groceries",
    "Transport", "Eating_Out", "Entertainment",
    "Utilities", "Healthcare", "Education", "Miscellaneous"
]

@app.post("/investment-graph")
def investment_graph(user: UserInput):
    df = pd.DataFrame([user.dict()])

    saving_capacity_enc = saving_capacity_model.predict(df)
    risk_profile_enc = risk_profile_model.predict(df)

    saving_capacity = le_savings.inverse_transform(saving_capacity_enc)[0]
    risk_profile = le_allocation.inverse_transform(risk_profile_enc)[0]

    expenses = df.drop(columns=["Income", "Age", "Dependents", "Occupation", "City_Tier"]).sum(axis=1).iloc[0]
    monthly_savings = int(df["Income"].iloc[0] - expenses)

    allocation = get_allocation(saving_capacity, risk_profile)
    if allocation is None:
        sip_pct, rd_pct, fd_pct = (50, 25, 25)
    else:
        sip_pct, rd_pct, fd_pct = allocation

    if user.sip_pct is not None and user.rd_pct is not None and user.fd_pct is not None:
        sip_pct = int(user.sip_pct)
        rd_pct = int(user.rd_pct)
        fd_pct = int(user.fd_pct)

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
        "yearly_projection": projection,
        "sip_pct": sip_pct,
        "rd_pct": rd_pct,
        "fd_pct": fd_pct,
    }

@app.post("/insurance-analysis")
def insurance_analysis(user: InsuranceInput):
    sample = pd.DataFrame([{
    "Age": user.age,
    "BMI": user.bmi,
    "Smoker": user.smoker,
    "Pre_Existing_Conditions": user.conditions,
    "Annual_Income": user.income
    }])

    monthly_premium = float(insurance_model.predict(sample)[0])
    annual_premium = float(monthly_premium * 12)

    required, gap, status = insurance_gap_analysis(
        user.income, user.family_size, user.existing_cover
    )

    bundle = recommend_insurance_bundle(
        user.age, user.smoker, user.family_size, user.income
    )

    mean_sip, std_sip = mc_impact(
        user.monthly_savings, annual_premium
    )

    return {
        "insurance_status": status,
        "required_cover": round(required),
        "coverage_gap": round(gap),
        "monthly_premium": round(monthly_premium),
        "annual_premium": round(annual_premium),
        "recommended_bundle": bundle,
        "sip_impact": {
            "mean_corpus": round(mean_sip),
            "risk_range": round(std_sip)
        }
    }


@app.post("/investment-graph/variable-income")
def variable_income_graph(user: VariableIncomeInput):
    df = pd.DataFrame([user.dict()])
    df_ml = df[ML_FEATURES]

    sc = le_savings.inverse_transform(
        saving_capacity_model.predict(df_ml)
    )[0]
    rp = le_allocation.inverse_transform(
        risk_profile_model.predict(df_ml)
    )[0]

    expenses = df.drop(
        columns=[
            "Income", "Age", "Dependents", "Occupation",
            "City_Tier", "Peak_Income", "Lean_Income",
            "Zero_Income_Months"
        ],
        errors="ignore"
    ).sum(axis=1).iloc[0]

    income_schedule = generate_variable_income_schedule(
        user.Peak_Income,
        user.Lean_Income,
        user.Zero_Income_Months
    )

    sip_pct, rd_pct, fd_pct = get_allocation(sc, rp)

    projection = generate_variable_projection(
        income_schedule,
        expenses,
        sip_pct,
        rd_pct,
        fd_pct
    )

    return {
        "saving_capacity": sc,
        "risk_profile": rp,
        "yearly_projection": projection
    }

@app.post("/investment-graph/missed-payments")
def missed_payment_impact(user: MissedPaymentInput):
    df = pd.DataFrame([user.dict()])
    df_ml = df[ML_FEATURES]

    sc = le_savings.inverse_transform(
        saving_capacity_model.predict(df_ml)
    )[0]
    rp = le_allocation.inverse_transform(
        risk_profile_model.predict(df_ml)
    )[0]

    expenses = df.drop(
        columns=[
            "Income", "Age", "Dependents", "Occupation",
            "City_Tier", "Missed_Months"
        ],
        errors="ignore"
    ).sum(axis=1).iloc[0]

    sip_pct, rd_pct, fd_pct = get_allocation(sc, rp)

    years = 10
    months = years * 12

    normal_schedule = [user.Income] * months
    missed_schedule = [0 if i < user.Missed_Months else user.Income for i in range(months)]

    normal = generate_variable_projection(
        normal_schedule,
        expenses,
        sip_pct,
        rd_pct,
        fd_pct,
        years=1
    )

    missed = generate_variable_projection(
        missed_schedule,
        expenses,
        sip_pct,
        rd_pct,
        fd_pct,
        years=1
    )

    return {
        "missed_months": user.Missed_Months,
        "normal_projection": normal,
        "missed_projection": missed
    }


@app.post("/debt-trap")
def debt_trap_check(data: DebtTrapInput):
    income_schedule = generate_variable_income_schedule(
        data.Peak_Income,
        data.Lean_Income,
        data.Zero_Income_Months
    )

    min_income = min([i for i in income_schedule if i > 0], default=0)

    flag, reasons = detect_debt_trap(
        emi=data.Loan_Repayment,
        min_income=min_income,
        loan_interest=data.Loan_Interest
    )

    return {
        "debt_trap": flag,
        "reasons": reasons,
        "min_income_used": min_income
    }

@app.post("/api/advice/hash", response_model=AdviceHashResponse)
def hash_financial_advice(payload: AdviceHashRequest):
    advice_hash = hash_advice(payload.advice_text)

    record = {
        "user_id": payload.user_id,
        "model_used": payload.model_used,
        "advice_hash": advice_hash,
        "created_at": datetime.utcnow().isoformat()
    }

    return {
        "advice_hash": advice_hash,
        "created_at": record["created_at"]
    }

@app.post("/api/advice/verify")
def verify_advice_integrity(advice_text: str, stored_hash: str):
    computed_hash = hash_advice(advice_text)

    return {
        "valid": computed_hash == stored_hash,
        "computed_hash": computed_hash
    }

# Gemini prediction schema
class GeminiRequest(BaseModel):
    prompt: str

@app.post("/api/gemini/predict")
def gemini_predict(request: GeminiRequest):
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(request.prompt)
        
        return {
            "response": response.text,
            "status": "success"
        }
    except Exception as e:
        return {
            "response": f"Error: {str(e)}",
            "status": "error"
        }
