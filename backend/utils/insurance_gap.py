def insurance_gap_analysis(income, family_size, existing_cover):
    required = income * max(10, family_size * 3)
    gap = max(required - existing_cover, 0)

    if gap == 0:
        status = "adequately insured"
    else:
        status = "underinsured"

    return required, gap, status
