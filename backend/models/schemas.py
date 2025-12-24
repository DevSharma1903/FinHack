from pydantic import BaseModel

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

class VariableIncomeInput(UserInput):
    Peak_Income: int
    Lean_Income: int
    Zero_Income_Months: int = 0

class MissedPaymentInput(UserInput):
    Missed_Months: int

class DebtTrapInput(BaseModel):
    Loan_Repayment: int
    Peak_Income: int
    Lean_Income: int
    Zero_Income_Months: int = 0
    Loan_Interest: float = 24.0

class InsuranceInput(BaseModel):
    age: int
    bmi: float
    smoker: int
    conditions: int
    income: int
    family_size: int
    existing_cover: int
    monthly_savings: int
 