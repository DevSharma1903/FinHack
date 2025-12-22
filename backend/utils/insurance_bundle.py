def recommend_insurance_bundle(age, smoker, family_size, income):
    bundle = ["Term Life Insurance"]

    if age > 30 or family_size > 2:
        bundle.append("Health Insurance (Family Floater)")

    if smoker:
        bundle.append("Critical Illness Cover")

    if income > 500000:
        bundle.append("Accidental Disability Rider")

    return bundle
