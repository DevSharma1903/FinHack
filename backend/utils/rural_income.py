def generate_variable_income_schedule(
    peak_income: int,
    lean_income: int,
    zero_months: int
):
    schedule = []

    for i in range(12):
        if i < zero_months:
            schedule.append(0)
        elif i % 2 == 0:
            schedule.append(peak_income)
        else:
            schedule.append(lean_income)

    return schedule
