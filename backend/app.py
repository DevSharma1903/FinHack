from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib

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
