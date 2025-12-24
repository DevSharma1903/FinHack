def generate_variable_projection(
    income_schedule,
    expenses,
    sip_pct,
    rd_pct,
    fd_pct,
    sip_return=0.12,
    rd_return=0.06,
    fd_return=0.05,
    years=10
):
    sip = rd = fd = 0.0
    sip_r = sip_return / 12
    rd_r = rd_return / 12
    fd_r = fd_return / 12

    projection = []
    month = 0

    for _ in range(years):
        for income in income_schedule:
            savings = max(income - expenses, 0)

            sip = sip * (1 + sip_r) + savings * sip_pct / 100
            rd = rd * (1 + rd_r) + savings * rd_pct / 100
            fd = fd * (1 + fd_r) + savings * fd_pct / 100

            month += 1
            projection.append({
                "month": month,
                "sip": round(sip, 2),
                "rd": round(rd, 2),
                "fd": round(fd, 2),
                "total": round(sip + rd + fd, 2)
            })

    return projection
