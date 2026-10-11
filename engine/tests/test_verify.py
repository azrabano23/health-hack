from recommend.verify import check, code_for, is_rutgers, send


def test_only_rutgers_addresses_pass():
    assert is_rutgers("ab2895@scarletmail.rutgers.edu") and is_rutgers("someone@rutgers.edu") and is_rutgers("x@cs.rutgers.edu")
    assert not is_rutgers("me@gmail.com") and not is_rutgers("rutgers.edu@gmail.com") and not is_rutgers("not an email")


def test_code_round_trip_without_mail_service(monkeypatch):
    monkeypatch.delenv("SMTP_URL", raising=False)
    r = send("ab2895@scarletmail.rutgers.edu")
    assert r["ok"] and not r["sent"] and len(r["dev_code"]) == 6
    assert check("ab2895@scarletmail.rutgers.edu", r["dev_code"])
    assert not check("ab2895@scarletmail.rutgers.edu", "000000") or code_for("ab2895@scarletmail.rutgers.edu") == "000000"
    assert not check("me@gmail.com", r["dev_code"])


def test_sms_says_what_it_needs_and_gates_the_text(monkeypatch):
    monkeypatch.delenv("ACS_CONNECTION_STRING", raising=False)
    from recommend.verify import send_sms
    assert send_sms("+17325550100", "A short walk helps.")["sent"] is False
    assert "forbidden" in send_sms("+17325550100", "This is dangerous.")["why"]
