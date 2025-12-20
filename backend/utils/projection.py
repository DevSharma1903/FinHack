def generate_projection(sip_m, rd_m, fd_m, years=10):
    sip_r = 0.12 / 12
    rd_r = 0.065 / 12
    fd_r = 0.06

    data = []

    for year in range(1, years + 1):
        m = year * 12

        sip = sip_m * (((1 + sip_r)**m - 1) / sip_r) * (1 + sip_r)
        rd = rd_m * (((1 + rd_r)**m - 1) / rd_r) * (1 + rd_r)
        fd = fd_m * 12 * (((1 + fd_r)**year - 1) / fd_r)

        data.append({
            "year": int(year),
            "sip": float(round(sip, 2)),
            "rd": float(round(rd, 2)),
            "fd": float(round(fd, 2))
        })

    return data
