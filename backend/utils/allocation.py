def get_allocation(savings_capacity, risk_factor):
    """returns allocation percentages for SIP, RD, FD based on model outputs"""

    allocation_table = {
        ("low", "aggressive"): (60, 30, 10),
        ("low", "balanced"): (40, 40, 20),
        ("low", "conservative"): (20, 40, 40),

        ("medium", "aggressive"): (70, 20, 10),
        ("medium", "balanced"): (50, 25, 25),
        ("medium", "conservative"): (30, 30, 40),

        ("high", "aggressive"): (80, 15, 5),
        ("high", "balanced"): (60, 20, 20),
        ("high", "conservative"): (40, 30, 30),
    }

    return allocation_table.get((savings_capacity, risk_factor))