import numpy as np

def mc_impact(monthly_savings, annual_premium, years=20, sims=1000):
    monthly_invest = max(monthly_savings - annual_premium / 12, 0)

    returns = []
    for _ in range(sims):
        rate = np.random.normal(0.12, 0.04)
        corpus = monthly_invest * (((1 + rate/12)**(years*12) - 1) / (rate/12))
        returns.append(corpus)

    return int(np.mean(returns)), int(np.std(returns))
