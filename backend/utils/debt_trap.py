def detect_debt_trap(
    emi: int,
    min_income: int,
    loan_interest: float,
    investment_return: float = 8.0
):
    reasons = []

    if min_income > 0 and emi > 0.4 * min_income:
        reasons.append("EMI exceeds 40% of minimum income")

    if loan_interest > investment_return:
        reasons.append("Loan interest higher than investment return")

    return bool(reasons), reasons
